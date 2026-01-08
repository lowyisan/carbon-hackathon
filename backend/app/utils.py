from werkzeug.security import generate_password_hash, check_password_hash

def hash_password(plain_password: str) -> str:
    # Hash the password so we never store raw passwords
    return generate_password_hash(plain_password)
def verify_password(password_hash: str, plain_password: str) -> bool:
    # Verify user login password
    return check_password_hash(password_hash, plain_password)