from flask import Flask
from flask_cors import CORS
import routes

app = Flask(__name__)
app.secret_key = 'ioddugjreotvu98vrv89t9<7077rvn9e8qw7rte6'
CORS(app)

app.register_blueprint(routes.main_bp)

if __name__ == '__main__':
    app.run(debug=True)
