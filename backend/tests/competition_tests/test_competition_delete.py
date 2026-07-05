from bson import ObjectId
from factories import make_competition


def test_delete_competition_success(client, fake_competitions, fake_competition_entries):
    competition = make_competition()

    comp_id = fake_competitions.insert_one(competition).inserted_id

    fake_competition_entries.insert_one(
        {
            "competitionId": comp_id,
            "userId": ObjectId(),
        }
    )
    fake_competition_entries.insert_one(
        {
            "competitionId": comp_id,
            "userId": ObjectId(),
        }
    )

    response = client.delete(f"/competition/{comp_id}")

    assert response.status_code == 200
    data = response.get_json()
    assert data["ok"] is True
    assert data["message"] == "Wettkampf erfolgreich gelöscht"
    assert data["deletedEntries"] == 2

    assert fake_competitions.find_one({"_id": comp_id}) is None
    assert fake_competition_entries.count_documents({"competitionId": comp_id}) == 0


def test_delete_competition_without_entries_returns_200(
    client, fake_competitions, fake_competition_entries
):
    competition = make_competition()
    comp_id = fake_competitions.insert_one(competition).inserted_id

    response = client.delete(f"/competition/{comp_id}")

    assert response.status_code == 200
    data = response.get_json()
    assert data["ok"] is True
    assert data["deletedEntries"] == 0
    assert fake_competitions.find_one({"_id": comp_id}) is None
    assert fake_competition_entries.count_documents({"competitionId": comp_id}) == 0


def test_delete_competition_not_found_returns_404(
    client, fake_competitions, fake_competition_entries
):
    comp_id = ObjectId()

    response = client.delete(f"/competition/{comp_id}")

    assert response.status_code == 404
    data = response.get_json()
    assert data["ok"] is False
    assert data["message"] == "Wettkampf nicht gefunden"


def test_delete_competition_not_found_does_not_delete_entries(
    client, fake_competitions, fake_competition_entries
):
    unknown_comp_id = ObjectId()

    fake_competition_entries.insert_one({"competitionId": unknown_comp_id, "userId": ObjectId()})

    response = client.delete(f"/competition/{unknown_comp_id}")

    assert response.status_code == 404
    assert fake_competition_entries.count_documents({"competitionId": unknown_comp_id}) == 1


def test_delete_competition_invalidId_returns_400(
    client, fake_competitions, fake_competition_entries
):
    response = client.delete("/competition/not-a-valid-object-id")

    assert response.status_code == 400
    data = response.get_json()
    assert data["ok"] is False
    assert data["message"] == "Ungültige Wettkampf-Id"
