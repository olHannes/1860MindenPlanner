from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
from datetime import timedelta
import os
import routes
from pymongo import MongoClient
import threading

load_dotenv()

app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'mysecretkey')
app.config['SESSION_TYPE'] = 'filesystem'
app.config['SESSION_PERMANENT'] = True
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(minutes=15)
CORS(app)


mongo_uri = os.getenv("MONGO_URI")
client = MongoClient(mongo_uri)

db = client['Users']
users_collection = db['users']


@app.route("/")
def home():
    return "Server is running!"


app.register_blueprint(routes.main_bp)

if __name__ == '__main__':
    port = int(os.getenv("PORT", 10000))
    cleanup_thread = threading.Thread(target=routes.cleanup_inactive_users, daemon=True)
    cleanup_thread.start()
    app.run(host="0.0.0.0", port=port, debug=False)
