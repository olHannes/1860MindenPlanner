from flask import Flask
from flask_cors import CORS
import routine
import report
import account
import competition
from mongoConf import *

load_dotenv()

app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'mysecretkey')
app.config['SESSION_TYPE'] = 'filesystem'
app.config['SESSION_PERMANENT'] = True
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(minutes=15)
CORS(app)

@app.route("/")
def home():
    return "Server is running! Visit olhannes.github.io/1860MindenPlanner"

@app.route("/awake")
def awake():
    print("awake")
    return "awake Server"

app.register_blueprint(routine.routine_bp)
app.register_blueprint(competition.competition_bp)
app.register_blueprint(account.account_bp)
app.register_blueprint(report.report_bp)

if __name__ == '__main__':
    port = int(os.getenv("PORT", 10000))
    app.run(host="0.0.0.0", port=port, debug=False)
