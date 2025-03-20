from flask import Blueprint, session, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from dotenv import load_dotenv
import os
from flask_pymongo import PyMongo

load_dotenv()

main_bp = Blueprint('main', __name__)

mongo = PyMongo()

users_db = {}

# Route für den Benutzer-Login
@main_bp.route('/login', methods=['POST'])
def login():
    global active_sessions

    data = request.get_json()
    username = data.get('username')
    username = username.lower()
    password = data.get('password')

    user = mongo.db.users.find_one({"firstName": username})

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
    global active_sessions

    data = request.get_json()
    name = data.get('name')
    name = name.lower()

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

    if mongo.db.users.find_one({"firstName": first_name}):
        return jsonify({"message": "Benutzername bereits vergeben!"}), 400

    hashed_password = generate_password_hash(password)

    mongo.db.users.insert_one({'firstName': first_name, 'lastName': last_name, 'password': hashed_password})

    return jsonify({"message": "Registrierung erfolgreich!"}), 200



# Route für die Konto-Löschung
@main_bp.route('/delete_account', methods=['POST'])
def delete_account():
    global active_sessions

    data = request.get_json()
    username = data.get('name')
    username = username.lower()

    user = mongo.db.users.find_one({"firstName": username})

    if not user:
        return jsonify({"message": "Benutzername nicht gefunden!"}), 404

    active_sessions.pop(username, None)
    mongo.db.users.delete_one({"firstName": username})
    session.pop('user', None)

    return jsonify({"message": "Account erfolgreich gelöscht!"}), 200



# Route für das Abrufen der Benutzerinformationen
@main_bp.route('/get_user_info', methods=['GET'])
def get_user_info():
    username = active_sessions.get('user')

    if not username:
        return jsonify({"message": "Benutzer nicht eingeloggt!"}), 401

    user = mongo.db.users.find_one({"firstName": username})

    if not user:
        return jsonify({"message": "Benutzer nicht gefunden!"}), 404

    return jsonify({
        "first_name": user['firstName'],
        "last_name": user['lastName']
    }), 200
