from bson import ObjectId
from werkzeug.security import generate_password_hash


def make_user(email="test@gmail.com", password="test123", roles=None, verified=True):
    return {
        "_id": ObjectId(),
        "email": email,
        "password": generate_password_hash(password),
        "emailVerify": {"email_verified": verified},
        "roles": ["member"] if roles is None else roles,
        "online": 0,
    }
