from flask import Blueprint

main_bp = Blueprint('main', __name__)

@main_bp.route('/hello', methods=["GET"])
def sayHello():
    return "Hello World"
