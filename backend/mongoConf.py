from flask import Blueprint, session, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from dotenv import load_dotenv
import os
from pymongo import MongoClient
from datetime import datetime, timezone, timedelta
import time
from bson import ObjectId
import notification

load_dotenv()

mongo_uri = os.getenv("MONGO_URI")
client = MongoClient(mongo_uri)

db_user = client['Users']
users_collection = db_user['users']
issues_collection = db_user['issues']


db_exercises = client['Exercises']
exercises_collection = db_exercises['User_Exercises']

db_floorElements = db_exercises['Floor']
db_pommelhorseElements = db_exercises['Pommelhorse']
db_ringsElements = db_exercises['Rings']
db_vaultElements = db_exercises['Vault']
db_parralelbarsElements = db_exercises['Parralelbars']
db_highbarElements = db_exercises['Highbar']

db_competition = client['Competition']
competition_collection = db_competition['Competition']