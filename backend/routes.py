from flask import Blueprint, session, request, jsonify

main_bp = Blueprint('main', __name__)

active_sessions = {}

# Route for user-login
@main_bp.route('/login', methods=['POST'])
def login():
    global active_sessions

    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if username == "admin" and password == "admin":
        if username in active_sessions:
            return jsonify({"message": "Benutzer bereits auf einem anderen Gerät eingeloggt!"}), 403

        session['user'] = username
        active_sessions[username] = request.remote_addr

        return jsonify({"message": "Login successful!"}), 200
    else:
        return jsonify({"message": "Ungültiger Benutzername oder Passwort!"}), 401


@main_bp.route('/logout', methods=['POST'])
def logout():
    global active_sessions

    data = request.get_json()
    username = data.get('username')

    print(f"Logout-Anfrage für Benutzer: {username}")
    print(f"Aktive Sessions vor Logout: {active_sessions}")

    if username in active_sessions:
        del active_sessions[username]
        print(f"Benutzer {username} wurde aus active_sessions entfernt.")
    else:
        print(f"Benutzer {username} war nicht in active_sessions!")

    session.pop('user', None)
    print(f"Aktive Sessions nach Logout: {active_sessions}")

    return jsonify({"message": "Logged out successfully!"}), 200
