from flask import Flask, jsonify, request
from pymongo import MongoClient
from flask_cors import CORS
from dotenv import load_dotenv
import os
from werkzeug.security import generate_password_hash  # Zum Hashen des Passworts

# Lade Umgebungsvariablen aus der .env-Datei
load_dotenv()

app = Flask(__name__)
CORS(app)

# Lade die MONGO_URI-Umgebungsvariable
mongo_uri = os.getenv("MONGO_URI")
if not mongo_uri:
    raise ValueError("MONGO_URI Umgebungsvariable fehlt!")

# Stelle eine Verbindung zur MongoDB-Datenbank her
client = MongoClient(mongo_uri)

# Statt get_database() einfach den Datenbanknamen explizit angeben
db = client['Users']  # Gebe den Datenbanknamen hier an

@app.route('/')
def index():
    try:
        # Zugriff auf die 'users'-Sammlung
        users_collection = db.users  # Zugriff auf die "users"-Sammlung
        users = users_collection.find()  # Alle Benutzer in der Sammlung finden
        users_list = [user for user in users]  # Umwandlung der Cursor-Daten in eine Liste
        
        return jsonify(users_list)  # Ausgabe der Benutzer als JSON

    except Exception as e:
        return f"Fehler beim Abrufen der Daten: {str(e)}", 500


# Route zum Erstellen eines neuen Benutzers
@app.route('/create_user', methods=['POST'])
def create_user():
    try:
        # Hole die Daten aus dem POST-Request
        data = request.get_json()
        vorname = data.get('vorname')
        nachname = data.get('nachname')
        passwort = data.get('passwort')

        if not vorname or not nachname or not passwort:
            return jsonify({"message": "Fehlende Daten: Vorname, Nachname und Passwort sind erforderlich!"}), 400
        
        # Passwort hashieren
        hashed_password = generate_password_hash(passwort)

        # Füge den Benutzer in die MongoDB-Datenbank ein
        users_collection = db.users
        user_data = {
            "vorname": vorname,
            "nachname": nachname,
            "passwort": hashed_password
        }

        # Insert den neuen Benutzer
        users_collection.insert_one(user_data)

        return jsonify({"message": "Benutzer erfolgreich erstellt!"}), 201

    except Exception as e:
        return jsonify({"message": f"Fehler beim Erstellen des Benutzers: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(debug=True)
