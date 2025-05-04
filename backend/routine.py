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
    flag_learned = request.args.get('learnedElements')
    user_id = request.args.get('userId')
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

    if flag_learned == 'true':
        if not user_id or not ObjectId.is_valid(user_id):
            return jsonify({"error": "Gültige userId erforderlich für 'learnedElements=true'!"}), 400

        user = users_collection.find_one({"_id": ObjectId(user_id)}, {"learnedElements": 1})
        if not user:
            return jsonify({"error": "Benutzer nicht gefunden!"}), 404

        learned_elements = user.get("learnedElements", [])
        prefix = f"{device}_"
        learned_elements = [eid for eid in learned_elements if eid.startswith(prefix)]

        elements = [el for el in elements if el.get("id") in learned_elements]

    if search_text:
        elements = [
            el for el in elements 
            if search_text in el.get('bezeichnung', '').lower() 
            or search_text in el.get('name', '').lower()
        ]

    unique_elements = {}
    for el in elements:
        el_id = el.get('id')
        if el_id and el_id not in unique_elements:
            unique_elements[el_id] = el
    elements = list(unique_elements.values())

    return jsonify(elements), 200


################################################################################################### Update Exercise
@routine_bp.route('/exercise/update', methods=["POST"])
def update_exercise():
    data = request.json
    vorname = data.get("vorname")
    user_id = data.get("userId")
    geraet = data.get("geraet")
    elements = data.get("elemente")
    routine_type = data.get("routineType")

    if not vorname or user_id is None or geraet is None or elements is None or routine_type is None:
        return jsonify({"error": "Ungültige Anfrage. Alle Felder (vorname, geraet, elemente, type) sind erforderlich."}), 400
    
    try:
        user_object_id = ObjectId(user_id)
    except Exception:
        return jsonify({"error": "Ungültige userId"}), 400

    query = {"vorname": vorname, "geraet": geraet, "routineType": routine_type}
    existing_routine = exercises_collection.find_one(query)

    update_data = {"$set": {"elemente": elements}}

    if existing_routine is None:
        update_data["$setOnInsert"] = {"bewertungen": []}
    else:
        existing_elements = existing_routine.get("elemente", [])
        if existing_elements != elements:
            update_data["$set"]["bewertungen"] = []

    result = exercises_collection.update_one(query, update_data, upsert=True)

    if result.matched_count > 0 and "bewertungen" not in update_data["$set"]:
        return jsonify({"message": "Übung erfolgreich aktualisiert"}), 200
    elif result.matched_count > 0:
        return jsonify({"message": "Übung aktualisiert, Bewertungen zurückgesetzt"}), 200
    else:
        return jsonify({"message": "Neue Übung angelegt"}), 201


################################################################################################### Copy Routine
@routine_bp.route('/exercise/copyTo', methods=["POST"])
def copy_routine_to():
    data = request.json
    vorname = data.get("vorname")
    geraet = data.get("geraet")
    routine_type = data.get("routineType")

    if not vorname or geraet is None or routine_type is None:
        return jsonify({"error": "Ungültige Anfrage. Felder 'vorname', 'geraet' und 'routineType' sind erforderlich."}), 400

    try:
        routine_type = int(routine_type)
        if routine_type not in [0, 1]:
            raise ValueError()
        target_routine_type = 1 if routine_type == 0 else 0
    except ValueError:
        return jsonify({"error": "routineType muss 0 oder 1 sein."}), 400

    source_query = {
        "vorname": vorname,
        "geraet": geraet,
        "routineType": str(routine_type)
    }
    source_exercise = exercises_collection.find_one(source_query)

    if not source_exercise:
        return jsonify({"error": "Quellübung nicht gefunden."}), 404

    elemente_to_copy = source_exercise.get("elemente", [])

    target_query = {
        "vorname": vorname,
        "geraet": geraet,
        "routineType": str(target_routine_type)
    }
    update_data = {
        "$set": {
            "elemente": elemente_to_copy
        }
    }

    result = exercises_collection.update_one(target_query, update_data, upsert=True)

    if result.matched_count > 0:
        return jsonify({"message": f"Zielübung (Typ {target_routine_type}) erfolgreich aktualisiert."}), 200
    else:
        return jsonify({"message": f"Zielübung (Typ {target_routine_type}) neu angelegt."}), 201


################################################################################################### Get Exercise
@routine_bp.route('/exercise/get', methods=["GET"])
def get_exercise():
    device = request.args.get("device")
    vorname = request.args.get("vorname")
    routine_type = request.args.get("routineType")

    if not device or not vorname:
        return jsonify({"error": "Ungültige Anfrage. Beide Parameter (device und vorname) sind erforderlich."}), 400
    
    query = {"geraet": device, "vorname": vorname, "routineType": routine_type}
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


################################################################################################### Get the max-Points of a Routine
@routine_bp.route('/routine/getMaxPoints', methods=["GET"])
def get_routine_max_points():
    username = request.args.get("user")

    if not username:
        return jsonify({"error": "Ungültige Anfrage. Parameter (username) ist erforderlich."}), 400

    devices = ["FL", "PO", "RI", "VA", "PA", "HI"]
    result = {}

    for currentDevice in devices:
        query = {"geraet": currentDevice, "vorname": username, "routineType": "0"}
        exercise = exercises_collection.find_one(query)

        if not exercise or "elemente" not in exercise:
            result[currentDevice] = None
            continue

        routineDetailsList = []
        for element_id in exercise["elemente"]:
            collection = get_device_collection(currentDevice)
            element = collection.find_one({"id": element_id})
            if element:
                routineDetailsList.append(element)

        if currentDevice == "VA":
            validation_data = valid_routine_va(routineDetailsList)
        else:
            validation_data = analyze_routine_elements(currentDevice, routineDetailsList)

        result[currentDevice] = validation_data.get("totalDifficulty")

    return jsonify(result), 200


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
    
    result = analyze_routine_elements(device, elementList)
    return jsonify(result), 200

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

    return {
        "warnings": warnings,
        "errors": errors,
        "totalDifficulty": round(total_difficulty, 2),
        "totalElements": len(elementList),
        "groupList": group_list,
        "isComplete": len(errors) == 0,
        "baseDifficulty": highest_difficulty,
        "groupBonus": 0,
        "dismountBonus": 0
    }

def analyze_routine_elements(device, elementList):
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


    for i, element in enumerate(elementList):
        wertigkeit = float(element.get("wertigkeit", 0))

        if element.get("dismount"):
            has_dismount = True
            dismount_value = wertigkeit
            if i == len(elementList) - 1:
                is_dismount_at_end = True
            else:
                difficulties.append(wertigkeit)
        else:
            difficulties.append(wertigkeit)

        gruppe = element.get("elementegruppe")
        if gruppe:
            element_groups[gruppe] = element_groups.get(gruppe, 0) + 1

        bez = element.get("bezeichnung")
        if bez:
            seen_elements[bez] = seen_elements.get(bez, 0) + 1

    top_six = sorted(difficulties, reverse=True)[:6]
    base_difficulty = (sum(top_six) + dismount_value) * 2

    required_set = required_groups.get(device, set())
    missing_groups = [g for g in required_set if g not in element_groups]

    group_bonus = sum(0.5 for g in element_groups if float(g) > 0.05)
    dismount_bonus = 0.5 if dismount_value >= 0.2 else (0.3 if dismount_value >= 0.1 else 0)

    total_difficulty += base_difficulty + group_bonus + dismount_bonus
    total_elements = len(elementList)
    group_list = ", ".join(sorted(element_groups))

    is_complete = (
        len(missing_groups) == 0 and
        has_dismount and
        total_elements >= 7 and
        is_dismount_at_end
    )

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

    return {
        "warnings": warnings,
        "errors": errors,
        "totalDifficulty": round(total_difficulty, 2),
        "totalElements": total_elements,
        "groupList": group_list,
        "isComplete": is_complete,
        "baseDifficulty": round(base_difficulty, 2),
        "groupBonus": group_bonus,
        "dismountBonus": dismount_bonus
    }