import pytest
from flask import Flask

from account import account_bp


@pytest.fixture
def app():
    app = Flask(__name__)
    app.config.update(
        TESTING=True,
        SECRET_KEY="test-secret",
    )

    app.register_blueprint(account_bp)

    return app


@pytest.fixture
def client(app):
    return app.test_client()
