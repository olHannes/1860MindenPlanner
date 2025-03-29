from flask import Blueprint, session, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from dotenv import load_dotenv
import os
from pymongo import MongoClient
from datetime import datetime, timezone, timedelta
import time

load_dotenv()

main_bp = Blueprint('main', __name__)

mongo_uri = os.getenv("MONGO_URI")
client = MongoClient(mongo_uri)

db_user = client['Users']
users_collection = db_user['users']
sessions_collection = db_user['active_sessions']
issues_collection = db_user['issues']


db_exercises = client['Exercises']
exercises_collection = db_exercises['User_Exercises']

db_floorElements = db_exercises['Floor']
db_pommelhorseElements = db_exercises['Pommelhorse']
db_ringsElements = db_exercises['Rings']
db_vaultElements = db_exercises['Vault']
db_parralelbarsElements = db_exercises['Parralelbars']
db_highbarElements = db_exercises['Highbar']



################################################################################################### Auto Logout via Hearbeat
@main_bp.route('/account/heartbeat', methods=['POST'])
def heartbeat():
    data = request.get_json()
    username = data.get("username")
    print("Heartbeat: ", username)

    if username:
        sessions_collection.update_one(
            {"username": username},
            {"$set": {"last_active": datetime.now(timezone.utc)}}
        )
        return jsonify({"message": "Heartbeat received"}), 200
    else:
        return jsonify({"error": "Kein Benutzername angegeben!"}), 400

def cleanup_sessions():
    timeout = timedelta(minutes=2)
    now = datetime.now(timezone.utc)

    inactive_sessions = sessions_collection.find({
        "last_active": {"$lt": now - timeout}
    })

    expired_users = []
    for session in inactive_sessions:
        username = session["username"]
        expired_users.append(username)

        print(f"Session expired: {username}")

        users_collection.update_one(
            {"firstName": username},
            {"$set": {"online": 0}}
        )
        sessions_collection.delete_one({"username": username})

    print(f"Bereinigung abgeschlossen: {len(expired_users)} Nutzer ausgeloggt.")




################################################################################################### Login

@main_bp.route('/account/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    cleanup_sessions()

    user = users_collection.find_one({"firstName": username})
    print("Try Login for: ", username, " | DB-Query: ", user, " | status: ", user.get('online'))
    
    if user:
        if user.get('online') == 1:
            return jsonify({"message": "Benutzer bereits eingeloggt!"}), 403

        if check_password_hash(user['password'], password):
            #Update session-collection
            sessions_collection.update_one(
            {"username": username},
            {"$set": {
                "ip": request.remote_addr,
                "last_active": datetime.now(timezone.utc)
            }},
            upsert=True
            )

            #Update Online Status
            users_collection.update_one(
                {"firstName": username},
                {"$set": {"online": 1}}
            )
            session['user'] = username
            return jsonify({"message": "Login erfolgreich!"}), 200
        else:
            return jsonify({"message": "Ungültiges Passwort!"}), 401
    else:
        return jsonify({"message": "Benutzername nicht gefunden!"}), 404


################################################################################################### Auto-Status

@main_bp.route('/account/checkUserStatus', methods=['GET'])
def check_user_status():
    username = request.args.get('name')

    if not username:
        return jsonify({"message": "Kein Benutzername angegeben!"}), 400

    session = sessions_collection.find_one({"username": username})
    
    if session:
        return jsonify({"message": "Benutzer online!"}), 200
    else:
        users_collection.update_one({"firstName": username}, {"$set": {"online": 0}})
        return jsonify({"message": "Benutzer offline, Status zurückgesetzt!"}), 200



################################################################################################### Logout

@main_bp.route('/account/logout', methods=['POST'])
def logout():
    data = request.get_json()
    username = data.get('name')

    if not username:
        return jsonify({"message": "Kein Benutzername angegeben!"}), 400

    print("Try Logout for:", username)

    sessions_collection.delete_one({"username": username})
    users_collection.update_one({"firstName": username}, {"$set": {"online": 0}})
    session.pop('user', None)

    return jsonify({"message": "Erfolgreich ausgeloggt!"}), 200



################################################################################################### Registrierung

@main_bp.route('/account/register', methods=['POST'])
def register():
    data = request.get_json()
    first_name = data.get('firstName')
    last_name = data.get('lastName')
    password = data.get('password')

    if users_collection.find_one({"firstName": first_name}):
        return jsonify({"message": "Benutzername bereits vergeben!"}), 400

    print("Try to register: ", first_name, " ", last_name)
    hashed_password = generate_password_hash(password)
    users_collection.insert_one({'firstName': first_name, 'lastName': last_name, 'password': hashed_password, 'online': 0})

    return jsonify({"message": "Registrierung erfolgreich!"}), 200


################################################################################################### update Password

@main_bp.route('/account/updatePassword', methods=['POST'])
def update_password():
    data = request.get_json()
    first_name = data.get('firstName')
    new_password = data.get('newPassword')

    if not first_name or not new_password:
        return jsonify({"message": "Vorname und neues Passwort sind erforderlich!"}), 400

    user = users_collection.find_one({"firstName": first_name})
    if not user:
        return jsonify({"message": "Benutzer nicht gefunden!"}), 404
    
    hashed_password = generate_password_hash(new_password)
    users_collection.update_one({"firstName": first_name}, {"$set": {"password": hashed_password}})
    
    return jsonify({"message": "Passwort erfolgreich aktualisiert!"}), 200


################################################################################################### Report erstellen

@main_bp.route('/report/issue', methods=['POST'])
def createReport():
    data = request.get_json()
    username = data.get('username')
    reportTitle = data.get('reportTitle')
    report = data.get('report')
    
    if not username or not reportTitle or not report:
        return jsonify({"message": "Fehlende Daten!"}), 400

    if issues_collection.find_one({"reportTitle": reportTitle}):
        return jsonify({"message": "Report existiert bereits"}), 400

    timestamp = datetime.now(timezone.utc)

    print(f"Create Report: {username}_{reportTitle}")
    issues_collection.insert_one({
        'reportTitle': reportTitle,
        'report': report,
        'username': username,
        'timestamp': timestamp
    })

    return jsonify({"message": "Report erfolgreich erstellt"}), 200


################################################################################################### Reports auslesen

@main_bp.route('/report/all', methods=['GET'])
def getAllReports():
    reports = list(issues_collection.find({}, {'_id': 0}))
    return jsonify(reports), 200


################################################################################################### Report löschen

@main_bp.route('/report/delete', methods=['DELETE'])
def deleteReport():
    data = request.get_json()
    reportTitle = data.get('reportTitle')

    if not reportTitle:
        return jsonify({"message": "ReportTitle fehlt!"}), 400

    result = issues_collection.delete_one({"reportTitle": reportTitle})

    if result.deleted_count == 0:
        return jsonify({"message": "Report nicht gefunden"}), 404

    return jsonify({"message": f"Report '{reportTitle}' erfolgreich gelöscht"}), 200


################################################################################################### Delete Account

@main_bp.route('/account/delete', methods=['POST'])
def delete_account():
    global active_sessions
    data = request.get_json()
    username = data.get('name')

    print("Try to delete: ", username)

    user = users_collection.find_one({"firstName": username})

    if not user:
        return jsonify({"message": "Benutzername nicht gefunden!"}), 404


    users_collection.delete_one({"firstName": username})
    session.pop('user', None)

    return jsonify({"message": "Account erfolgreich gelöscht!"}), 200


################################################################################################### Getter -> User Information

@main_bp.route('/account/getUserInfo', methods=['GET'])
def get_user_info():
    username = request.args.get('name')

    print("Try to get User-Info: ", username)

    if not username or not sessions_collection.find_one({"username": username}):
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

    print("Try to change User-Data from user:", username, "to:", new_first_name, new_last_name)

    if not username or not new_first_name or not new_last_name:
        return jsonify({"message": "Fehlende Daten!"}), 400

    user = users_collection.find_one({"firstName": username})

    if not user:
        return jsonify({"message": "Benutzer nicht gefunden!"}), 404

    users_collection.update_one(
        {"firstName": username},
        {"$set": {"firstName": new_first_name, "lastName": new_last_name}}
    )

    # Falls der User eingeloggt ist, aktualisieren wir auch seine Session
    sessions_collection.update_one(
        {"username": username},
        {"$set": {"username": new_first_name}}
    )

    return jsonify({
        "message": "Benutzerdaten erfolgreich aktualisiert",
        "new_first_name": new_first_name,
        "new_last_name": new_last_name
    }), 200


################################################################################################### Get Users

@main_bp.route('/users/getUsers', methods=['GET'])
def get_users():
    users = list(users_collection.find({}, {"_id": 0, "firstName": 1, "lastName": 1, "online": 1}))
    print("Try to get All Users: ", users)
    return jsonify(users), 200






# Hilfsfunktion zum Abrufen von Geräten
def get_device_collection(device):
    device_collections = {
        "FL": db_floorElements,
        "PO": db_pommelhorseElements,
        "RI": db_ringsElements,
        "VA": db_vaultElements,
        "PA": db_parralelbarsElements,
        "HI": db_highbarElements
    }
    return device_collections.get(device)

#################################################################################################### Get Elements
# Route: Get All Elements

@main_bp.route('/elements/getGroupElements', methods=['GET'])
def get_group_elements():
    device = request.args.get('Device')
    difficulty = request.args.get('Difficulty')
    group = request.args.get('Group')

    print("Get All Elements: ", device, ", ", group, ", ", difficulty)
    
    if not device:
        return jsonify({"error": "Gerät ist erforderlich."}), 400
    
    collection = get_device_collection(device)
    if collection is None:
        return jsonify({"error": f"Unbekanntes Gerät: {device}"}), 400
    
    elements = list(collection.find({}, {'_id': False}))

    if difficulty and difficulty != 'null':
        elements = [el for el in elements if str(el.get('wertigkeit')) == str(difficulty)]

    if group and group != 'null':
        elements = [el for el in elements if str(el.get('elementegruppe')) == str(group)]

    return jsonify(elements), 200


################################################################################################### Update Exercise
# Route: Update Database Exercise

@main_bp.route('/exercise/update', methods=["POST"])
def update_exercise():
    data = request.json
    vorname = data.get("vorname")
    geraet = data.get("geraet")
    elemente = data.get("elemente")

    if not vorname or geraet is None or elemente is None:
        return jsonify({"error": "Ungültige Anfrage. Alle Felder (vorname, geraet, elemente) sind erforderlich."}), 400
    
    query = {"vorname": vorname, "geraet": geraet}
    
    update_data = {"$set": {"elemente": elemente}}
    result = exercises_collection.update_one(query, update_data, upsert=True)

    if result.matched_count > 0:
        return jsonify({"message": "Übung erfolgreich aktualisiert"}), 200
    else:
        return jsonify({"message": "Neue Übung angelegt"}), 201

################################################################################################### Get Exercise
# Route: Get Exercise

@main_bp.route('/exercise/get', methods=["GET"])
def get_exercise():
    device = request.args.get("device")
    vorname = request.args.get("vorname")

    print("get Exercise: ", device, ", ", vorname)

    if not device or not vorname:
        return jsonify({"error": "Ungültige Anfrage. Beide Parameter (device und vorname) sind erforderlich."}), 400
    
    query = {"geraet": device, "vorname": vorname}
    exercise = exercises_collection.find_one(query)

    print("Aktuelle Übung: ", exercise)
    if exercise:
        exercise.pop("_id", None)
        return jsonify(exercise), 200
    else:
        return jsonify({"error": "Keine Übung gefunden."}), 404

################################################################################################### Get detailed Element
# Route: Get Element by ID

@main_bp.route('/exercise/get_element', methods=["GET"])
def get_element():
    element_id = request.args.get("id")
    current_device = request.args.get("currentDevice")

    print("get Element by ID: ", element_id, "; Dev: ", current_device)

    if not element_id or not current_device:
        return jsonify({"error": "Ungültige Anfrage. Beide Parameter (id und currentDevice) sind erforderlich."}), 400
    
    collection = get_device_collection(current_device)
    if collection is None:
        return jsonify({"error": f"Unbekanntes Gerät: {current_device}"}), 400
    
    element = collection.find_one({"id": element_id}, {'_id': False})

    if element:
        return jsonify(element), 200
    else:
        return jsonify({"error": "Kein Element gefunden mit der angegebenen id und dem aktuellen Gerät."}), 404
    
