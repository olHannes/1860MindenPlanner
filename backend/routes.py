from flask import Blueprint, session, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash

main_bp = Blueprint('main', __name__)

active_sessions = {}

# Dummy-Datenbank
users_db = {}

# Route for user-login
@main_bp.route('/login', methods=['POST'])
def login():
    global active_sessions

    data = request.get_json()
    username = data.get('username')
    username = username.lower()
    password = data.get('password')

    if username in users_db:
        user = users_db[username]
        
        if check_password_hash(user['password'], password):
            if username in active_sessions:
                return jsonify({"message": "Benutzer bereits auf einem anderen Gerät eingeloggt!"}), 403

            session['user'] = username
            active_sessions[username] = request.remote_addr
            return jsonify({"message": "Login successful!"}), 200
        else:
            return jsonify({"message": "Ungültiges Passwort!"}), 401
    else:
        return jsonify({"message": "Benutzername nicht gefunden!"}), 404


# Route for user-logout
@main_bp.route('/logout', methods=['POST'])
def logout():
    global active_sessions

    data = request.get_json()
    name = data.get('name')
    name = name.lower()

    if name in active_sessions:
        del active_sessions[name]

    session.pop('user', None)

    return jsonify({"message": "Logged out successfully!"}), 200


# Route for user-registration
@main_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    first_name = data.get('firstName')
    first_name = first_name.lower()
    last_name = data.get('lastName')
    last_name = last_name.lower()
    password = data.get('password')


    if first_name in users_db:
        return jsonify({"message": "Benutzername bereits vergeben!"}), 400

    hashed_password = generate_password_hash(password)
    users_db[first_name] = {'firstName': first_name, 'lastName': last_name, 'password': hashed_password}
    return jsonify({"message": "Registrierung erfolgreich!"}), 200


# Route for user account deletion
@main_bp.route('/delete_account', methods=['POST'])
def delete_account():
    global active_sessions

    data = request.get_json()
    username = data.get('name')
    username = username.lower()

    if username not in users_db:
        return jsonify({"message": "Benutzername nicht gefunden!"}), 404

    user = users_db[username]
    active_sessions.pop(username, None)
    del users_db[username]
    session.pop('user', None)
    return jsonify({"message": "Account erfolgreich gelöscht!"}), 200



# Route to get the logged-in user's first and last name
@main_bp.route('/get_user_info', methods=['GET'])
def get_user_info():
    global active_sessions
    username = active_sessions.get('user')

    print(username)
    if not username:
        #return jsonify({"message": "Benutzer nicht eingeloggt!"}), 401
        pass
    user = users_db.get(username)

    if not user:
        return jsonify({"message": "Benutzer nicht gefunden!"}), 404

    return jsonify({
        "first_name": user['firstName'],
        "last_name": user['lastName']
    }), 200
