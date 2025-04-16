from mongoConf import *

competition_bp = Blueprint('competition', __name__)



@competition_bp.route('/competition/getAll', methods=['GET'])
def get_all_competitions():
    competitions = list(competition_collection.find())
    for comp in competitions:
        comp['_id'] = str(comp['_id'])
    return jsonify(competitions), 200

@competition_bp.route('/competition/create', methods=['POST'])
def create_competition():
    data = request.get_json()
    name = data.get('name')
    date = data.get('date')
    location = data.get('location')

    if not name or not date or not location:
        return jsonify({"message": "Name, Datum und Ort sind erforderlich!"}), 400

    competition = {
        "name": name,
        "date": date,
        "location": location,
        "participants": []
    }
    competition_collection.insert_one(competition)
    return jsonify({"message": "Wettkampf erfolgreich erstellt"}), 201

@competition_bp.route('/competition/delete/<competition_id>', methods=['DELETE'])
def delete_competition(competition_id):
    try:
        competition_id = ObjectId(competition_id)
    except Exception as e:
        return jsonify({"message": "Ungültige Wettkampfid"}), 400
    result = competition_collection.delete_one({"_id": competition_id})
    
    if result.deleted_count == 0:
        return jsonify({"message": "Wettkampf nicht gefunden"}), 404
    return jsonify({"message": "Wettkampf erfolgreich gelöscht"}), 200


@competition_bp.route('/competition/<competition_id>/addParticipant', methods=['POST'])
def add_participant(competition_id):
    data = request.get_json()
    participant_id = data.get('id')
    participant_name = data.get('name')

    if not participant_id:
        return jsonify({"message": "Teilnehmer-ID fehlt!"}), 400

    try:
        comp_obj_id = ObjectId(competition_id)
    except Exception:
        return jsonify({"message": "Ungültige Wettkampfid!"}), 400

    competition = competition_collection.find_one({"_id": comp_obj_id})
    if not competition:
        return jsonify({"message": "Wettkampf nicht gefunden!"}), 404

    result = competition_collection.update_one(
        {"_id": comp_obj_id},
        {"$push": {"participants": {"id": participant_id, "name": participant_name, "devices": []}}}
    )

    if result.modified_count == 0:
        return jsonify({"message": "Teilnehmer konnte nicht hinzugefügt werden!"}), 500

    return jsonify({"message": f"Teilnehmer {participant_id} erfolgreich hinzugefügt"}), 200


@competition_bp.route('/competition/<competition_id>/removeParticipant/<participant_id>', methods=['DELETE'])
def remove_participant(competition_id, participant_id):
    try:
        comp_obj_id = ObjectId(competition_id)
    except Exception:
        return jsonify({"message": "Ungültige Wettkampfid!"}), 400

    result = competition_collection.update_one(
        {"_id": comp_obj_id},
        {"$pull": {"participants": {"id": participant_id}}}
    )

    if result.modified_count == 0:
        return jsonify({"message": "Wettkampf oder Teilnehmer nicht gefunden"}), 404

    return jsonify({"message": f"Teilnehmer {participant_id} erfolgreich entfernt"}), 200


@competition_bp.route('/competition/<competition_id>/addDevice/<participant_id>', methods=['POST'])
def add_device_to_participant(competition_id, participant_id):
    data = request.get_json()
    device_name = data.get('deviceName')
    points = data.get('points')

    if not device_name or points is None:
        return jsonify({"message": "Gerätename und Punktezahl erforderlich!"}), 400

    try:
        comp_obj_id = ObjectId(competition_id)
    except Exception:
        return jsonify({"message": "Ungültige Wettkampfid!"}), 400

    result = competition_collection.update_one(
        {"_id": comp_obj_id, "participants.id": participant_id},
        {"$push": {"participants.$.devices": {"name": device_name, "points": points}}}
    )

    if result.modified_count == 0:
        return jsonify({"message": "Wettkampf oder Teilnehmer nicht gefunden"}), 404

    return jsonify({"message": f"Gerät {device_name} mit {points} Punkten hinzugefügt"}), 200


@competition_bp.route('/competition/<competition_id>/updateDevice/<participant_id>', methods=['PUT'])
def update_device_points(competition_id, participant_id):
    data = request.get_json()
    device_name = data.get('deviceName')
    new_points = data.get('points')

    if not device_name or new_points is None:
        return jsonify({"message": "Gerätename und neue Punktezahl erforderlich!"}), 400

    try:
        comp_obj_id = ObjectId(competition_id)
    except Exception:
        return jsonify({"message": "Ungültige Wettkampfid!"}), 400

    result = competition_collection.update_one(
        {"_id": comp_obj_id, "participants.id": participant_id, "participants.devices.name": device_name},
        {"$set": {"participants.$.devices.$[device].points": new_points}},
        array_filters=[{"device.name": device_name}]
    )

    if result.modified_count == 0:
        return jsonify({"message": "Wettkampf, Teilnehmer oder Gerät nicht gefunden"}), 404

    return jsonify({"message": f"Punkte für {device_name} auf {new_points} aktualisiert"}), 200