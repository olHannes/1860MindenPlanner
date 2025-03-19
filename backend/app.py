from flask import Flask
from flask_cors import CORS


app = Flask(__name__)

CORS(app)

from routes import main_bp
app.register_blueprint(main_bp)

if __name__ == '__main__':
    app.run(debug=True)
