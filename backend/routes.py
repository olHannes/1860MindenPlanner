from flask import Blueprint, session, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from dotenv import load_dotenv
import os
from pymongo import MongoClient

# Lade Umgebungsvariablen
load_dotenv()

# Blueprint für die Routen
main_bp = Blueprint('main', __name__)

# MongoDB-Verbindung (direkt über pymongo)
mongo_uri = os.getenv("MONGO_URI")
client = MongoClient(mongo_uri)
db = client['Users'] 
users_collection = db['users']  # Zugriff auf die 'users'-Collection

# Dummy-Datenbank (wird nicht mehr benötigt)
active_sessions = {}

# Route für den Benutzer-Login
@main_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username').lower()
    password = data.get('password')

    # MongoDB: Benutzer überprüfen
    user = users_collection.find_one({"firstName": username})

    if user:
        if check_password_hash(user['password'], password):
            if username in active_sessions:
                return jsonify({"message": "Benutzer bereits auf einem anderen Gerät eingeloggt!"}), 403

            session['user'] = username
            active_sessions[username] = request.remote_addr
            return jsonify({"message": "Login erfolgreich!"}), 200
        else:
            return jsonify({"message": "Ungültiges Passwort!"}), 401
    else:
        return jsonify({"message": "Benutzername nicht gefunden!"}), 404

# Route für den Benutzer-Logout
@main_bp.route('/logout', methods=['POST'])
def logout():
    data = request.get_json()
    name = data.get('name').lower()

    if name in active_sessions:
        del active_sessions[name]

    session.pop('user', None)

    return jsonify({"message": "Erfolgreich ausgeloggt!"}), 200

# Route für Benutzer-Registrierung
@main_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    first_name = data.get('firstName').lower()
    last_name = data.get('lastName').lower()
    password = data.get('password')

    # Überprüfen, ob der Benutzer schon existiert
    if users_collection.find_one({"firstName": first_name}):
        return jsonify({"message": "Benutzername bereits vergeben!"}), 400

    # Passwort hashen
    hashed_password = generate_password_hash(password)

    # Benutzer in MongoDB speichern
    users_collection.insert_one({'firstName': first_name, 'lastName': last_name, 'password': hashed_password})

    return jsonify({"message": "Registrierung erfolgreich!"}), 200

# Route für die Konto-Löschung
@main_bp.route('/delete_account', methods=['POST'])
def delete_account():
    data = request.get_json()
    username = data.get('name').lower()

    # Benutzer aus MongoDB löschen
    user = users_collection.find_one({"firstName": username})

    if not user:
        return jsonify({"message": "Benutzername nicht gefunden!"}), 404

    # Entfernen des Benutzers und der aktiven Sitzung
    active_sessions.pop(username, None)
    users_collection.delete_one({"firstName": username})
    session.pop('user', None)

    return jsonify({"message": "Account erfolgreich gelöscht!"}), 200

# Route für das Abrufen der Benutzerinformationen
@main_bp.route('/get_user_info', methods=['GET'])
def get_user_info():
    username = active_sessions.get('user')

    if not username:
        return jsonify({"message": "Benutzer nicht eingeloggt!"}), 401

    # Benutzerinformationen aus der MongoDB abrufen
    user = users_collection.find_one({"firstName": username})

    if not user:
        return jsonify({"message": "Benutzer nicht gefunden!"}), 404

    return jsonify({
        "first_name": user['firstName'],
        "last_name": user['lastName']
    }), 200
