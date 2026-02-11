from mongoConf import *
from datetime import datetime, date, timedelta
from bson import ObjectId

competition_bp = Blueprint('competition', __name__)

ALLOWED_DEVICES = {
    "Boden",
    "Barren",
    "Reck",
    "Ringe",
    "Pauschenpferd",
    "Sprung"
}

################################################################################################### Helper functions
def checkIfIsPast(date_raw) -> bool:
    today = date.today()
    real_date = None
    if isinstance(date_raw, str):
        try:
            real_date = datetime.strptime(date_raw, "%Y-%m-%d").date()
        except ValueError:
            real_date = None
    elif isinstance(date_raw, datetime):
        real_date= date_raw.date()
    elif isinstance(date_raw, date):
        real_date = date_raw
    
    return bool(real_date and today >= (real_date + timedelta(days=1)))



################################################################################################### Create Competition
@competition_bp.route('/competition/create', methods=['POST'])
def create_competition():
    data = request.get_json(silent=True) or {}
    name = data.get('name')
    date = data.get('date')
    location = data.get('location')

    if not name or not date or not location:
        return jsonify({"ok": False, "message": "Name, Datum und Ort sind erforderlich!"}), 400

    competition = {
        "name": name,
        "date": date,
        "location": location
    }

    res = competition_collection.insert_one(competition)
    return jsonify({"ok": True, "message": "Wettkampf erfolgreich erstellt", "competitionId": str(res.inserted_id)}), 200


################################################################################################### Delete Competition
@competition_bp.route('/competition/<competition_id>', methods=['DELETE'])
def delete_competition(competition_id):
    if not competition_id or not ObjectId.is_valid(competition_id):
        return jsonify({"ok": False, "message": "Ungültige Wettkampf-Id"}), 400

    comp_oid = ObjectId(competition_id)

    res = competition_collection.delete_one({"_id": comp_oid})
    if res.deleted_count == 0:
        return jsonify({"ok": False, "message": "Wettkampf nicht gefunden"}), 404
    
    del_entries = competition_entries_collection.delete_many({"competitionId": comp_oid})
    return jsonify({"ok": True, "message": "Wettkampf erfolgreich gelöscht", "deletedEntries": del_entries.deleted_count}), 200


################################################################################################### list Competitions
@competition_bp.route('/competition/all', methods=['GET'])
def get_all_competitions():
    userId = request.args.get("userId")

    user_oid = None
    if userId:
        if not ObjectId.is_valid(userId):
            return jsonify({"ok": False, "message": "Ungültige userId"}), 400
        user_oid = ObjectId(userId)
    
    comps = list(competition_collection.find(
        {},
        {"name": 1, "date": 1, "location": 1}
    ).sort("date", 1))

    joined_comp_ids = set()
    if user_oid:
        my_entries = competition_entries_collection.find(
            {"userId": user_oid},
            {"competitionId": 1}
        )
        joined_comp_ids = { e["competitionId"] for e in my_entries if e.get("competitionId") }
    
    result = []

    for comp in comps:
        temp = {
            "_id": str(comp["_id"]),
            "name": comp.get("name"),
            "location": comp.get("location"),
            "date": comp.get("date"),
            "isPast": checkIfIsPast(comp.get("date"))
        }

        if user_oid:
            temp["joined"] = comp["_id"] in joined_comp_ids
        
        result.append(temp)
    return jsonify({ "ok": True, "competitions": result }), 200


################################################################################################### get Competition details
@competition_bp.route('/competition/<competitionId>', methods=["GET"])
def get_competition(competitionId):
    if not competitionId or not  ObjectId.is_valid(competitionId):
        return jsonify({ "ok": False, "message": "Ungültige Wettkampf-ID" }), 400
    
    projection = {"name": 1, "date": 1, "location": 1 }
    comp = competition_collection.find_one({ "_id": ObjectId(competitionId) }, projection)
    if not comp:
        return jsonify({ "ok": False, "message": "Wettkampf nicht gefunden" }), 404

    out = {
        "_id": str(comp["_id"]),
        "name": comp.get("name"),
        "location": comp.get("location"),
        "date": comp.get("date"),
        "isPast": checkIfIsPast(comp.get("date"))
    }
    return jsonify({"ok": True, "competition": out}), 200


################################################################################################### load scores and names
@competition_bp.route('/competition/<competition_id>/entries', methods=["GET"])
def get_competition_entries(competition_id):
    if not competition_id or not ObjectId.is_valid(competition_id):
        return jsonify({ "ok": False, "message": "Ungültige Wettkampf-ID" }), 400
    
    comp_oid = ObjectId(competition_id)
    comp = competition_collection.find_one({ "_id": comp_oid}, {"_id": 1 })
    if not comp:
        return jsonify({ "ok": False, "message": "Wettkampf nicht gefunden" }), 404
    
    entries = list(competition_entries_collection.find(
        { "competitionId": comp_oid },
        { "userId": 1, "scores": 1 }
    ))

    user_oids = [e["userId"] for e in entries if isinstance(e.get("userId"), ObjectId)]
    users = list(users_collection.find(
        {"_id": {"$in": user_oids}},
        {"firstName": 1, "lastName": 1}
    ))

    user_map = {}
    for u in users:
        fn = (u.get("firstName") or "").strip()
        ln = (u.get("lastName") or "").strip()
        full = (fn + " " + ln).strip() or None
        user_map[u["_id"]] = full
    
    out = []
    for e in entries:
        uid = e.get("userId")

        raw_scores = e.get("scores") or {}
        if not isinstance(raw_scores, dict):
            raw_scores = {}
        
        normalize_scores = {}
        for dev in ALLOWED_DEVICES:
            val = raw_scores.get(dev, None)
            if isinstance(val, (int, float)) and val == 0:
                val = None
            normalize_scores[dev] = val
        
        out.append({
            "_id": str(e["_id"]),
            "userId": str(uid) if isinstance(uid, ObjectId) else uid,
            "userName": user_map.get(uid, None),
            "scores": normalize_scores
        })

    return jsonify({"ok": True, "entities": out}), 200


################################################################################################### join competition
@competition_bp.route('/competition/<competition_id>/join', methods=["POST", "PUT"])
def join_competition(competition_id):
    if not competition_id or not ObjectId.is_valid(competition_id):
        return jsonify({"ok": False, "message": "Ungültige Wettkampf-Id"}), 400
    
    data = request.get_json(silent=True) or {}
    userId = data.get("userId")
    if not userId or not ObjectId.is_valid(userId):
        return jsonify({"ok": False, "message": "Fehlende oder Ungültige User-Id"}), 400
    
    comp_oid = ObjectId(competition_id)
    user_oid = ObjectId(userId)

    if not competition_collection.find_one({"_id": comp_oid}, {"_id": 1}):
        return jsonify({"ok": False, "message": "Wettkampf nicht gefunden"}), 404
    
    if not users_collection.find_one({"_id": user_oid}, {"_id": 1}):
        return jsonify({"ok": False, "message": "Nutzer nicht gefunden"}), 404
    
    res = competition_entries_collection.update_one(
        {"competitionId": comp_oid, "userId": user_oid},
        {
            "$setOnInsert": {
                "competitionId": comp_oid,
                "userId": user_oid,
                "scores": {}
            }
        },
        upsert=True
    )
    created = res.upserted_id is not None
    return jsonify({"ok": True, "joined": True, "created": created}), 200


################################################################################################### leave Competition
@competition_bp.route('/competition/<competition_id>/leave', methods=['POST', 'DELETE'])
def leave_competition(competition_id):
    if not competition_id or not ObjectId.is_valid(competition_id):
        return jsonify({"ok": False, "message": "Ungültige Wettkampf-Id"}), 400

    data = request.get_json(silent=True) or {}
    userId = data.get("userId")
    if not userId or not ObjectId.is_valid(userId):
        return jsonify({"ok": False, "message": "Fehlende oder Ungültige User-Id"}), 400
    
    comp_oid = ObjectId(competition_id)
    user_oid = ObjectId(userId)

    if not competition_collection.find_one({"_id": comp_oid}, {"_id": 1}):
        return jsonify({"ok": False, "message": "Wettkampf nicht gefunden"}), 404
    
    if not users_collection.find_one({"_id": user_oid}, {"_id": 1}):
        return jsonify({"ok": False, "message": "Nutzer nicht gefunden"}), 404
    
    res = competition_entries_collection.delete_one(
        {"competitionId": comp_oid, "userId": user_oid}
    )

    return jsonify({"ok": True, "left": True, "deleted": res.deleted_count == 1}), 200


################################################################################################### Add / Update Points
@competition_bp.route('/competition/<competition_id>/points', methods=['PUT'])
def add_points(competition_id):
    if not competition_id or not ObjectId.is_valid(competition_id):
        return jsonify({"ok": False, "message": "Ungültige Wettkampf-Id"}), 400

    data = request.get_json(silent=True) or {}
    userId = data.get("userId")
    device = data.get("device")
    points = data.get("points")

    if not userId or not ObjectId.is_valid(userId):
        return jsonify({"ok": False, "message": "Ungültige User-Id"}), 400
    
    if not device or device not in ALLOWED_DEVICES:
        return jsonify({"ok": False, "message": "Ungültiges Gerät"}), 400
    
    if points is None or not isinstance(points, (int, float)) or points < 0:
        return jsonify({"ok": False, "message": "Ungültige Punktzahl"}), 400
    
    comp_oid = ObjectId(competition_id)
    user_oid = ObjectId(userId)

    comp = competition_collection.find_one({"_id": comp_oid})
    if checkIfIsPast(comp.get("date")):
        return jsonify({"ok": False, "message": "Der wettkapf ist bereits beendet - neue Punkte sind nicht mehr gültig"}), 403

    entry = competition_entries_collection.find_one(
        {"competitionId": comp_oid, "userId": user_oid},
        {"_id": 1}
    )
    if not entry:
        return jsonify({"ok": False, "message": "Nutzer ist nicht in diesem Wettkampf angemeldet"}), 403
    
    if points == 0:
        update = {"$unset": { f"scores.{device}": "" }}
    else:
        update = {"$set": { f"scores.{device}": points }}
    competition_entries_collection.update_one({"competitionId": comp_oid, "userId": user_oid}, update)    
    return jsonify({"ok": True, "device": device, "points": points}), 200
