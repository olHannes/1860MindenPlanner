from flask import Blueprint, session, request, jsonify

main_bp = Blueprint('main', __name__)

# Route for user-login
@main_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    # validate User with Database

    if 'user' in session:
        return jsonify({"message": "User already logged in!"}), 400

    session['user'] = username
    return jsonify({"message": "Login successful!"}), 200

# Route for user-logout
@main_bp.route('/logout', methods=['POST'])
def logout():
    session.pop('user', None)
    return jsonify({"message": "Logged out successfully!"}), 200
