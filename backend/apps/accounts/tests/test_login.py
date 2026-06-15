from datetime import datetime, timezone as dt_timezone

import pytest
from rest_framework_simplejwt.tokens import RefreshToken

VALID_PASSWORD = "StrongPassword123"
LOGIN_URL = "/api/auth/login"


def _refresh_lifetime_days(refresh_token: str) -> float:
    token = RefreshToken(refresh_token)
    exp = datetime.fromtimestamp(token["exp"], tz=dt_timezone.utc)
    now = datetime.now(tz=dt_timezone.utc)
    return (exp - now).total_seconds() / 86400


@pytest.mark.django_db
def test_login_success(api_client, user):
    response = api_client.post(
        LOGIN_URL,
        {"email": user.email, "password": VALID_PASSWORD},
        format="json",
    )

    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert body["data"]["user"]["email"] == user.email
    assert "access" in body["data"]["tokens"]
    assert "refresh" in body["data"]["tokens"]


@pytest.mark.django_db
def test_login_invalid_credentials_returns_401(api_client, user):
    response = api_client.post(
        LOGIN_URL,
        {"email": user.email, "password": "WrongPassword123"},
        format="json",
    )

    assert response.status_code == 401
    body = response.json()
    assert body["success"] is False
    assert "errors" in body


@pytest.mark.django_db
def test_login_remember_me_extends_refresh_to_30_days(api_client, user):
    response = api_client.post(
        LOGIN_URL,
        {"email": user.email, "password": VALID_PASSWORD, "remember_me": True},
        format="json",
    )

    refresh = response.json()["data"]["tokens"]["refresh"]
    lifetime_days = _refresh_lifetime_days(refresh)
    assert 29 <= lifetime_days <= 30


@pytest.mark.django_db
def test_login_without_remember_me_refresh_expiry_7_days(api_client, user):
    response = api_client.post(
        LOGIN_URL,
        {"email": user.email, "password": VALID_PASSWORD, "remember_me": False},
        format="json",
    )

    refresh = response.json()["data"]["tokens"]["refresh"]
    lifetime_days = _refresh_lifetime_days(refresh)
    assert 6 <= lifetime_days <= 7
