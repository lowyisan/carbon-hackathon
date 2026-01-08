from app import create_app
from app.db import db

app = create_app()

# Create tables on first run
with app.app_context():
    db.create_all()

if __name__ == "__main__":
    # Debug true for local dev
    app.run(host="0.0.0.0", port=5000, debug=True)
