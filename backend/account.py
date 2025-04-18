
from mongoConf import *
import random

account_bp = Blueprint('account', __name__)
randAdminKey = random.randint(100000, 999999)

################################################################################################### Login

@account_bp.route('/account/login', methods=['POST'])
def login():
    global randAdminKey
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    user = users_collection.find_one({"firstName": username})
    
    if user:
        user_id = str(user["_id"])

        if check_password_hash(user['password'], password):
            users_collection.update_one(
                {"_id": user["_id"]},
                {"$inc": {"online": 1}}
            )
            session['user'] = username
            if username == "Admin":
                return jsonify({"message": "Login erfolgreich!", "userId": user_id, "adminKey": randAdminKey}), 200
            else:
                return jsonify({"message": "Login erfolgreich!", "userId": user_id}), 200
        else:
            return jsonify({"message": "Ungültiges Passwort!"}), 401
    else:
        return jsonify({"message": "Benutzername nicht gefunden!"}), 404


################################################################################################### Auto-Status

@account_bp.route('/account/checkUserStatus', methods=['GET'])
def check_user_status():
    username = request.args.get('name')
    user_id = request.args.get('userId')

    if not username or not user_id:
        return jsonify({"message": "Kein Benutzername oder Benutzer-ID angegeben!"}), 400

    user = users_collection.find_one({"_id": ObjectId(user_id), "username": username})

    if user and user.get("online", 0) > 0:
        return jsonify({"message": "Benutzer online!"}), 200
    else:
        users_collection.update_one(
            {"_id": ObjectId(user_id)},
            {"$inc": {"online": -1}}
        )
        return jsonify({"message": "Benutzer offline, Status zurückgesetzt!"}), 200


################################################################################################### Logout

@account_bp.route('/account/logout', methods=['POST'])
def logout():
    data = request.get_json()
    username = data.get('name')
    user_id = data.get('userId')

    if not username or not user_id:
        return jsonify({"message": "Kein Benutzername oder Benutzer-ID angegeben!"}), 400

    print("Try Logout for:", username, "| ID:", user_id)

    users_collection.update_one({"_id": ObjectId(user_id)}, {"$inc": {"online": -1}})
    session.pop('user', None)

    return jsonify({"message": "Erfolgreich ausgeloggt!"}), 200



################################################################################################### Registrierung

@account_bp.route('/account/register', methods=['POST'])
def register():
    data = request.get_json()
    first_name = data.get('firstName')
    last_name = data.get('lastName')
    password = data.get('password')

    if users_collection.find_one({"firstName": first_name}):
        return jsonify({"message": "Benutzername bereits vergeben!"}), 400

    print("Try to register: ", first_name, " ", last_name)
    hashed_password = generate_password_hash(password)
    users_collection.insert_one({'firstName': first_name, 'lastName': last_name, 'password': hashed_password, 'online': 0, 'color_code': '#000000'})

    return jsonify({"message": "Registrierung erfolgreich!"}), 200


################################################################################################### update Password

@account_bp.route('/account/updatePassword', methods=['POST'])
def update_password():
    data = request.get_json()
    user_id = data.get('userId')
    new_password = data.get('newPassword')

    if not user_id or not new_password:
        return jsonify({"message": "Benutzer-ID und neues Passwort sind erforderlich!"}), 400

    try:
        user = users_collection.find_one({"_id": ObjectId(user_id)})
    except:
        return jsonify({"message": "Ungültige Benutzer-ID!"}), 400

    if not user:
        return jsonify({"message": "Benutzer nicht gefunden!"}), 404

    hashed_password = generate_password_hash(new_password)
    users_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"password": hashed_password}}
    )
    return jsonify({"message": "Passwort erfolgreich aktualisiert!"}), 200


################################################################################################### update Password Admin

@account_bp.route('/account/admin/updatePassword', methods=['POST'])
def update_admin_password():
    global randAdminKey
    data = request.get_json()
    username = data.get('username')
    new_password = data.get('newPassword')
    key = data.get('adminKey')

    if not username or not new_password or not key:
        return jsonify({"message": "Benutzer-ID und neues Passwort sind erforderlich!"}), 400

    if int(key) != randAdminKey:
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

@account_bp.route('/account/delete', methods=['POST'])
def delete_account():
    data = request.get_json()
    username = data.get('name')
    user_id = data.get('userId')

    if not username or not user_id:
        return jsonify({"message": "Benutzername oder Benutzer-ID fehlt!"}), 400

    print("Try to delete:", username, "| ID:", user_id)

    user = users_collection.find_one({"_id": ObjectId(user_id), "firstName": username})
    if not user:
        return jsonify({"message": "Benutzer nicht gefunden oder ID stimmt nicht!"}), 404

    users_collection.delete_one({"_id": ObjectId(user_id)})

    session.pop('user', None)
    return jsonify({"message": "Account erfolgreich gelöscht!"}), 200


################################################################################################### Getter -> User Information

@account_bp.route('/account/getUserInfo', methods=['GET'])
def get_user_info():
    user_id = request.args.get('userId')

    print("Try to get User-Info by userId:", user_id)

    if not user_id or not ObjectId.is_valid(user_id):
        return jsonify({"message": "Ungültige oder fehlende Benutzer-ID!"}), 400

    user = users_collection.find_one({"_id": ObjectId(user_id)})

    if not user:
        return jsonify({"message": "Benutzer nicht gefunden!"}), 404

    return jsonify({
        "first_name": user['firstName'],
        "last_name": user['lastName'],
        "color_code": user.get('color_code', '#000000')
    }), 200



################################################################################################### Setter -> User Information

@account_bp.route('/account/changeData', methods=['POST'])
def changeData():
    data = request.get_json()
    user_id = data.get('userId')
    new_first_name = data.get('new_first_name')
    new_last_name = data.get('new_last_name')

    print("Try to change User-Data with ID:", user_id, "to:", new_first_name, new_last_name)

    if not user_id or not new_first_name or not new_last_name:
        return jsonify({"message": "Fehlende Daten!"}), 400

    user = users_collection.find_one({"_id": ObjectId(user_id)})
    if not user:
        return jsonify({"message": "Benutzer nicht gefunden!"}), 404

    existing_user = users_collection.find_one({
        "firstName": new_first_name,
        "_id": {"$ne": ObjectId(user_id)}
    })

    if existing_user:
        return jsonify({"message": "Benutzername bereits vergeben!"}), 409

    users_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"firstName": new_first_name, "lastName": new_last_name}}
    )

    return jsonify({
        "message": "Benutzerdaten erfolgreich aktualisiert",
        "new_first_name": new_first_name,
        "new_last_name": new_last_name
    }), 200


################################################################################################### set Color Code

@account_bp.route('/account/user/colorChange', methods=['POST'])
def change_user_color():
    data = request.get_json()
    user_id = data.get('userId')
    new_color = data.get('colorCode')

    if not isinstance(new_color, str) or not new_color.startswith('#') or len(new_color) != 7:
        return jsonify({"message": "Ungültiges Farbformat! Verwende das Format '#xxxxxx'."}), 400

    if not user_id:
        return jsonify({"message": "Benutzer-ID fehlt!"}), 400

    try:
        user = users_collection.find_one({"_id": ObjectId(user_id)})
    except:
        return jsonify({"message": "Ungültige Benutzer-ID!"}), 400

    if not user:
        return jsonify({"message": "Benutzer nicht gefunden!"}), 404

    users_collection.update_one({"_id": ObjectId(user_id)}, {"$set": {"color_code": new_color}})

    return jsonify({"message": "Farbcode erfolgreich aktualisiert!"}), 200


################################################################################################### Get Users

@account_bp.route('/users/getUsers', methods=['GET'])
def get_users():
    users = list(users_collection.find({}, {"_id": 0, "firstName": 1, "lastName": 1, "online": 1, "color_code": 1}))
    return jsonify(users), 200


################################################################################################### add learned Element

@account_bp.route("/account/addLearnedElement", methods=["POST"])
def add_learned_element():
    data = request.get_json()
    user_id = data.get("userId")
    element_code = data.get("elementCode")

    if not user_id or not element_code:
        return jsonify({"message": "Benutzer-ID und Element sind erforderlich"}), 400
    
    try:
        user = users_collection.find_one({"_id": ObjectId(user_id)})
    except:
        return jsonify({"message", "Invalid User-ID"}), 400
    if not user: 
        return jsonify({"message", "User not found"}), 404
    
    users_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$addToSet": {"learnedElements": element_code}}
    )
    return jsonify({"message": "Element successfully added"}), 200


################################################################################################### remove learned Element

@account_bp.route('/account/removeLearnedElement', methods=['POST'])
def remove_learned_element():
    data = request.get_json()
    user_id = data.get('userId')
    element_code = data.get('elementCode')

    if not user_id or not element_code:
        return jsonify({"message": "Benutzer-ID und Elementenkürzel sind erforderlich!"}), 400

    try:
        user = users_collection.find_one({"_id": ObjectId(user_id)})
    except:
        return jsonify({"message": "Ungültige Benutzer-ID!"}), 400

    if not user:
        return jsonify({"message": "Benutzer nicht gefunden!"}), 404

    users_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$pull": {"learnedElements": element_code}}
    )
    return jsonify({"message": f"Element '{element_code}' erfolgreich entfernt!"}), 200


################################################################################################### get learned Elements

@account_bp.route('/account/getLearnedElements', methods=['GET'])
def get_learned_elements():
    user_id = request.args.get('userId')
    device = request.args.get('device')

    print(user_id, " ", device)
    if not user_id or not ObjectId.is_valid(user_id):
        return jsonify({"message": "Ungültige oder fehlende Benutzer-ID!"}), 400

    user = users_collection.find_one({"_id": ObjectId(user_id)}, {"learnedElements": 1})

    if not user:
        return jsonify({"message": "Benutzer nicht gefunden!"}), 404

    learned_elements = user.get("learnedElements", [])
    print(learned_elements)

    if device:
        prefix = f"{device}_"
        learned_elements = [elem for elem in learned_elements if elem.startswith(prefix)]

    return jsonify({
        "learnedElements": learned_elements
    }), 200
