
import pytest

import account
from bson import ObjectId
from werkzeug.security import generate_password_hash

from tests.fakes.fake_collection import FakeCollection


@pytest.fixture
def fake_users(monkeypatch):
    fake_collection = FakeCollection(documents=[])
    monkeypatch.setattr(account, "users_collection", fake_collection)
    return fake_collection


def make_user(email="test@gmail.com", password="test123", roles=None, verified=True):
    return {
        "_id": ObjectId(),
        "email": email,
        "password": generate_password_hash(password),
        "emailVerify": {
            "email_verified": verified
        },
        "roles": roles or ["member"],
        "online": 0
    }




def test_login_without_data_returns_400(client, fake_users):
    response = client.post("/account/login", json={})

    assert response.status_code == 400
    assert response.json["ok"] is False
    assert response.json["message"] == "Validierung fehlgeschlagen."


def test_login_invalid_email_returns_400(client, fake_users):
    response = client.post("/account/login", json={
        "email": "testexample.com",
        "password": "correct-password"
    })

    assert response.status_code == 400
    assert response.json["ok"] is False


def test_login_unknown_user_returns_404(client, fake_users):
    response = client.post("/account/login", json={
        "email": "test@example.com",
        "password": "secret123"
    })

    assert response.status_code == 404
    assert response.json["ok"] is False


def test_login_wrong_password_returns_401(client, fake_users):
    fake_users.documents.append(make_user(password="correct-password"))
    
    response = client.post("/account/login", json={
        "email": "test@gmail.com",
        "password": "wrong-password"
    })

    assert response.status_code == 401
    assert response.json["ok"] is False


def test_login_unverified_user_returns_404(client, fake_users):
    user = make_user(password="correct-password", verified=False)
    fake_users.documents.append(user)

    response = client.post("/account/login", json={
        "email": "test@gmail.com",
        "password": "correct-password"
    })

    assert response.status_code == 404
    assert response.json["ok"] is False


def test_login_admin_dows_not_increment_online(client, fake_users):
    user = make_user(password="correct-password", roles=["member", "admin"])
    fake_users.documents.append(user)

    response = client.post("/account/login", json={
        "email": "test@gmail.com",
        "password": "correct-password"
    })

    assert response.status_code == 200
    assert response.json["isAdmin"] is True
    assert fake_users.documents[0]["online"] == 0


def test_login_success_returns_200(client, fake_users):
    user = make_user(password="correct-password")
    fake_users.documents.append(user)

    response = client.post("/account/login", json={
        "email": "test@gmail.com",
        "password": "correct-password",
        "remember": False
    })

    assert response.status_code == 200
    assert response.json["ok"] is True
    assert response.json["userId"] == str(user["_id"])

    with client.session_transaction() as session:
        assert session["user_id"] == str(user["_id"])
        assert session.permanent is False
    
    assert fake_users.documents[0]["online"] == 1


def test_login_success_remember_returns_200(client, fake_users):
    user = make_user(password="correct-password")
    fake_users.documents.append(user)

    response = client.post("/account/login", json={
        "email": "test@gmail.com",
        "password": "correct-password",
        "remember": True
    })

    assert response.status_code == 200
    assert response.json["ok"] is True
    assert response.json["userId"] == str(user["_id"])

    with client.session_transaction() as session:
        assert session["user_id"] == str(user["_id"])
        assert session.permanent is True
    
    assert fake_users.documents[0]["online"] == 1