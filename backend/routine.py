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
@routine_bp.route('/elements/get/filteredList', methods=['GET'])
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

    query = {"vorname": vorname, "geraet": geraet}
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
    
    element = collection.find_one({"id": element_id})
    element['_id'] = str(element['_id'])

    if element:
        return jsonify(element), 200
    else:
        return jsonify({"error": "Kein Element gefunden mit der angegebenen id und dem aktuellen Gerät."}), 404


################################################################################################### Validate Routine
@routine_bp.route('/routine/get/validation', methods=["POST"])
def valid_routine():
    data = request.get_json()
    device = data.get("device")
    elementList = data.get("elementList", [])

    if not device or not elementList:
        return jsonify({"error": "Device und elementList sind erforderlich"}), 400

    collection = get_device_collection(device)
    if collection is None:
        return jsonify({"error": f"Unbekanntes Gerät: {device}"}), 400


    if device == "VA":
        return valid_routine_va(elementList)

    required_groups = {
        "FL": {"1", "2", "3"},
        "PO": {"1", "2", "3", "4"},
        "RI": {"1", "2", "3", "4"},
        "VA": set(),
        "PA": {"1", "2", "3", "4"},
        "HI": {"1", "2", "3", "4"}
    }

    total_difficulty = 10
    element_groups = {}
    seen_elements = {}
    difficulties = []
    warnings = []
    errors = []

    has_dismount = False
    is_dismount_at_end = False
    dismount_value = 0

    for i, element, in enumerate(elementList):
        wertigkeit = float(element.get("wertigkeit", 0))

        if element.get("dismount"):
            has_dismount = True
            dismount_value = wertigkeit
            if i == len(elementList) -1:
                is_dismount_at_end = True
            else:
                difficulties.append(wertigkeit)
            
        gruppe = element.get("elementegruppe")
        if gruppe:
            element_groups[gruppe] = element_groups.get(gruppe, 0) + 1
            
        bez = element.get("bezeichnung")
        if bez:
            seen_elements[bez] = seen_elements.get(bez, 0) +1

    top_six = sorted(difficulties, reverse=True)[:6]
    base_difficulty = (sum(top_six) + dismount_value) *2

    required_set = required_groups.get(device, set())
    missing_groups = [g for g in required_set if g not in element_groups]

    group_bonus = sum(0.5 for g in element_groups if float(g) > 0.05)
    dismount_bonus = 0.5 if dismount_value >= 0.2 else (0.3 if dismount_value >= 0.1 else 0)

    total_difficulty += base_difficulty + group_bonus + dismount_bonus
    total_elements = len(elementList)
    group_list = ", ".join(sorted(element_groups))

    is_complete = len(missing_groups) == 0 and has_dismount and total_elements >= 7 and is_dismount_at_end

    if total_elements > 7:
        warnings.append("⚠️ Übung enthält mehr als 7 Elemente")
    for group, count in element_groups.items():
        if count > 3:
            warnings.append(f"⚠️ Elementgruppe {group} kommt sehr oft vor ({count}x).")

    duplicates = [f"{name} ({count}x)" for name, count in seen_elements.items() if count > 1]
    if duplicates:
        warnings.append("⚠️ Doppelte Elemente: " + ", ".join(duplicates))

    if total_elements < 7:
        errors.append(f"❌ Zu wenig Elemente: {total_elements}")
    if missing_groups:
        errors.append("❌ Fehlende Gruppen: " + ", ".join(missing_groups))
    if not has_dismount:
        errors.append("❌ Kein Abgang vorhanden")
    if has_dismount and not is_dismount_at_end:
        errors.append("❌ Der Abgang muss am Ende der Übung sein.")

    return jsonify({
        "warnings": warnings,
        "errors": errors,
        "totalDifficulty": round(total_difficulty, 2),
        "totalElements": total_elements,
        "groupList": group_list,
        "isComplete": is_complete,
        "baseDifficulty": round(base_difficulty, 2),
        "groupBonus": group_bonus,
        "dismountBonus": dismount_bonus
    }), 200

def valid_routine_va(elementList):
    warnings = []
    errors = []
    highest_difficulty = 0
    group_list = ""

    if len(elementList) != 1:
        errors.append("❌ Eine Sprung-Übung darf nur ein Element enthalten.")

    for el in elementList:
        wertigkeit = float(el.get("wertigkeit", 0))
        highest_difficulty = max(highest_difficulty, wertigkeit)

    element_group = elementList[0].get("elementegruppe") if elementList else None
    if element_group:
        group_list = str(element_group)

    total_difficulty = 10 + highest_difficulty

    return jsonify({
        "warnings": warnings,
        "errors": errors,
        "totalDifficulty": round(total_difficulty, 2),
        "totalElements": len(elementList),
        "groupList": group_list,
        "isComplete": len(errors) == 0,
        "baseDifficulty": highest_difficulty,
        "groupBonus": 0,
        "dismountBonus": 0
    }), 200

