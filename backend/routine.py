from mongoConf import *

routine_bp = Blueprint('routine', __name__)


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
@routine_bp.route('/elements/getGroupElements', methods=['GET'])
def get_group_elements():
    device = request.args.get('Device')
    difficulty = request.args.get('Difficulty')
    group = request.args.get('Group')
    search_text = request.args.get('Text', '').strip().lower()
    if search_text in ['undefined', 'null']:
        search_text = ''

    if not device:
        return jsonify({"error": "Gerät ist erforderlich."}), 400
    
    collection = get_device_collection(device)
    if collection is None:
        return jsonify({"error": f"Unbekanntes Gerät: {device}"}), 400
    
    elements = list(collection.find({}, {'_id': False}))

    if difficulty not in [None, '', 'null']:
        elements = [el for el in elements if str(el.get('wertigkeit')) == str(difficulty)]

    if group not in [None, '', 'null']:
        elements = [el for el in elements if str(el.get('elementegruppe')) == str(group)]

    if search_text:
        elements = [
            el for el in elements 
            if search_text in el.get('bezeichnung', '').lower() 
            or search_text in el.get('name', '').lower()
        ]

    return jsonify(elements), 200


################################################################################################### Update Exercise
@routine_bp.route('/exercise/update', methods=["POST"])
def update_exercise():
    data = request.json
    vorname = data.get("vorname")
    user_id = data.get("userId")
    geraet = data.get("geraet")
    elemente = data.get("elemente")

    if not vorname or user_id is None or geraet is None or elemente is None:
        return jsonify({"error": "Ungültige Anfrage. Alle Felder (vorname, geraet, elemente) sind erforderlich."}), 400
    
    try:
        user_object_id = ObjectId(user_id)
    except Exception:
        return jsonify({"error": "Ungültige userId"}), 400

    query = {"_id": user_object_id, "geraet": geraet}
    update_data = {"$set": {"elemente": elemente}}

    result = exercises_collection.update_one(query, update_data, upsert=True)

    if result.matched_count > 0:
        return jsonify({"message": "Übung erfolgreich aktualisiert"}), 200
    else:
        return jsonify({"message": "Neue Übung angelegt"}), 201


################################################################################################### Get Exercise
@routine_bp.route('/exercise/get', methods=["GET"])
def get_exercise():
    device = request.args.get("device")
    vorname = request.args.get("vorname")

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
@routine_bp.route('/exercise/get_element', methods=["GET"])
def get_element():
    element_id = request.args.get("id")
    current_device = request.args.get("currentDevice")

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
