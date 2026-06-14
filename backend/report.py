from mongoConf import *

from security import csrf_protect

report_bp = Blueprint("reports", __name__)


def serialize_mongo(doc):
    if isinstance(doc, list):
        return [serialize_mongo(item) for item in doc]
    if isinstance(doc, dict):
        return {k: serialize_mongo(v) for k, v in doc.items()}
    if isinstance(doc, ObjectId):
        return str(doc)
    return doc


################################################################################################### Report erstellen


@report_bp.route("/report/issue", methods=["POST"])
@csrf_protect
def createReport():
    user_id = session.get("user_id")
    data = request.get_json()
    reportType = data.get("type")
    reportTitle = data.get("title")
    report = data.get("body")

    if not user_id or not ObjectId.is_valid(user_id):
        return jsonify({"ok": False, "message": "Ungültiger Wert oder fehlende User-ID"}), 400
    if not reportTitle:
        return jsonify({"ok": False, "message": "Fehlender Titel"}), 400
    if not reportType:
        return jsonify({"ok": False, "message": "Fehlender Typ"}), 400
    if not reportTitle:
        return jsonify({"ok": False, "message": "Fehlender Titel"}), 400
    if not report:
        return jsonify({"ok": False, "message": "Fehlender Body"}), 400

    user = users_collection.find_one({"_id": ObjectId(user_id)})
    if not user:
        return jsonify({"ok": False, "message": "Nutzer nicht gefunden"}), 404

    username = user["firstName"]

    if issues_collection.find_one({"reportTitle": reportTitle}):
        return jsonify({"ok": False, "message": "Report existiert bereits"}), 400

    timestamp = datetime.now(timezone.utc)

    notification.send_mail(
        notification.build_report(reportType, reportTitle, report, username, timestamp, None)
    )

    issues_collection.insert_one(
        {
            "reportType": reportType,
            "reportTitle": reportTitle,
            "report": report,
            "username": username,
            "timestamp": timestamp,
        }
    )
    return jsonify({"ok": True, "message": "Report erfolgreich erstellt"}), 200


################################################################################################### Reports auslesen


@report_bp.route("/report/all", methods=["GET"])
def getAllReports():
    raw = list(issues_collection.find({}, {}))
    reports = serialize_mongo(raw)
    return jsonify({"ok": True, "reports": reports}), 200


################################################################################################### Report löschen


@report_bp.route("/report/delete", methods=["DELETE"])
def deleteReport():
    data = request.get_json()
    report_id = data.get("id")

    if not report_id or not ObjectId.is_valid(report_id):
        return jsonify({"ok": False, "message": "Ungültiger Wert oder fehlende Report-ID"}), 400

    result = issues_collection.delete_one({"_id": ObjectId(report_id)})

    if result.deleted_count == 0:
        return jsonify({"message": "Report nicht gefunden"}), 404

    return jsonify({"message": f"Report '{report_id}' erfolgreich gelöscht"}), 200
