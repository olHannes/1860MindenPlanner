from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
import os
import routes

load_dotenv()

app = Flask(__name__)
CORS(app)

app.config["MONGO_URI"] = os.getenv("MONGO_URI")
app.secret_key = os.getenv("SECRET_KEY")

app.register_blueprint(routes.main_bp)

if __name__ == '__main__':
    app.run(debug=True)
