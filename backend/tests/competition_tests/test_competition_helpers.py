from datetime import date, datetime
import pytest
import competition


class FixedDate(date):
    @classmethod
    def today(cls):
        return cls(2026, 7, 5)


@pytest.fixture(autouse=True)
def freeze_today(monkeypatch):
    monkeypatch.setattr(competition, "date", FixedDate)


@pytest.mark.parametrize(
    "date_raw, expected",
    [
        # Strings im gültigen Format
        ("2026-07-03", True),   # mehr als 1 Tag vorbei
        ("2026-07-04", True),   # gestern => heute >= gestern + 1 Tag
        ("2026-07-05", False),  # heute
        ("2026-07-06", False),  # morgen

        # date-Objekte
        (date(2026, 7, 3), False),
        (date(2026, 7, 4), False),
        (date(2026, 7, 5), False),
        (date(2026, 7, 6), False),

        # datetime-Objekte
        (datetime(2026, 7, 3, 23, 59), True),
        (datetime(2026, 7, 4, 0, 1), True),
        (datetime(2026, 7, 5, 12, 0), False),
        (datetime(2026, 7, 6, 8, 30), False),

        # Ungültige oder nicht unterstützte Eingaben
        ("2026/07/04", False),
        ("04.07.2026", False),
        ("", False),
        (None, False),
        (123, False),
        ([], False),
        ({}, False),
    ],
)
def test_check_if_is_past(date_raw, expected):
    assert competition.checkIfIsPast(date_raw) is expected