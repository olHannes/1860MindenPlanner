from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
import os
import routes
from pymongo import MongoClient

# Lade Umgebungsvariablen aus der .env-Datei
load_dotenv()

app = Flask(__name__)
CORS(app)

# MongoDB-Verbindung
mongo_uri = os.getenv("MONGO_URI")
client = MongoClient(mongo_uri)

# Datenbank- und Collection-Referenz
db = client['Users']  # Hole die Standard-Datenbank, die aus der URI abgerufen wird
users_collection = db['users']  # Stelle sicher, dass die Collection 'users' existiert

secret_key = os.getenv("SECRET_KEY")
if not secret_key:
    raise ValueError("SECRET_KEY Umgebungsvariable fehlt!")
app.secret_key = secret_key 

# Registriere die Routen (Blueprints)
app.register_blueprint(routes.main_bp)

if __name__ == '__main__':
    app.run(debug=True)
