from pymongo import MongoClient
import os
from dotenv import load_dotenv

# Lade die Umgebungsvariablen aus der .env-Datei
load_dotenv()

# Lade die MongoDB URI aus der Umgebungsvariable
mongo_uri = os.getenv("MONGO_URI")

if not mongo_uri:
    raise ValueError("MONGO_URI Umgebungsvariable fehlt!")

# Stelle eine Verbindung zur MongoDB-Datenbank her
client = MongoClient(mongo_uri)

# Wähle die Datenbank und Sammlung
db = client['Users']  # 'Users' ist der Name der Datenbank
users_collection = db.users  # 'users' ist der Name der Sammlung

# Lese alle Nutzerdaten
users = users_collection.find()  # Alle Nutzer finden

# Gib die Nutzerdaten aus
for user in users:
    print(user)
