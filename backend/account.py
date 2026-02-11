
from mongoConf import *
from flask import session
from bson import ObjectId
import random
from datetime import datetime, timezone
from werkzeug.security import check_password_hash, generate_password_hash
import secrets

from validation import *

account_bp = Blueprint('account', __name__)
randAdminKey = random.randint(100000, 999999)


def validateAdminKey(key):
    global randAdminKey
    try:
        return int(key) == randAdminKey
    except:
        return False

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
    verify_link = f"http://127.0.0.1:5500/verifyAccount.html#uid={str(result.inserted_id)}&token={verifyCode}"
    verifyEmail = notification.build_verify(em, verify_link, full_name)
    notification.send_mail(verifyEmail)

    return jsonify({"ok": True, "message": "Registrierung erfolgreich!"}), 200


################################################################################################### Login

@account_bp.route('/account/login', methods=['POST'])
def login():
    global randAdminKey
    data    = request.get_json(silent=True) or {}
    email   = data.get('email') or ""
    password = data.get('password') or ""

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
            "message": "Nutzer mit der E-Mail nicht gefunden.",
        }), 404
    
    if not check_password_hash(user["password"], password):
        return jsonify({
            "ok": False,
            "message": "Passwort inkorrekt! Login fehlerhaft."
        }), 401
    
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

    if is_admin:
        response["adminKey"] = randAdminKey
    else:
        users_collection.update_one(
            {"_id": user["_id"]},
            {"$inc": {"online": 1}}
            )
    
    return jsonify(response), 200


################################################################################################### Auto-Status

@account_bp.route('/account/checkUserStatus', methods=['GET'])
def check_user_status():
    email       = request.args.get('email')
    user_id     = request.args.get('userId')

    if not user_id or not ObjectId.is_valid(user_id) or not email:
        return jsonify({"message": "Ungültige Parameter"}), 400

    em = normalize_email(email)

    user = users_collection.find_one({"_id": ObjectId(user_id), "email": em})
    if not user:
        return jsonify({"message": "Nutzer nicht gefunden."}), 404
    online_count = user.get("online", 0)

    if online_count > 0:
        return jsonify({"message": "Nutzer online", "count": online_count}), 200
    else:
        return jsonify({"message": "Nutzer offline"}), 200


################################################################################################### Logout

@account_bp.route('/account/logout', methods=['POST'])
def logout():
    data        = request.get_json()
    email       = data.get('email')
    user_id     = data.get('userId')

    if not user_id or not ObjectId.is_valid(user_id) or not email:
        return jsonify({"message": "Ungültige Parameter"}), 400

    em = normalize_email(email)

    user = users_collection.find_one({"_id": ObjectId(user_id), "email": em})
    if not user:
        return jsonify({"message": "Nutzer nicht gefunden"}), 404
    
    users_collection.update_one({"_id": ObjectId(user_id)}, {"$inc": {"online": -1}})
    session.pop('user', None)

    return jsonify({"message": "Erfolgreich ausgeloggt!"}), 200


################################################################################################### update Password after Request

@account_bp.route('/account/forgot/updatePassword', methods=['POST'])
def request_new_password():
    data            = request.get_json()
    email           = data.get('email')
    confirm_code    = data.get('confirm_code')
    new_password    = data.get('new_password')

    if not email or not confirm_code or not new_password:
        return jsonify({"ok": False, "message": "Eingabewerte sind nicht gültig"}), 400
    
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
def update_password():
    data            = request.get_json()
    user_id         = data.get('userId')
    confirm_code    = data.get('confirm_code')
    new_password    = data.get('new_password')

    if not user_id or not ObjectId.is_valid(user_id):
        return jsonify({"ok": False, "message": "Interner Fehler - ungültige User-ID"}), 400
    
    if not confirm_code or not new_password:
        return jsonify({"ok": False, "message": "E-Mail Code und Passwort muss eingegeben werden"}), 400

    if len(new_password) < 4:
        return jsonify({"ok": False, "message": "Das Passwort muss mindestens 4 Zeichen lang sein"}), 400

    user = users_collection.find_one({"_id": ObjectId(user_id)})
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
def request_password_reset():
    data    = request.get_json(silent=True) or {}
    email   = data.get("email")
    if not email:
        return jsonify({"ok": False, "message": "Ungültige Parameter"}), 400
    
    em = normalize_email(email)

    user = users_collection.find_one({"email": em})
    if not user:
        return jsonify({"ok": False, "message": "Nutzer nicht gefunden"}), 404
    
    code = f"{random.randint(0, 999999):06d}"
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


################################################################################################### update Password Admin

@account_bp.route('/account/admin/updatePassword', methods=['POST'])
def update_admin_password():
    data            = request.get_json()
    username        = data.get('username')
    new_password    = data.get('newPassword')
    key             = data.get('adminKey')

    if not username or not new_password or not key:
        return jsonify({"message": "Benutzer-ID und neues Passwort sind erforderlich!"}), 400

    if not validateAdminKey(key):
        return jsonify({"message": "Ungültiger Admin Key"}), 400

    try:
        user = users_collection.find_one({"firstName": username})
    except:
        return jsonify({"message": "Ungültige Benutzer-ID!"}), 400

    if not user:
        return jsonify({"message": "Benutzer nicht gefunden!"}), 404

    hashed_password = generate_password_hash(new_password)
    users_collection.update_one(
        {"firstName": username},
        {"$set": {"password": hashed_password}}
    )
    return jsonify({"message": "Passwort erfolgreich aktualisiert!"}), 200


################################################################################################### Delete Account

@account_bp.route('/account/delete', methods=['DELETE'])
def delete_account():
    data        = request.get_json()
    user_id     = data.get('userId')
    pwd         = data.get('password')

    if not user_id or not ObjectId.is_valid(user_id) or not pwd:
        return jsonify({"ok": False, "message": "Ungültige Parameter"}), 400

    user = users_collection.find_one({"_id": ObjectId(user_id) })
    if not user:
        return jsonify({"ok": False, "message": "Aktueller Nutzer nicht gefunden"}), 404

    if not check_password_hash(user['password'], pwd):
        return jsonify({"ok": False, "message": "Ungültiges Passwort"}), 403
    
    users_collection.delete_one({"_id": ObjectId(user_id)})

    session.pop('user', None)
    return jsonify({"ok": True, "message": "Account erfolgreich gelöscht!", "username": user["firstName"]}), 200


################################################################################################### Delete Account

@account_bp.route('/admin/deleteAcc', methods=['POST'])
def delete_admin_acc():
    data        = request.get_json()
    username    = data.get('name')
    user_id     = data.get('user_id')
    adminKey    = data.get('adminKey')

    if not username or not user_id or not ObjectId.is_valid(user_id) or not adminKey:
        return jsonify({"message": "Ungültige Parameter!"}), 400

    if not validateAdminKey(adminKey):
        return jsonify({"message": "Ungültiger Admin Key"}), 403

    user = users_collection.find_one({"_id": ObjectId(user_id)})
    if not user:
        return jsonify({"message": "Benutzer nicht gefunden!"}), 404
    
    users_collection.delete_one({"_id": user["_id"]})

    return jsonify({"message": "Account erfolgreich gelöscht!"}), 200


################################################################################################### Getter -> User Information

@account_bp.route('/account/info', methods=['GET'])
def get_user_info():
    request_id  = request.args.get('requestId')
    user_id     = request.args.get('userId')

    if not user_id or not ObjectId.is_valid(user_id) or not request_id or not ObjectId.is_valid(request_id):
        return jsonify({"message": "Ungültige Parameter"}), 400

    requestUser = users_collection.find_one( { "_id": ObjectId(request_id) })
    if not requestUser:
        return jsonify({"message": "Ungültige request_id"}), 403

    user = users_collection.find_one({ "_id": ObjectId(user_id) })
    if not user:
        return jsonify({"message": "Benutzer nicht gefunden!"}), 404

    return jsonify({
        "first_name": user['firstName'],
        "last_name": user['lastName'],
        "email": user['email'],
        "color_code": user.get('color_code', '#000000'),
        "visibility": user.get('visibility', 1)
    }), 200


################################################################################################### Setter -> User Information

@account_bp.route('/account/change/name', methods=['POST'])
def changeData():
    data = request.get_json()
    user_id = data.get('userId')
    new_first_name = data.get('new_first_name')
    new_last_name = data.get('new_last_name')

    if not user_id or not ObjectId.is_valid(user_id):
        return jsonify({"ok": False, "message": "Interner Fehler - Id nicht gültig"}), 403
    
    new_first_name = normalize_name(new_first_name)
    new_last_name = normalize_name(new_last_name)

    if not new_first_name or len(new_first_name) < 4:
        return jsonify({"ok": False, "message": "Vorname muss mindestens 4 Zeichen lang sein"}), 400
    if not new_last_name or len(new_last_name) < 4:
        return jsonify({"ok": False, "message": "Nachname muss mindestens 4 Zeichen lang sein"}), 400
    
    if not NAME_RE.match(new_first_name):
        return jsonify({"ok": False, "message": "Vorname darf nur Buchstaben und Leerzeichen enthalten"}), 404
    if not NAME_RE.match(new_last_name):
        return jsonify({"ok": False, "message": "Nachname darf nur Buchstaben und Leerzeichen enthalten"}), 400

    user = users_collection.find_one({"_id": ObjectId(user_id)})
    if not user:
        return jsonify({"ok": False, "message": "Nutzer nicht gefunden"}), 404

    users_collection.update_one(
        {"_id": ObjectId(user_id)},
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
def change_user_color():
    data = request.get_json()
    user_id = data.get('userId')
    new_color = data.get('colorCode')

    if not isinstance(new_color, str) or not new_color.startswith('#') or len(new_color) != 7:
        return jsonify({"message": "Ungültiges Farbformat! Verwende das Format '#xxxxxx'."}), 400

    if not user_id or not ObjectId.is_valid(user_id):
        return jsonify({"message": "Benutzer-ID fehlt oder ist ungültig!"}), 400

    user = users_collection.find_one({"_id": ObjectId(user_id)})
    if not user:
        return jsonify({"message": "Nutzer nicht gefunden."}), 404

    users_collection.update_one({"_id": ObjectId(user_id)}, {"$set": {"color_code": new_color}})

    return jsonify({"message": "Farbcode erfolgreich aktualisiert!"}), 200


################################################################################################### set Visibility status

@account_bp.route("/account/change/visibility", methods=['POST'])
def change_user_visibility():
    data = request.get_json()
    user_id = data.get('userId')
    visibility_status = data.get('visibility')

    if not user_id or not ObjectId.is_valid(user_id) or visibility_status is None:
        return jsonify({"message": "Invalid Arguments"}), 400

    user = users_collection.find_one({"_id": ObjectId(user_id)})
    if not user:
        return jsonify({"message": "Nutzer nicht gefunden"}), 404
    
    users_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"visibility": visibility_status}}
    )

    return jsonify({"message": "Successfully updated visibility status!"}), 200


################################################################################################### Get Users

@account_bp.route('/users/all', methods=['GET'])
def get_users():
    admin_key = request.args.get('adminKey')
    if not admin_key:
        return jsonify({"message": "Ungültige Parameter"}), 400
    
    if not validateAdminKey(admin_key):
        return jsonify({"message": "Methode nicht erlaubt"}), 403
     
    users = list(users_collection.find({}, {"_id": 0, "firstName": 1, "lastName": 1, "online": 1, "color_code": 1}))
    return jsonify(users), 200


################################################################################################### Get visible Users

@account_bp.route('/users/visible/all', methods=['GET'])
def get_visible_users():
    users = list(
        users_collection.find(
            {"visibility": 1, "roles": {"$ne": "admin"}},
            {"_id": 1, "firstName": 1, "lastName": 1, "roles": 1, "online": 1, "color_code": 1}
        )
    )
    for user in users:
        user["_id"] = str(user["_id"])
        user["roles"] = user.get("roles", ["member"]) 

    return jsonify({"ok": True, "users": users}), 200

################################################################################################### add learned Element

@account_bp.route("/account/addLearnedElement", methods=["POST"])
def add_learned_element():
    data            = request.get_json()
    user_id         = data.get("userId")
    element_code    = data.get("elementCode")

    if not user_id or not ObjectId.is_valid(user_id) or not element_code:
        return jsonify({"message": "Ungültige Parameter"}), 400
    
    user = users_collection.find_one({"_id": ObjectId(user_id)})
    if not user:
        return jsonify({"message": "Nutzer nicht gefunden"}), 404

    users_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$addToSet": {"learnedElements": element_code}}
    )
    return jsonify({"message": "Element erfolgreich hinzugefügt."}), 200


################################################################################################### remove learned Element

@account_bp.route('/account/removeLearnedElement', methods=['POST'])
def remove_learned_element():
    data            = request.get_json()
    user_id         = data.get('userId')
    element_code    = data.get('elementCode')

    if not user_id or not ObjectId.is_valid(user_id) or not element_code:
        return jsonify({"message": "Ungültige Parameter"}), 400

    user = users_collection.find_one({"_id": ObjectId(user_id)})
    if not user:
        return jsonify({"message": "Nutzer nicht gefunden"}), 404

    users_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$pull": {"learnedElements": element_code}}
    )
    return jsonify({"message": f"Element '{element_code}' erfolgreich entfernt!"}), 200


################################################################################################### get learned Elements

@account_bp.route('/account/getLearnedElements', methods=['GET'])
def get_learned_elements():
    user_id = request.args.get('userId')
    device  = request.args.get('device')

    if not user_id or not ObjectId.is_valid(user_id):
        return jsonify({"message": "Ungültige Parameter"}), 400

    user = users_collection.find_one({"_id": ObjectId(user_id)}, {"learnedElements": 1})
    if not user:
        return jsonify({"message": "Nutzer nicht gefunden"}), 404

    learned_elements = user.get("learnedElements", [])

    if device:
        prefix = f"{device}_"
        learned_elements = [elem for elem in learned_elements if elem.startswith(prefix)]

    return jsonify({
        "learnedElements": learned_elements
    }), 200
