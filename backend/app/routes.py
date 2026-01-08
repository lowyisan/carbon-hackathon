from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity

from .db import db
from .models import Company, CompanyAccountBalance, OutstandingRequest, RequestReceived
from .utils import hash_password, verify_password

api = Blueprint("api", __name__)

def bad_request(message: str, code: int = 400):
    return jsonify({"error": message}), code

def get_json():
    # Safely parse JSON
    data = request.get_json(silent=True)
    if data is None:
        return None
    return data

def validate_email(email: str) -> bool:
    return isinstance(email, str) and "@" in email and len(email) <= 120

def validate_password(pw: str) -> bool:
    # Simple rules for hackathon
    return isinstance(pw, str) and len(pw) >= 8

def validate_request_type(rt: str) -> bool:
    return rt in ["BUY", "SELL"]

@api.post("/auth/register")
def register():
    data = get_json()
    if not data:
        return bad_request("Missing JSON body")

    company_name = data.get("companyName", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    # Backend validation
    if not company_name:
        return bad_request("Company name is required")
    if not validate_email(email):
        return bad_request("Valid email is required")
    if not validate_password(password):
        return bad_request("Password must be at least 8 characters")

    # Ensure unique
    if Company.query.filter_by(email=email).first():
        return bad_request("Email already registered")

    c = Company(
        company_name=company_name,
        email=email,
        password_hash=hash_password(password),
    )
    db.session.add(c)
    db.session.commit()

    # Give the new company starting balances
    bal = CompanyAccountBalance(company_id=c.id, carbon_balance=1000.0, cash_balance=500000.0)
    db.session.add(bal)
    db.session.commit()

    return jsonify({"message": "Registered successfully"}), 201

@api.post("/auth/login")
def login():
    data = get_json()
    if not data:
        return bad_request("Missing JSON body")

    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not validate_email(email):
        return bad_request("Valid email is required")
    if not password:
        return bad_request("Password is required")

    c = Company.query.filter_by(email=email).first()
    if not c or not verify_password(c.password_hash, password):
        return bad_request("Invalid email or password", 401)

    # JWT identity will store the company id
    token = create_access_token(identity={"company_id": c.id})
    return jsonify({"token": token})

@api.get("/me/balances")
@jwt_required()
def me_balances():
    identity = get_jwt_identity()
    company_id = identity["company_id"]

    c = Company.query.get(company_id)
    bal = CompanyAccountBalance.query.filter_by(company_id=company_id).first()

    return jsonify({
        "companyName": c.company_name,
        "carbonBalance": bal.carbon_balance,
        "cashBalance": bal.cash_balance
    })

@api.get("/me/requests")
@jwt_required()
def my_requests():
    identity = get_jwt_identity()
    company_id = identity["company_id"]

    reqs = OutstandingRequest.query.filter_by(requester_company_id=company_id).order_by(OutstandingRequest.request_date.desc()).all()

    results = []
    for r in reqs:
        results.append({
            "id": r.id,
            "requestDate": r.request_date.isoformat(),
            "requestType": r.request_type,
            "requestReason": r.request_reason,
            "carbonUnitPrice": r.carbon_unit_price,
            "carbonQuantity": r.carbon_quantity,
            "status": r.status
        })
    return jsonify(results)

@api.post("/requests")
@jwt_required()
def create_request():
    identity = get_jwt_identity()
    company_id = identity["company_id"]

    data = get_json()
    if not data:
        return bad_request("Missing JSON body")

    request_type = data.get("requestType")
    request_reason = (data.get("requestReason") or "").strip()
    carbon_unit_price = data.get("carbonUnitPrice")
    carbon_quantity = data.get("carbonQuantity")

    # Backend validation
    if not validate_request_type(request_type):
        return bad_request("requestType must be BUY or SELL")
    if not request_reason:
        return bad_request("requestReason is required")

    try:
        price = float(carbon_unit_price)
        qty = float(carbon_quantity)
    except (TypeError, ValueError):
        return bad_request("carbonUnitPrice and carbonQuantity must be numbers")

    if price <= 0 or qty <= 0:
        return bad_request("carbonUnitPrice and carbonQuantity must be > 0")

    r = OutstandingRequest(
        requester_company_id=company_id,
        request_type=request_type,
        request_reason=request_reason,
        carbon_unit_price=price,
        carbon_quantity=qty
    )
    db.session.add(r)
    db.session.commit()

    # For hackathon simplicity: broadcast this request to all other companies as "received"
    other_companies = Company.query.filter(Company.id != company_id).all()
    for oc in other_companies:
        rr = RequestReceived(request_id=r.id, receiver_company_id=oc.id, overdue_alert_viewed=False)
        db.session.add(rr)

    db.session.commit()

    return jsonify({"id": r.id}), 201

@api.get("/requests/received")
@jwt_required()
def received_requests():
    identity = get_jwt_identity()
    company_id = identity["company_id"]

    # Join received items with outstanding request
    received = RequestReceived.query.filter_by(receiver_company_id=company_id).all()
    results = []

    for rr in received:
        r = OutstandingRequest.query.get(rr.request_id)
        # compute overdue: 7 days after request_date
        overdue = datetime.utcnow() > (r.request_date + timedelta(days=7))

        results.append({
            "receivedId": rr.id,
            "requestId": r.id,
            "requestDate": r.request_date.isoformat(),
            "requestType": r.request_type,
            "requestReason": r.request_reason,
            "carbonUnitPrice": r.carbon_unit_price,
            "carbonQuantity": r.carbon_quantity,
            "status": r.status,
            "overdue": overdue,
            "overdueAlertViewed": rr.overdue_alert_viewed
        })

    return jsonify(results)

@api.post("/requests/<int:request_id>/decision")
@jwt_required()
def decide_request(request_id: int):
    identity = get_jwt_identity()
    company_id = identity["company_id"]

    data = get_json()
    if not data:
        return bad_request("Missing JSON body")

    decision = data.get("decision")
    if decision not in ["ACCEPT", "REJECT"]:
        return bad_request("decision must be ACCEPT or REJECT")

    r = OutstandingRequest.query.get(request_id)
    if not r:
        return bad_request("Request not found", 404)

    if r.status != "PENDING":
        return bad_request("Request already decided")

    # Apply decision
    if decision == "REJECT":
        r.status = "REJECTED"
        db.session.commit()
        return jsonify({"status": r.status})

    # ACCEPT decision
    r.status = "ACCEPTED"

    # Update balances for requester and receiver
    requester_bal = CompanyAccountBalance.query.filter_by(company_id=r.requester_company_id).first()
    receiver_bal = CompanyAccountBalance.query.filter_by(company_id=company_id).first()

    total_price = r.carbon_unit_price * r.carbon_quantity

    # Very simple trading logic:
    # If requester is BUY, requester pays cash and receives carbon
    # If requester is SELL, requester receives cash and loses carbon
    if r.request_type == "BUY":
        # receiver is selling to requester
        if receiver_bal.carbon_balance < r.carbon_quantity:
            return bad_request("Receiver has insufficient carbon balance", 400)

        if requester_bal.cash_balance < total_price:
            return bad_request("Requester has insufficient cash balance", 400)

        requester_bal.cash_balance -= total_price
        requester_bal.carbon_balance += r.carbon_quantity

        receiver_bal.cash_balance += total_price
        receiver_bal.carbon_balance -= r.carbon_quantity

    else:
        # requester is SELL, receiver is buying
        if requester_bal.carbon_balance < r.carbon_quantity:
            return bad_request("Requester has insufficient carbon balance", 400)

        if receiver_bal.cash_balance < total_price:
            return bad_request("Receiver has insufficient cash balance", 400)

        requester_bal.cash_balance += total_price
        requester_bal.carbon_balance -= r.carbon_quantity

        receiver_bal.cash_balance -= total_price
        receiver_bal.carbon_balance += r.carbon_quantity

    db.session.commit()
    return jsonify({"status": r.status})

@api.post("/requests/received/<int:received_id>/mark-overdue-viewed")
@jwt_required()
def mark_overdue_viewed(received_id: int):
    identity = get_jwt_identity()
    company_id = identity["company_id"]

    rr = RequestReceived.query.get(received_id)
    if not rr or rr.receiver_company_id != company_id:
        return bad_request("Not found", 404)

    rr.overdue_alert_viewed = True
    db.session.commit()
    return jsonify({"ok": True})
