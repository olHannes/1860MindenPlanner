
from datetime import datetime, timezone

from account import parse_expires_at


def test_parse_expires_at_none():
    assert parse_expires_at(None) is None


def test_parse_expires_at_naive_datetime_gets_utc():
    dt = datetime(2026, 1, 1, 12, 0, 0)

    result = parse_expires_at(dt)

    assert result.tzinfo == timezone.utc


def test_parse_expires_at_iso_z_string():
    result = parse_expires_at("2026-01-01T12:00:00Z")

    assert result.tzinfo is not None
    assert result.year == 2026
