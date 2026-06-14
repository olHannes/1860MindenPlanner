from bson import ObjectId
from factories import make_user


def test_logout_success_clears_session_and_decrements_online(client, fake_users):
    user = make_user(verified=True)
    user["online"] = 1

    fake_users.documents.append(user)
    csrf_token = "test-csrf-token"

    with client.session_transaction() as session:
        session["user_id"] = str(user["_id"])
        session["csrf_token"] = csrf_token

    response = client.post("/account/logout", headers={"X-CSRF-Token": csrf_token})

    assert response.status_code == 200
    assert response.json["ok"] is True
    assert response.json["message"] == "Erfolgreich ausgeloggt!"

    with client.session_transaction() as session:
        assert "user_id" not in session

    assert user["online"] == 0


def test_logout_without_session_returns_401(client, fake_users):
    csrf_token = "test-csrf-token"

    with client.session_transaction() as sess:
        sess["csrf_token"] = csrf_token

    response = client.post(
        "/account/logout",
        headers={"X-CSRF-Token": csrf_token},
    )

    assert response.status_code == 401
    assert response.json["ok"] is False
    assert response.json["message"] == "Nicht angemeldet"


def test_logout_with_missing_user_clears_or_rejects_session(client, fake_users):
    missing_user_id = ObjectId()
    csrf_token = "test-csrf-token"

    with client.session_transaction() as session:
        session["user_id"] = str(missing_user_id)
        session["csrf_token"] = csrf_token

    response = client.post("/account/logout", headers={"X-CSRF-Token": csrf_token})

    assert response.status_code == 401
    assert response.json["ok"] is False
    assert response.json["message"] == "Nicht angemeldet"

    with client.session_transaction() as session:
        assert "user_id" not in session
        assert "csrf_token" not in session
