import pytest
from bson import ObjectId

from test_account_login import make_user, fake_users

import account
from tests.fakes.fake_collection import FakeCollection



def set_session_user(client, user_id, permanent=False):
    with client.session_transaction() as session:
        session["user_id"] = str(user_id)
        session.permanent = permanent


def test_get_current_user_without_session_returns_401(client):
    response = client.get("/account/me")

    assert response.status_code == 401
    data = response.get_json()
    assert data["ok"] is False
    assert data["message"] == "Nicht angemeldet"


def test_get_current_user_with_invalid_objectId_clears_session(client):
    with client.session_transaction() as session:
        session["user_id"] = "not-a-valid-object-id"
    
    response = client.get("/account/me")

    assert response.status_code == 401
    assert response.json["ok"] is False
    assert response.json["message"] == "Ungültige Session"

    with client.session_transaction() as session:
        assert "user_id" not in session


def test_get_current_user_not_found_clears_session(client):
    user_id = ObjectId()
    set_session_user(client, user_id)

    response = client.get("/account/me")

    assert response.status_code == 401
    assert response.json["ok"] is False
    assert response.json["message"] == "Nutzer nicht gefunden"

    with client.session_transaction() as session:
        assert "user_id" not in session


def test_get_current_user_returns_logged_in_user(client, fake_users):
    user = make_user(
        email="test@gmail.com",
        roles=["member"],
        verified=True,
    )
    user["firstName"] = "Max"
    user["lastName"] = "Mustermann"
    user["color_code"] = "#ff0000"
    user["visibility"] = 2

    fake_users.documents.append(user)
    set_session_user(client, user["_id"], permanent=False)

    response = client.get("/account/me")

    assert response.status_code == 200
    data = response.get_json()

    assert data["ok"] is True
    assert data["user"]["id"] == str(user["_id"])
    assert data["user"]["email"] == "test@gmail.com"
    assert data["user"]["firstName"] == "Max"
    assert data["user"]["lastName"] == "Mustermann"
    assert data["user"]["roles"] == ["member"]
    assert data["user"]["isAdmin"] is False
    assert data["user"]["color"] == "#ff0000"
    assert data["user"]["visibility"] == 2
    assert data["user"]["autoLogin"] is False


def test_get_current_user_admin_has_is_admin_true(client, fake_users):
    user = make_user(roles=["member", "admin"], verified=True)

    fake_users.documents.append(user)
    set_session_user(client, user["_id"])

    response = client.get("/account/me")

    assert response.status_code == 200
    data = response.get_json()

    assert data["user"]["roles"] == ["member", "admin"]
    assert data["user"]["isAdmin"] is True


def test_get_current_user_unverified_user_is_rejected(client, fake_users):
    user = make_user(verified=False)

    fake_users.documents.append(user)
    set_session_user(client, user["_id"])

    response = client.get("/account/me")

    assert response.status_code == 401

    assert response.json["ok"] is False
    assert response.json["message"] == "Nutzer nicht gefunden"

    with client.session_transaction() as sess:
        assert "user_id" not in sess



def test_get_current_user_uses_default_values(client, fake_users):
    user = make_user(verified=True)

    user.pop("roles", None)
    user.pop("firstName", None)
    user.pop("lastName", None)
    user.pop("color_code", None)
    user.pop("visibility", None)

    fake_users.documents.append(user)
    set_session_user(client, user["_id"])

    response = client.get("/account/me")

    assert response.status_code == 200
    data = response.get_json()["user"]

    assert data["firstName"] == ""
    assert data["lastName"] == ""
    assert data["roles"] == ["member"]
    assert data["isAdmin"] is False
    assert data["color"] == "#000000"
    assert data["visibility"] == 1



def test_get_current_user_autologin(client, fake_users):
    user = make_user(verified=True)

    fake_users.documents.append(user)
    set_session_user(client, user["_id"], permanent=True)

    response = client.get("/account/me")

    assert response.status_code == 200
    assert response.json["user"]["autoLogin"] is True


def test_get_current_user_no_autologin(client, fake_users):
    user = make_user(verified=True)

    fake_users.documents.append(user)
    set_session_user(client, user["_id"], permanent=False)

    response = client.get("/account/me")

    assert response.status_code == 200
    assert response.json["user"]["autoLogin"] is False