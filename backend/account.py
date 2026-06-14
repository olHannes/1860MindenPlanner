
from mongoConf import *
from flask import session
from extension import limiter
from bson import ObjectId
from datetime import datetime, timezone
from werkzeug.security import check_password_hash, generate_password_hash
import secrets

from security import csrf_protect, get_session_user, check_access
from validation import *

account_bp = Blueprint('account', __name__)

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://127.0.0.1:5500")

def parse_expires_at(expires_at):
    if expires_at is None:
        return None
    if isinstance(expires_at, datetime):
        return expires_at if expires_at.tzinfo else expires_at.replace(tzinfo=timezone.utc)
    if isinstance(expires_at, str):
        s = expires_at.strip().replace("Z", "+00:00")
        return datetime.fromisoformat(s)
    return None


################################################################################################### Registrierung
@account_bp.route('/account/verify', methods=['POST'])
def verify_account():
    data    = request.get_json(silent=True) or {}
    token   = data.get('token')
    uid     = data.get('uid')

    if not token or not uid or not ObjectId.is_valid(uid):
        return jsonify({"ok": False, "message": "uid und token sind notwendig."}), 400

    user = users_collection.find_one({"_id": ObjectId(uid)})
    if not user:
        return jsonify({"ok": False, "message": "Nutzer nicht gefunden."}), 404
    
    ev = (user.get("emailVerify") or {})
    if ev.get("email_verified") is True:
        return jsonify({"ok": True, "message": "E-Mail ist bereits verifiziert."}), 200
    
    stored_hash = ev.get("token_hash")
    if not stored_hash or not check_password_hash(stored_hash, token):
        return jsonify({"ok": False, "message": "Token ist ungültig."}), 401

    users_collection.update_one(
        {"_id": user["_id"]},
        {"$set": {"emailVerify.email_verified": True},
         "$unset": {"emailVerify.token_hash": ""}}
    )
    return jsonify({"ok": True, "message": "Nutzervalidierung war erfolgreich"}), 200


@account_bp.route('/account/register', methods=['POST'])
@limiter.limit("2 per hour")
def register():
    data = request.get_json(silent=True) or {}
    first_name  = data.get('firstName')
    last_name   = data.get('lastName')
    email       = data.get('email')
    password    = data.get('password')

    fn, ln, em, errors = validate_registration(first_name, last_name, email, password)
    if errors:
        return jsonify({
            "ok": False,
            "message": "Validierung fehlgeschlagen",
            "errors": errors
        }), 400

    if users_collection.find_one({"email": em}):
        return jsonify({
            "ok": False,
            "message": "Validierung fehlgeschlagen",
            "errors": {"email": "Email bereits vergeben!"}
        }), 409

    hashed_password = generate_password_hash(password)

    verifyCode = secrets.token_urlsafe(32)
    verifyHash = generate_password_hash(verifyCode)

    result = users_collection.insert_one({
        'firstName': fn, 
        'lastName': ln, 
        'email': em,
        'password': hashed_password, 
        'online': 0, 
        'color_code': '#000000', 
        'visibility': 1,
        'roles': ['member'],
        'passwordReset': {
            'code_hash': None,
            'expires_at': None,
            'attempts': 0 
        },
        'emailVerify': {
            'token_hash': verifyHash,
            'email_verified': False
        }
    })

    full_name = fn + " " + ln
    verify_link = f"{FRONTEND_URL}/verifyAccount.html#uid={str(result.inserted_id)}&token={verifyCode}"
    verifyEmail = notification.build_verify(em, verify_link, full_name)
    notification.send_mail(verifyEmail)

    return jsonify({"ok": True, "message": "Registrierung erfolgreich!"}), 200


@account_bp.route('/account/me', methods=["GET"])
def get_current_user():
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({
            "ok": False,
            "message": "Nicht angemeldet"
        }), 401
    if not ObjectId.is_valid(user_id):
        session.clear()
        return jsonify({
            "ok": False,
            "message": "Ungültige Session"
        }), 401
    
    user = users_collection.find_one({
        "_id": ObjectId(user_id),
        "emailVerify.email_verified": True
    })
    if not user:
        session.clear()
        return jsonify({
            "ok": False,
            "message": "Nutzer nicht gefunden"
        }), 401
    
    roles = user.get("roles", ["member"])

    return jsonify({
        "ok": True,
        "user": {
            "id": str(user["_id"]),
            "email": user.get("email"),
            "firstName": user.get("firstName", ""),
            "lastName": user.get("lastName", ""),
            "roles": roles,
            "isAdmin": "admin" in roles,
            "color": user.get("color_code", "#000000"),
            "visibility": user.get("visibility", 1),
            "autoLogin": session.permanent
        }
    }), 200


################################################################################################### Login

@account_bp.route('/account/login', methods=['POST'])
@limiter.limit("5 per minute;20 per hour")
def login():
    data    = request.get_json(silent=True) or {}
    email   = data.get('email') or ""
    password = data.get('password') or ""
    remember = bool(data.get('remember'))

    em, errors = validate_login(email, password)
    if errors:
        return jsonify({
            "ok": False,
            "message": "Validierung fehlgeschlagen.",
            "errors": errors
        }), 400
    
    user = users_collection.find_one({ "email": em, "emailVerify.email_verified": True})
    if not user:
        return jsonify({
            "ok": False,
            "message": "E-Mail oder Passwort ist falsch oder Nutzer wurde nicht freigeschaltet.",
        }), 404
    
    if not check_password_hash(user["password"], password):
        return jsonify({
            "ok": False,
            "message": "E-Mail oder Passwort ist falsch."
        }), 401
    
    session.clear()
    session.permanent = remember
    session["user_id"] = str(user["_id"])

    roles       = user.get("roles", ["member"])
    is_admin    = "admin" in roles

    response = {
        "ok": True,
        "message": "Login erfolgreich!",
        "userId": str(user["_id"]),
        "roles": roles,
        "isAdmin": is_admin
    }

    if not is_admin:
        users_collection.update_one(
            {"_id": user["_id"]},
            {"$inc": {"online": 1}}
            )
    
    return jsonify(response), 200


################################################################################################### Logout

@account_bp.route('/account/logout', methods=['POST'])
@csrf_protect
def logout():
    session_user, error = get_session_user()
    if error:
        return error
    
    target_user_id = str(session_user["_id"])
    
    if target_user_id and ObjectId.is_valid(target_user_id):
        users_collection.update_one(
            {"_id": ObjectId(target_user_id)},
            {"$inc": {"online": -1}}
        )
    session.clear()
    return jsonify({"ok": True, "message": "Erfolgreich ausgeloggt!"}), 200


################################################################################################### update Password after Request

@account_bp.route('/account/forgot/updatePassword', methods=['POST'])
@limiter.limit("5 per hour")
def request_new_password():
    data            = request.get_json(silent=True) or {}
    email           = data.get('email')
    confirm_code    = data.get('confirm_code')
    new_password    = data.get('new_password')

    if not email:
        return jsonify({"ok": False, "message": "E-Mail Parameter fehlt"}), 400
    if not confirm_code:
        return jsonify({"ok": False, "message": "Verifizierungscode muss vorhanden sein"}), 400
    if not new_password:
        return jsonify({"ok": False, "message": "Neues Passwort muss vorhanden sein"}), 400
    if len(new_password) < 4:
        return jsonify({"ok": False, "message": "Das neue Passwort muss mindestens 4 Zeichen lang sein"}), 403

    em = normalize_email(email)

    user = users_collection.find_one({"email": em})
    if not user:
        return jsonify({"ok": False, "message": "Nutzer mit dieser E-Mail nicht gefunden!"}), 404

    pr = user.get("passwordReset") or {}
    code_hash = pr.get("code_hash")
    expires_at_raw = pr.get("expires_at")
    attempts = pr.get("attempts", 0)

    expires_at = parse_expires_at(expires_at_raw)
    now = datetime.now(timezone.utc)

    if not code_hash or not expires_at or expires_at <= now:
        users_collection.update_one(
            {"_id": user["_id"]},
            {"$unset": {"passwordReset": ""}}
        )
        return jsonify({"ok": False, "message": "Der Verifizierungs Code ist nicht gültig"}), 403
    
    if attempts >=5:
        return({"ok": False, "message": "Die Versuchsanzahl ist überschritten"}), 403

    if not check_password_hash(code_hash, confirm_code):
        users_collection.update_one(
            {"_id": user["_id"]},
            {"$inc": {"passwordReset.attempts": 1}}
        )
        return jsonify({"ok": False, "message": "Der Verifizierungs Code ist nicht gültig"}), 403
    
    new_hashed_password = generate_password_hash(new_password)
    users_collection.update_one(
        {"_id": user["_id"]},
        {
            "$set": { "password": new_hashed_password},
            "$unset": {"passwordReset": ""}
        }
    )
    return jsonify({"ok": True, "message": "Passwort erfolgreich aktualisiert!"}), 200


################################################################################################### update Password

@account_bp.route('/account/change/password', methods=['POST'])
@csrf_protect
def update_password():
    session_user, error = get_session_user()
    if error:
        return error
    data            = request.get_json(silent=True) or {}
    target_user_id  = data.get("userId") or str(session_user["_id"])
    confirm_code    = data.get('confirm_code')
    new_password    = data.get('new_password')

    
    if not target_user_id or not ObjectId.is_valid(target_user_id):
        return jsonify({"ok": False, "message": "Ungültiger Wert oder fehlende User-ID"}), 400
    if not confirm_code:
        return jsonify({"ok": False, "message": "Verifizierungscode muss vorhanden sein"}), 400
    if not new_password:
        return jsonify({"ok": False, "message": "Neues Passwort muss vorhanden sein"}), 400
    if len(new_password) < 4:
        return jsonify({"ok": False, "message": "Das neue Passwort muss mindestens 4 Zeichen lang sein"}), 403

    user = users_collection.find_one({"_id": ObjectId(target_user_id)})
    if not user:
        return jsonify({"ok": False, "message": "Nutzer nicht gefunden!"}), 404

    pr = user.get("passwordReset") or {}
    code_hash = pr.get("code_hash")
    expires_at_raw = pr.get("expires_at")
    attempts = pr.get("attempts", 0)

    expires_at = parse_expires_at(expires_at_raw)
    now = datetime.now(timezone.utc)

    if not code_hash or not expires_at or expires_at <= now:
        users_collection.update_one(
            {"_id": user["_id"]},
            {"$unset": {"passwordReset": ""}}
        )
        return jsonify({"ok": False, "message": "Confirm-Code war nicht gültig"}), 403
    
    if attempts >=5:
        return({"ok": False, "message": "Zu viele Versuche"}), 403

    if not check_password_hash(code_hash, confirm_code):
        users_collection.update_one(
            {"_id": user["_id"]},
            {"$inc": {"passwordReset.attempts": 1}}
        )
        return jsonify({"ok": False, "message": "Confirm-Code war nicht gültig"}), 403
    
    new_hashed_password = generate_password_hash(new_password)
    users_collection.update_one(
        {"_id": user["_id"]},
        {
            "$set": { "password": new_hashed_password},
            "$unset": {"passwordReset": ""}
        }
    )
    return jsonify({"ok": True, "message": "Passwort erfolgreich aktualisiert!"}), 200


################################################################################################### send Request Code (mail)

@account_bp.route('/account/passwordReset/request', methods=['POST'])
#@csrf_protect
@limiter.limit("3 per hour")
def request_password_reset():
    data    = request.get_json(silent=True) or {}
    email   = data.get("email")
    if not email:
        return jsonify({"ok": False, "message": "E-Mail benötigt"}), 400
    
    em = normalize_email(email)

    user = users_collection.find_one({"email": em})
    if not user:
        return jsonify({"ok": False, "message": "Nutzer nicht gefunden"}), 404
    
    code = f"{secrets.randbelow(1_000_000):06d}"
    code_hash = generate_password_hash(code)
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)

    users_collection.update_one(
        {"_id": user["_id"]},
        {"$set": {
            "passwordReset.code_hash": code_hash,
            "passwordReset.expires_at": expires_at,
            "passwordReset.attempts": 0
        }}
    )
    em = notification.build_reset(email, code, user["firstName"], 15)
    notification.send_mail(em)

    return jsonify({"ok": True, "message": "Reset erfolgreich versendet"}), 200


################################################################################################### Delete Account

@account_bp.route('/account/delete', methods=['DELETE'])
@csrf_protect
def delete_account():
    session_user, error = get_session_user()
    if error:
        return error
    data        = request.get_json(silent=True) or {}
    target_user_id = data.get("userId") or str(session_user["_id"])
    pwd         = data.get('password')

    if not target_user_id or not ObjectId.is_valid(target_user_id):
        return jsonify({"ok": False, "message": "Ungültiger Wert oder fehlende User-ID"}), 400
    if not check_access(session_user, target_user_id):
        return jsonify({
            "ok": False,
            "message": "Nicht erlaubt"
        }), 403
    if not pwd:
        return jsonify({"ok": False, "message": "Passwort muss angegeben werden."}), 400

    user = users_collection.find_one({"_id": ObjectId(target_user_id) })
    if not user:
        return jsonify({"ok": False, "message": "Nutzer nicht gefunden"}), 404

    if not check_password_hash(user['password'], pwd):
        return jsonify({"ok": False, "message": "Ungültiges Passwort"}), 403
    
    users_collection.delete_one({"_id": ObjectId(target_user_id)})
    competition_entries_collection.delete_many({"userId": ObjectId(target_user_id)})
    exercises_collection.delete_many({"userId": ObjectId(target_user_id)})
    
    session.clear()
    return jsonify({"ok": True, "message": "Account erfolgreich gelöscht!", "username": user["firstName"]}), 200


################################################################################################### Getter -> User Information

@account_bp.route('/account/info', methods=['GET'])
def get_user_info():
    target_user_id  = request.args.get('userId')
    session_user, error    = get_session_user()
    if error:
        return error
    request_user_id = str(session_user["_id"])
    if not ObjectId.is_valid(request_user_id):
        return jsonify({
            "ok": False,
            "message": "Ungültige Request-Session"
        }), 400
    if not check_access(session_user, target_user_id):
        return jsonify({
            "ok": False,
            "message": "Nicht erlaubt"
        }), 403

    if not target_user_id or not ObjectId.is_valid(target_user_id):
            return jsonify({"ok": False, "message": "Ungültiger Wert oder fehlende User-ID"}), 400

    user = users_collection.find_one({ "_id": ObjectId(target_user_id) })
    if not user:
        return jsonify({"ok": False, "message": "Benutzer nicht gefunden!"}), 404

    return jsonify({
        "ok": True,
        "first_name": user['firstName'],
        "last_name": user['lastName'],
        "email": user['email'],
        "color_code": user.get('color_code', '#000000'),
        "visibility": user.get('visibility', 1)
    }), 200


################################################################################################### Setter -> User Information

@account_bp.route('/account/change/name', methods=['POST'])
@csrf_protect
def changeData():
    session_user, error = get_session_user()
    if error:
        return error
    data = request.get_json(silent=True) or {}
    target_user_id = data.get("userId") or session_user["_id"]
    new_first_name = data.get('new_first_name')
    new_last_name = data.get('new_last_name')

    if not target_user_id or not ObjectId.is_valid(target_user_id):
        return jsonify({"ok": False, "message": "Interner Fehler - Id nicht gültig"}), 403
    if not check_access(session_user, target_user_id):
        return jsonify({
            "ok": False,
            "message": "Nicht erlaubt"
        }), 403

    new_first_name = normalize_name(new_first_name)
    new_last_name = normalize_name(new_last_name)

    if not new_first_name or len(new_first_name) < 2:
        return jsonify({"ok": False, "message": "Vorname muss mindestens 2 Zeichen lang sein"}), 400
    if not new_last_name or len(new_last_name) < 2:
        return jsonify({"ok": False, "message": "Nachname muss mindestens 2 Zeichen lang sein"}), 400
    
    if not NAME_RE.match(new_first_name):
        return jsonify({"ok": False, "message": "Vorname darf nur Buchstaben und Leerzeichen enthalten"}), 404
    if not NAME_RE.match(new_last_name):
        return jsonify({"ok": False, "message": "Nachname darf nur Buchstaben und Leerzeichen enthalten"}), 400

    user = users_collection.find_one({"_id": ObjectId(target_user_id)})
    if not user:
        return jsonify({"ok": False, "message": "Nutzer nicht gefunden"}), 404

    users_collection.update_one(
        {"_id": ObjectId(target_user_id)},
        {"$set": {"firstName": new_first_name, "lastName": new_last_name}}
    )

    return jsonify({
        "ok": True,
        "message": "Benutzerdaten erfolgreich aktualisiert",
        "new_first_name": new_first_name,
        "new_last_name": new_last_name
    }), 200


################################################################################################### set Color Code

@account_bp.route('/account/change/color', methods=['POST'])
@csrf_protect
def change_user_color():
    session_user, error = get_session_user()
    if error:
        return error
    data = request.get_json(silent=True) or {}
    target_user_id = data.get("userId") or session_user["_id"]
    new_color = data.get('colorCode')

    if not isinstance(new_color, str) or not new_color.startswith('#') or len(new_color) != 7:
        return jsonify({"ok": False, "message": "Ungültiges Farbformat! Verwende das Format '#xxxxxx'."}), 400

    if not target_user_id or not ObjectId.is_valid(target_user_id):
        return jsonify({"ok": False, "message": "Benutzer-ID fehlt oder ist ungültig!"}), 400

    if not check_access(session_user, target_user_id):
        return jsonify({
            "ok": False,
            "message": "Nicht erlaubt"
        }), 403

    user = users_collection.find_one({"_id": ObjectId(target_user_id)})
    if not user:
        return jsonify({"ok": False, "message": "Nutzer nicht gefunden."}), 404

    users_collection.update_one({"_id": ObjectId(target_user_id)}, {"$set": {"color_code": new_color}})

    return jsonify({"ok": True, "message": "Farbcode erfolgreich aktualisiert!"}), 200


################################################################################################### set Visibility status

@account_bp.route("/account/change/visibility", methods=['POST'])
@csrf_protect
def change_user_visibility():
    session_user, error = get_session_user()
    if error:
        return error
    data = request.get_json(silent=True) or {}
    target_user_id = data.get("userId") or session_user["_id"]
    visibility_status = data.get('visibility')

    if not target_user_id or not ObjectId.is_valid(target_user_id):
        return jsonify({"ok": False, "message": "Ungültiger Wert oder fehlende User-ID"}), 400
    if visibility_status is None:
        return jsonify({"ok": False, "message": "Fehlender Parameter für den Sichtbarkeitsstatus"}), 400
    
    if not check_access(session_user, target_user_id):
        return jsonify({
            "ok": False,
            "message": "Nicht erlaubt"
        }), 403

    user = users_collection.find_one({"_id": ObjectId(target_user_id)})
    if not user:
        return jsonify({"ok": False, "message": "Nutzer nicht gefunden"}), 404
    
    users_collection.update_one(
        {"_id": ObjectId(target_user_id)},
        {"$set": {"visibility": visibility_status}}
    )
    return jsonify({"ok": True, "message": "Successfully updated visibility status!", "userId": str(target_user_id), "visibility": visibility_status}), 200


################################################################################################### toggle auto Login

@account_bp.route("/account/change/autoLogin", methods=['POST'])
@csrf_protect
def change_user_autoLogin():
    session_user, error = get_session_user()
    if error:
        return error
    
    data        = request.get_json(silent=True) or {}
    remember    = data.get("remember")
    session.permanent = remember
    return jsonify({"ok": True, "message": f"autoLogin wurde erfolgreich auf '{remember}' geändert"}), 200


################################################################################################### add learned Element

@account_bp.route("/account/elements/learned/add", methods=["POST"])
@csrf_protect
def add_learned_element():
    user_id         = session.get("user_id")
    data            = request.get_json(silent=True) or {}
    element_code    = data.get("elementCode")

    if not user_id or not ObjectId.is_valid(user_id):
        return jsonify({"ok": False, "message": "Ungültiger Wert oder fehlende User-ID"}), 400
    if not element_code:
        return jsonify({"ok": False, "message": "Fehlende Element-ID"}), 400
    
    user = users_collection.find_one({"_id": ObjectId(user_id)})
    if not user:
        return jsonify({"ok": False, "message": "Nutzer nicht gefunden"}), 404

    users_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$addToSet": {"learnedElements": element_code}}
    )
    return jsonify({"ok": True, "message": "Element erfolgreich hinzugefügt.", "userId": user_id, "elementId": element_code}), 200


################################################################################################### remove learned Element

@account_bp.route('/account/elements/learned/remove', methods=['POST'])
@csrf_protect
def remove_learned_element():
    user_id         = session.get("user_id")
    data            = request.get_json(silent=True) or {}
    element_code    = data.get('elementCode')

    if not user_id or not ObjectId.is_valid(user_id):
        return jsonify({"ok": False, "message": "Ungültiger Wert oder fehlende User-ID"}), 400
    if not element_code:
        return jsonify({"ok": False, "message": "Fehlende Element-ID"}), 400

    user = users_collection.find_one({"_id": ObjectId(user_id)})
    if not user:
        return jsonify({"ok": False, "message": "Nutzer nicht gefunden"}), 404

    users_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$pull": {"learnedElements": element_code}}
    )
    return jsonify({"ok": True, "message": f"Element '{element_code}' erfolgreich entfernt!", "userId": user_id, "elementId": element_code}), 200


################################################################################################### Get visible Users

@account_bp.route('/users/all', methods=['GET'])
def get_visible_users():
    user_id = session.get("user_id")
    if not user_id or not ObjectId.is_valid(user_id):
        return jsonify({"ok": False, "message": "Ungültiger Wert oder fehlende User-ID"}), 400
    user = users_collection.find_one({"_id": ObjectId(user_id)})
    if not user:
        return jsonify({"ok": False, "message": "Nicht erlaubt"}), 403
    
    users = list(
        users_collection.find(
            {"visibility": 1 },
            {
                "_id": 1, 
                "firstName": 1, 
                "lastName": 1, 
                "roles": 1, 
                "online": 1, 
                "color_code": 1,
                "favorite_apparatus": 1,
             }
        )
    )
    for user in users:
        user["_id"] = str(user["_id"])
        user["roles"] = user.get("roles", ["member"]) 

    return jsonify({"ok": True, "users": users}), 200


@account_bp.route('/account/favorite-apparatus', methods=['GET'])
@csrf_protect
def get_favorite_apparatus():
    user_id = session.get("user_id")
    if not user_id or not ObjectId.is_valid(user_id):
        return jsonify({"ok": False, "message": "Ungültiger Wert oder fehlende User-ID"}), 400
    user = users_collection.find_one({"_id": ObjectId(user_id)})
    if not user:
        return jsonify({"ok": False, "message": "Nicht erlaubt"}), 403
    
    return jsonify({"ok": True, "message": "Favoriten-Gerät wurde geladen", "apparatusId": user.get("favorite_apparatus", None)}), 200


@account_bp.route('/account/favorite-apparatus', methods=["POST"])
@csrf_protect
def set_favorite_apparatus():
    user_id     = session.get("user_id")
    data        = request.get_json(silent=True) or {}
    apparatusId = data.get('apparatusId')

    print(apparatusId)

    if not user_id or not ObjectId.is_valid(user_id):
        return jsonify({"ok": False, "message": "Ungültiger Wert oder fehlende User-ID"}), 400
    if apparatusId is not None and apparatusId not in ["FL", "PO", "RI", "VA", "PA", "HI"]:
        return jsonify({"ok": False, "message": "Ungültige Apparatus-ID"}), 400
    
    user = users_collection.find_one({"_id": ObjectId(user_id)})
    if not user:
        return jsonify({"ok": False, "message": "Nicht erlaubt"}), 403
    
    if apparatusId is None:
        users_collection.update_one(
            {"_id": ObjectId(user_id)},
            {"$unset": {"favorite_apparatus": ""}}
        )
    else:
        users_collection.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"favorite_apparatus": apparatusId}}
        )
    return jsonify({"ok": True, "message": "Favoriten-Geräte wurde aktualisiert", "apparatusId": apparatusId}), 200