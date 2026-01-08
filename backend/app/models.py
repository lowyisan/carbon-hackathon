from datetime import datetime
from .db import db

class Company(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    company_name = db.Column(db.String(120), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)

class CompanyAccountBalance(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    company_id = db.Column(db.Integer, db.ForeignKey("company.id"), nullable=False)

    carbon_balance = db.Column(db.Float, nullable=False, default=0.0)
    cash_balance = db.Column(db.Float, nullable=False, default=0.0)

class OutstandingRequest(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    requester_company_id = db.Column(db.Integer, db.ForeignKey("company.id"), nullable=False)

    request_type = db.Column(db.String(10), nullable=False)  # "BUY" or "SELL"
    request_reason = db.Column(db.String(255), nullable=False)

    carbon_unit_price = db.Column(db.Float, nullable=False)
    carbon_quantity = db.Column(db.Float, nullable=False)

    request_date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    status = db.Column(db.String(20), nullable=False, default="PENDING")  # PENDING/ACCEPTED/REJECTED

class RequestReceived(db.Model):
    id = db.Column(db.Integer, primary_key=True)

    # request belongs to one outstanding request
    request_id = db.Column(db.Integer, db.ForeignKey("outstanding_request.id"), nullable=False)

    receiver_company_id = db.Column(db.Integer, db.ForeignKey("company.id"), nullable=False)

    # track whether overdue popup was shown
    overdue_alert_viewed = db.Column(db.Boolean, nullable=False, default=False)
