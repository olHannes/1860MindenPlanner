from mongoConf import *

report_bp = Blueprint('reports', __name__)



################################################################################################### Report erstellen

@report_bp.route('/report/issue', methods=['POST'])
def createReport():
    data = request.get_json()
    username = data.get('username')
    reportType = data.get('reportType')
    reportTitle = data.get('reportTitle')
    report = data.get('report')
    
    if not username or not reportTitle or not report or not reportType:
        return jsonify({"message": "Fehlende Daten!"}), 400

    if issues_collection.find_one({"reportTitle": reportTitle}):
        return jsonify({"message": "Report existiert bereits"}), 400

    timestamp = datetime.now(timezone.utc)

    notification.send_mail(reportType, reportTitle, report, username, timestamp)
    issues_collection.insert_one({
        'reportType': reportTitle,
        'reportTitle': reportTitle,
        'report': report,
        'username': username,
        'timestamp': timestamp
    })

    return jsonify({"message": "Report erfolgreich erstellt"}), 200


################################################################################################### Reports auslesen

@report_bp.route('/report/all', methods=['GET'])
def getAllReports():
    reports = list(issues_collection.find({}, {'_id': 0}))
    return jsonify(reports), 200


################################################################################################### Report löschen

@report_bp.route('/report/delete', methods=['DELETE'])
def deleteReport():
    data = request.get_json()
    reportTitle = data.get('reportTitle')

    if not reportTitle:
        return jsonify({"message": "ReportTitle fehlt!"}), 400

    result = issues_collection.delete_one({"reportTitle": reportTitle})

    if result.deleted_count == 0:
        return jsonify({"message": "Report nicht gefunden"}), 404

    return jsonify({"message": f"Report '{reportTitle}' erfolgreich gelöscht"}), 200
