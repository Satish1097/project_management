import pytest

VALID_PASSWORD = "StrongPassword123"
LOGIN_URL = "/api/auth/login"
REFRESH_URL = "/api/auth/refresh"
LOGOUT_URL = "/api/auth/logout"


def _login_tokens(api_client, user):
    response = api_client.post(
        LOGIN_URL,
        {"email": user.email, "password": VALID_PASSWORD},
        format="json",
    )
    tokens = response.json()["data"]["tokens"]
    return tokens["access"], tokens["refresh"]


@pytest.mark.django_db
def test_refresh_token_works(api_client, user):
    _, refresh = _login_tokens(api_client, user)

    response = api_client.post(REFRESH_URL, {"refresh": refresh}, format="json")

    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert "access" in body["data"]


@pytest.mark.django_db
def test_refresh_rotation_returns_new_refresh_token(api_client, user):
    _, refresh = _login_tokens(api_client, user)

    response = api_client.post(REFRESH_URL, {"refresh": refresh}, format="json")

    assert response.status_code == 200
    body = response.json()
    assert "refresh" in body["data"]
    assert body["data"]["refresh"] != refresh


@pytest.mark.django_db
def test_logout_blacklists_refresh_token(api_client, user):
    access, refresh = _login_tokens(api_client, user)
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")

    logout_response = api_client.post(LOGOUT_URL, {"refresh": refresh}, format="json")
    assert logout_response.status_code == 200
    assert logout_response.json()["success"] is True

    refresh_response = api_client.post(REFRESH_URL, {"refresh": refresh}, format="json")
    assert refresh_response.status_code == 401
    assert refresh_response.json()["success"] is False


@pytest.mark.django_db
def test_blacklisted_refresh_after_rotation_returns_401(api_client, user):
    _, refresh = _login_tokens(api_client, user)

    first_refresh = api_client.post(REFRESH_URL, {"refresh": refresh}, format="json")
    assert first_refresh.status_code == 200

    old_refresh_response = api_client.post(REFRESH_URL, {"refresh": refresh}, format="json")
    assert old_refresh_response.status_code == 401
    assert old_refresh_response.json()["success"] is False
