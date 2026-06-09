
import os
import secrets
from datetime import timedelta

from dotenv import load_dotenv
from flask import Flask, jsonify, session
from flask_cors import CORS
from flask_session import Session
from redis import Redis

from extension import limiter

import routine
import report
import account
import competition
from mongoConf import *


load_dotenv()

app = Flask(__name__)

APP_ENV = os.getenv("APP_ENV", "development")
IS_PRODUCTION = APP_ENV == "production"

secret_key = os.getenv("SECRET_KEY")
if IS_PRODUCTION and not secret_key:
    raise RuntimeError("SECRET_KEY fehlt in Production")

app.config["SECRET_KEY"] = secret_key

#server side records via redis
app.config["SESSION_TYPE"] = "redis"
app.config["SESSION_REDIS"] = Redis.from_url(
    os.getenv("SESSION_REDIS_URL", "redis://redis:6379/1")
)

app.config["SESSION_PERMANENT"] = True
app.config["PERMANENT_SESSION_LIFETIME"] = timedelta(days=30)

#cookie-config
app.config["SESSION_COOKIE_NAME"] = "routineplanner_session"
app.config["SESSION_COOKIE_HTTPONLY"] = True

if IS_PRODUCTION:
    app.config["SESSION_COOKIE_SECURE"] = True
    app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
else:
    app.config["SESSION_COOKIE_SECURE"] = False
    app.config["SESSION_COOKIE_SAMESITE"] = "Lax"



Session(app)


frontend_origins_raw = os.getenv("FRONTEND_ORIGINS", "")
allowed_origins = [
    origin.strip()
    for origin in frontend_origins_raw.split(",")
    if origin.strip()
]


CORS(
    app,
    resources={r"/*": {"origins": allowed_origins}},
    supports_credentials=True
)

limiter.init_app(app)


@app.route("/")
def home():
    return "Server is running! Visit https://routineplanner.de"

@app.route("/awake")
def awake():
    print("awake")
    return "awake Server"

@app.route("/csrf", methods=["GET"])
def generate_csrf():
    if not session.get("user_id"):
        return jsonify({"ok": False, "message": "Nicht angemeldet"}), 401

    token = session.get("csrf_token")
    if not token:
        token = secrets.token_urlsafe(32)
        session["csrf_token"] = token
    return jsonify({"ok": True, "csrfToken": token})



if not IS_PRODUCTION:
    @app.route("/debug-set-session")
    def debug_set_session():
        session["debug_test"] = "hello"
        return jsonify({
            "ok": True,
            "session": dict(session)
        })

    @app.route("/debug-get-session")
    def debug_get_session():
        return jsonify({
            "ok": True,
            "session": dict(session)
        })





app.register_blueprint(routine.routine_bp)
app.register_blueprint(competition.competition_bp)
app.register_blueprint(account.account_bp)
app.register_blueprint(report.report_bp)


if __name__ == '__main__':
    port = int(os.getenv("PORT", 10000))
    app.run(host="0.0.0.0", port=port, debug=not IS_PRODUCTION)
