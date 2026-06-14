import secrets
from functools import wraps
from flask import request, session, jsonify
from bson import ObjectId
from mongoConf import users_collection


def csrf_protect(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        expected = session.get("csrf_token")
        print(session.get("user_id"))
        received = request.headers.get("X-CSRF-Token")
        print(expected)
        print(received)

        if not expected or not received or not secrets.compare_digest(expected, received):
            return jsonify({"ok": False, "message": "Ungültiger CSRF-Token"}), 403

        return fn(*args, **kwargs)

    return wrapper


def get_session_user():
    user_id = session.get("user_id")
    if not user_id or not ObjectId.is_valid(user_id):
        return None, (jsonify({"ok": False, "message": "Nicht angemeldet"}), 401)
    user = users_collection.find_one({"_id": ObjectId(user_id), "emailVerify.email_verified": True})
    if not user:
        session.clear()
        return None, (jsonify({"ok": False, "message": "Nicht angemeldet"}), 401)
    return user, None


def is_admin(user):
    return "admin" in user.get("roles", [])


def check_access(session_user, target_user_id):
    if is_admin(session_user):
        return True
    return str(session_user["_id"]) == str(target_user_id)
