
import pytest
from factories import make_competition



def test_create_competition_success(client, fake_competitions):
    payload = make_competition()

    response = client.post("/competition/create", json=payload)

    assert response.status_code == 200

    body = response.get_json()
    assert body["ok"] is True
    assert body["message"] == "Wettkampf erfolgreich erstellt"
    assert "competitionId" in body

    assert len(fake_competitions.documents) == 1
    assert fake_competitions.documents[0]["name"] == "Testwettkampf"
    assert fake_competitions.documents[0]["date"] == "2026-07-20"
    assert fake_competitions.documents[0]["location"] == "Minden"


@pytest.mark.parametrize(
    "payload",
    [
        {},
        {"name": "Testwettkampf"},
        {"date": "2026-07-20"},
        {"location": "Minden"},
        {"name": "Testwettkampf", "date": "2026-07-20"},
        {"name": "Testwettkampf", "location": "Minden"},
        {"date": "2026-07-20", "location": "Minden"},
        {"name": "", "date": "2026-07-20", "location": "Minden"},
        {"name": "Testwettkampf", "date": "", "location": "Minden"},
        {"name": "Testwettkampf", "date": "2026-07-20", "location": ""},
    ],
)
def test_create_competition_missing_required_fields(
    client,
    fake_competitions,
    payload,
):
    response = client.post("/competition/create", json=payload)

    assert response.status_code == 400
    assert response.get_json() == {
        "ok": False,
        "message": "Name, Datum und Ort sind erforderlich!",
    }
    assert len(fake_competitions.documents) == 0



def test_create_competition_without_json_body(client, fake_competitions):
    response = client.post("/competition/create")

    assert response.status_code == 400
    assert response.get_json() == {
        "ok": False,
        "message": "Name, Datum und Ort sind erforderlich!",
    }
    assert len(fake_competitions.documents) == 0



def test_create_competition_with_invalid_json(client, fake_competitions):
    response = client.post(
        "/competition/create",
        data="{invalid json",
        content_type="application/json",
    )

    assert response.status_code == 400
    assert response.get_json() == {
        "ok": False,
        "message": "Name, Datum und Ort sind erforderlich!",
    }
    assert len(fake_competitions.documents) == 0
