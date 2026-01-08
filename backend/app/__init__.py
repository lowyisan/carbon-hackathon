from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager

from .db import db

jwt = JWTManager()

def create_app():
    app = Flask(__name__)

    # Simple config for hackathon
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///app.db"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    # Change this in real apps, but ok for hackathon demo
    app.config["JWT_SECRET_KEY"] = "dev-secret-change-me"

    CORS(app)  # allow frontend calls
    db.init_app(app)
    jwt.init_app(app)

    # Import models so tables can be created
    from . import models  # noqa: F401

    # Register routes
    from .routes import api
    app.register_blueprint(api, url_prefix="/api")

    return app
