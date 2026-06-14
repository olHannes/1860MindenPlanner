import pytest
from flask import Flask

import account
import security
from tests.fakes.fake_collection import FakeCollection


@pytest.fixture
def app():
    app = Flask(__name__)
    app.config.update(
        TESTING=True,
        SECRET_KEY="test-secret",
    )

    app.register_blueprint(account.account_bp)

    return app


@pytest.fixture
def client(app):
    return app.test_client()


@pytest.fixture
def fake_users(monkeypatch):
    fake_collection = FakeCollection(documents=[])
    monkeypatch.setattr(account, "users_collection", fake_collection)
    monkeypatch.setattr(security, "users_collection", fake_collection)

    return fake_collection
