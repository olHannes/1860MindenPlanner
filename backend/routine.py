from mongoConf import *
from validation import *

routine_bp = Blueprint('routine', __name__)

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

def device_from_element_id(eid: str) -> str | None:
    if not isinstance(eid, str):
        return None
    eid = eid.strip()
    if "_" not in eid:
        return eid
    return eid.split("_", 1)[0]

def serialize_mongo(doc):
    if isinstance(doc, list):
        return[serialize_mongo(item) for item in doc]
    if isinstance(doc, dict):
        return {k: serialize_mongo(v) for k, v in doc.items()}
    if isinstance(doc, ObjectId):
        return str(doc)
    return doc

#################################################################################################### List and filter Elements List
@routine_bp.route('/exercise/elements', methods=['GET'])
def get_group_elements():
    device          = request.args.get('device')
    difficulty      = request.args.get('difficulty')
    group           = request.args.get('group')
    learned    = request.args.get('learned')
    user_id         = request.args.get('userId')
    search_text     = request.args.get('search', '').strip().lower()

    if search_text in ['undefined', 'null']:
        search_text = ''

    if not device:
        return jsonify({"error": "Gerät ist erforderlich."}), 400

    dev_collection = get_device_collection(device)
    if dev_collection is None:
        return jsonify({"error": f"Unbekanntes Gerät: {device}"}), 400

    query = {}

    if difficulty not in [None, '' 'null']:
        query['wertigkeit'] = str(difficulty)
    
    if group not in [None, '', 'null']:
        query['elementegruppe'] = str(group)
    
    if search_text:
        query['$or'] = [
            {'bezeichnung': {'$regex': search_text, '$options': 'i'}},
            {'name': {'$regex': search_text, '$options': 'i'}}
        ]
    
    elements = list(dev_collection.find(query, {'_id': False}))

    if learned == 'true':
        if not user_id or not ObjectId.is_valid(user_id):
            return jsonify({"error": "Gültige userId erforderlich für 'learnedElements=true'!"}), 400

        user = users_collection.find_one({"_id": ObjectId(user_id)}, {"learned": 1})
        if not user:
            return jsonify({"error": "Benutzer nicht gefunden!"}), 404

        learned_elements = user.get("learnedElements", [])
        prefix = f"{device}_"
        learned_elements = [eid for eid in learned_elements if eid.startswith(prefix)]

        elements = [el for el in elements if el.get("id") in learned_elements]

    unique_elements = {}
    for el in elements:
        el_id = el.get('id')
        if el_id and el_id not in unique_elements:
            unique_elements[el_id] = el
    elements = list(unique_elements.values())

    return jsonify(elements), 200


################################################################################################### load detailed Element
@routine_bp.route('/exercise/element', methods=["GET"])
def get_element():
    element_id = request.args.get("id")
    if not element_id:
        return jsonify({"ok": False, "message": "Parameter 'id' ist erforderlich"}), 400
    
    parts = element_id.split("_")
    if len(parts) < 3:
        return jsonify({"ok": False, "message": "Ungültiges ID-Format"}), 400

    dev = parts[0]

    collection = get_device_collection(dev)
    if collection is None:
        return jsonify({"ok": False, "message": f"unbekanntes Gerät: '{dev}'"}), 400
    
    element = collection.find_one({"id": element_id}, {"_id": False})
    if not element:
        return jsonify({"ok": False, "message": "Kein Element mit der ID gefunden"}), 404

    return jsonify({"ok": True, "element": element}), 200




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




################################################################################################### Rating Routine
@routine_bp.route('/exercise/rating', methods=["POST"])
def rating_routine():
    data = request.json
    username = data.get("username")
    target_username = data.get("target_username")
    device = data.get("device")
    rating_stars = data.get("rating")

    if not username or not target_username or not device or rating_stars is None:
        return jsonify({"message": "Invalid Request. Fields username, target_username, device, and rating are required."}), 400

    foundRoutine = exercises_collection.find_one({
        "vorname": target_username,
        "geraet": device,
        "routineType": "0"
    })

    if not foundRoutine:
        return jsonify({"error": "Routine not found"}), 404

    existing_rating = next(
        (entry for entry in foundRoutine.get("bewertungen", []) if entry.get("von") == username), None
    )

    if existing_rating:
        result = exercises_collection.update_one(
            {"_id": foundRoutine["_id"], "bewertungen.von": username},
            {
                "$set": {"bewertungen.$.sterne": rating_stars}
            }
        )
    else:
        result = exercises_collection.update_one(
            {"_id": foundRoutine["_id"]},
            {
                "$push": {"bewertungen": {"von": username, "sterne": rating_stars}}
            }
        )
    return jsonify({"message": "Rating gespeichert"}), 200


################################################################################################### Get Routine Rating
@routine_bp.route('/exercise/rating', methods=["GET"])
def get_rating_by_name():
    vorname = request.args.get("vorname")
    geraet = request.args.get("geraet")
    routine_type = request.args.get("routineType")

    if not vorname or not geraet or not routine_type:
        return jsonify({"error": "Fehlende Parameter (vorname, geraet, routineType)"}), 400

    pipeline = [
        {
            "$match": {
                "vorname": vorname,
                "geraet": geraet,
                "routineType": routine_type
            }
        },
        {
            "$project": {
                "bewertungen": {
                    "$ifNull": ["$bewertungen", []]
                }
            }
        },
        {
            "$unwind": {
                "path": "$bewertungen",
                "preserveNullAndEmptyArrays": True
            }
        },
        {
            "$group": {
                "_id": None,
                "durchschnitt": { "$avg": "$bewertungen.sterne" },
                "anzahl": { "$sum": {
                    "$cond": [{ "$ifNull": ["$bewertungen.sterne", False] }, 1, 0]
                }}
            }
        },
        {
            "$project": {
                "_id": 0,
                "durchschnitt": {
                    "$round": [
                        { "$ifNull": ["$durchschnitt", 0] },
                        1
                    ]
                },
                "anzahl": 1
            }
        }
    ]

    result = list(exercises_collection.aggregate(pipeline))
    if result:
        return jsonify(result[0]), 200
    else:
        return jsonify({"error": "Übung nicht gefunden"}), 404




################################################################################################### Copy Routine
@routine_bp.route('/exercise/copyTo', methods=["POST"])
def copy_routine_to():
    data = request.json
    vorname = data.get("vorname")
    geraet = data.get("geraet")
    routine_type = data.get("routineType")

    if not vorname or geraet is None or routine_type is None:
        return jsonify({"error": "Invalid Request. Fields 'firstName', 'device' and 'routineType' are necessary."}), 400

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


################################################################################################### Load exercise (optional with expanded elements and routine rating)
@routine_bp.route('/exercise', methods=["GET"])
def get_exercise():
    userId      = request.args.get("userId")
    apparatus   = request.args.get("apparatus")
    routineType = request.args.get("type")
    expand      = request.args.get("expand") == "elements"
    autoRating  = request.args.get("include") == "autoRating"

    if not userId or not apparatus or not routineType:
        return jsonify({ "ok": False, "message": "Ungültige Anfrage. Fehlende Parameter"}), 400
    
    if not ObjectId.is_valid(userId):
        return jsonify({ "ok": False, "message": "Ungültige Anfrage. Fehlerhafte Nutzer-Id"}), 400

    query = { "apparatus": apparatus, 
             "userId": ObjectId(userId), 
             "routineType": routineType 
    }
    pipeline = [
        {"$match": query},
        {"$addFields" : {
            "communityCount": { "$size": { "$ifNull": ["$community", []] } },
            "communityAvg": { "$avg": { "$ifNull": ["$community.sterne", []] } }
        }},
        { "$addFields": {
            "communityAvg": {
                "$cond": [
                    {"$gt": ["$communityCount", 0]},
                    {"$round": ["$communityAvg", 1]},
                    None
                ]
            }
        }},
        {"$project": { "community": 0 }}
    ]
    docs = list(exercises_collection.aggregate(pipeline, allowDiskUse=False))
    if not docs:
        return jsonify({"ok": False, "message": "Übung nicht gefunden"}), 404
    
    exercise = serialize_mongo(docs[0])
    auto_rating_result = None

    if expand or autoRating:
        element_ids = exercise.get("elements", [])
        from collections import defaultdict
        by_device = defaultdict(list)
        for eid in element_ids:
            dev = device_from_element_id(eid)
            if dev:
                by_device[dev].append(eid)
        
        element_map = {}
        missing = []
        for dev, ids in by_device.items():
            coll = get_device_collection(dev)
            if coll is None:
                missing.extend(ids)
                continue
            for el in coll.find({"id": {"$in": ids}}):
                el["_id"] = str(el["_id"])
                element_map[el["id"]] = el
            
            for eid in ids:
                if eid not in element_map:
                    missing.append(eid)

        resolved_elements = [element_map.get(eid) for eid in element_ids]

        if expand:
            exercise["elements"] = resolved_elements
        else:
            exercise["elements"] = element_ids
        if missing:
            exercise["elementsMissing"] = missing
        if autoRating:
            auto_rating_result = validate_routine(apparatus, resolved_elements)
   
    response = { "ok": True, "exercise": exercise}

    if autoRating and auto_rating_result:
        response["autoRating"] = auto_rating_result
    
    return jsonify(response), 200



