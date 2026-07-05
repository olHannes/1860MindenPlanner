from bson import ObjectId
from factories import make_competition


def test_load_all_competitions_without_user_id_returns_200(client, fake_competitions, fake_competition_entries):
    competition_1 = make_competition(name="Wettkampf 1", date="2030-01-03")
    competition_2 = make_competition(name="Wettkampf 2", date="2030-01-01")
    competition_3 = make_competition(name="Wettkampf 3", date="2030-01-02")

    fake_competitions.insert_one(competition_1)
    fake_competitions.insert_one(competition_2)
    fake_competitions.insert_one(competition_3)

    response = client.get("/competition/all")

    assert response.status_code == 200
    data = response.get_json()
    assert data["ok"] is True
    assert len(data["competitions"]) == 3

    names = [comp["name"] for comp in data["competitions"]]
    assert names == [
        "Wettkampf 2",
        "Wettkampf 3",
        "Wettkampf 1"
    ]
    for comp in data["competitions"]:
        assert "_id" in comp
        assert "name" in comp
        assert "location" in comp
        assert "date" in comp
        assert "isPast" in comp

        assert "joined" not in comp

def test_load_all_competitions_with_user_id_marks_joined_correctly(client, fake_competitions, fake_competition_entries):
    user_id = ObjectId()
    other_user_id = ObjectId()

    competition_1 = make_competition(name="Wettkampf 1", date="2030-01-01")
    competition_2 = make_competition(name="Wettkampf 2", date="2030-01-02")
    competition_3 = make_competition(name="Wettkampf 3", date="2030-01-03")

    comp_1_id = fake_competitions.insert_one(competition_1).inserted_id
    comp_2_id = fake_competitions.insert_one(competition_2).inserted_id
    comp_3_id = fake_competitions.insert_one(competition_3).inserted_id

    fake_competition_entries.insert_one({"competitionId": comp_1_id, "userId": user_id})
    fake_competition_entries.insert_one({"competitionId": comp_3_id, "userId": user_id})
    fake_competition_entries.insert_one({"competitionId": comp_2_id, "userId": other_user_id})

    with client.session_transaction() as session:
        session["user_id"] = str(user_id)
    
    response = client.get("/competition/all")

    assert response.status_code == 200
    data = response.get_json()
    assert data["ok"] is True
    assert len(data["competitions"]) == 3

    competitions_by_name = {
        comp["name"]: comp 
        for comp in data["competitions"]
    }
    assert competitions_by_name["Wettkampf 1"]["joined"] is True
    assert competitions_by_name["Wettkampf 2"]["joined"] is False
    assert competitions_by_name["Wettkampf 3"]["joined"] is True


def test_load_all_competitions_with_invalid_user_id_returns_400(client, fake_competitions, fake_competition_entries):
    with client.session_transaction() as session:
        session["user_id"] = "not-a-valid-object-id"

    response = client.get("/competition/all")

    assert response.status_code == 400
    data = response.get_json()
    assert data["ok"] is False
    assert data["message"] == "Ungültige userId"
