from flask import Blueprint, session, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from dotenv import load_dotenv
import os
from pymongo import MongoClient

load_dotenv()

main_bp = Blueprint('main', __name__)

mongo_uri = os.getenv("MONGO_URI")
client = MongoClient(mongo_uri)
db_user = client['Users']
users_collection = db_user['users']
db_exercises = client['Exercises']
exercises_collection = db_exercises['Exercises']

# Globale Session-Tracking-Variable
active_sessions = {}

################################################################################################### Login

@main_bp.route('/account/login', methods=['POST'])
def login():
    global active_sessions
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    user = users_collection.find_one({"firstName": username})
    
    if user:
        if user.get('online') == 1:
            return jsonify({"message": "Benutzer bereits eingeloggt!"}), 403

        if check_password_hash(user['password'], password):
            users_collection.update_one({"firstName": username}, {"$set": {"online": 1}})
            active_sessions[username] = request.remote_addr
            session['user'] = username
            
            print(f"Active Sessions: {active_sessions}")
            return jsonify({"message": "Login erfolgreich!"}), 200
        else:
            return jsonify({"message": "Ungültiges Passwort!"}), 401
    else:
        return jsonify({"message": "Benutzername nicht gefunden!"}), 404


################################################################################################### Auto-Status

@main_bp.route('/account/checkUserStatus', methods=['GET'])
def check_user_status():
    global active_sessions
    username = request.args.get('name')

    if not username or username not in active_sessions:
        users_collection.update_one({"firstName": username}, {"$set": {"online": 0}})
        return jsonify({"message": "Benutzer offline, Status zurückgesetzt!"}), 200

    return jsonify({"message": "Benutzer online!"}), 200


################################################################################################### Logout

@main_bp.route('/account/logout', methods=['POST'])
def logout():
    global active_sessions
    data = request.get_json()
    username = data.get('name')

    if not username:
        return jsonify({"message": "Kein Benutzername angegeben!"}), 400

    if username in active_sessions:
        del active_sessions[username]
        users_collection.update_one({"firstName": username}, {"$set": {"online": 0}})
        session.pop('user', None)

        print(f"Active Sessions after logout: {active_sessions}")
        return jsonify({"message": "Erfolgreich ausgeloggt!"}), 200
    else:
        return jsonify({"message": "Kein Benutzer eingeloggt oder Benutzername stimmt nicht!"}), 400


################################################################################################### Registrierung

@main_bp.route('/account/register', methods=['POST'])
def register():
    data = request.get_json()
    first_name = data.get('firstName')
    last_name = data.get('lastName')
    password = data.get('password')

    if users_collection.find_one({"firstName": first_name}):
        return jsonify({"message": "Benutzername bereits vergeben!"}), 400

    hashed_password = generate_password_hash(password)
    users_collection.insert_one({'firstName': first_name, 'lastName': last_name, 'password': hashed_password, 'online': 0})

    return jsonify({"message": "Registrierung erfolgreich!"}), 200


################################################################################################### Delete Account

@main_bp.route('/account/delete', methods=['POST'])
def delete_account():
    global active_sessions
    data = request.get_json()
    username = data.get('name')

    user = users_collection.find_one({"firstName": username})

    if not user:
        return jsonify({"message": "Benutzername nicht gefunden!"}), 404

    if username in active_sessions:
        del active_sessions[username]

    users_collection.delete_one({"firstName": username})
    session.pop('user', None)

    return jsonify({"message": "Account erfolgreich gelöscht!"}), 200


################################################################################################### Getter -> User Information

@main_bp.route('/account/getUserInfo', methods=['GET'])
def get_user_info():
    global active_sessions
    username = request.args.get('name')

    if not username or username not in active_sessions:
        return jsonify({"message": "Benutzer nicht eingeloggt!"}), 401

    user = users_collection.find_one({"firstName": username})

    if not user:
        return jsonify({"message": "Benutzer nicht gefunden!"}), 404

    return jsonify({
        "first_name": user['firstName'],
        "last_name": user['lastName']
    }), 200


################################################################################################### Setter -> User Information

@main_bp.route('/account/changeData', methods=['POST'])
def changeData():
    data = request.get_json()
    username = data.get('username')
    new_first_name = data.get('new_first_name')
    new_last_name = data.get('new_last_name')

    if not username or not new_first_name or not new_last_name:
        return jsonify({"message": "Fehlende Daten!"}), 400

    user = users_collection.find_one({"firstName": username})

    if not user:
        return jsonify({"message": "Benutzer nicht gefunden!"}), 404

    result = users_collection.update_one(
        {"firstName": username},
        {"$set": {"firstName": new_first_name, "lastName": new_last_name}}
    )

    if result.matched_count == 0:
        return jsonify({"message": "Fehler beim Aktualisieren der Daten!"}), 500
    
    if username in active_sessions:
        active_sessions[new_first_name] = active_sessions.pop(username)

    return jsonify({
        "message": "Benutzerdaten erfolgreich aktualisiert",
        "new_first_name": new_first_name,
        "new_last_name": new_last_name
    }), 200


################################################################################################### Get Users

@main_bp.route('/users/getUsers', methods=['GET'])
def get_users():
    users = list(users_collection.find({}, {"_id": 0, "firstName": 1, "lastName": 1, "online": 1}))
    return jsonify(users), 200
