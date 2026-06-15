import pytest

VALID_PASSWORD = "StrongPassword123"
ME_URL = "/api/me"


@pytest.mark.django_db
def test_me_get_unauthenticated_returns_401(api_client):
    response = api_client.get(ME_URL)

    assert response.status_code == 401
    body = response.json()
    assert body["success"] is False


@pytest.mark.django_db
def test_me_get_authenticated_returns_correct_dto(authenticated_client, user):
    response = authenticated_client.get(ME_URL)

    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    data = body["data"]
    assert set(data.keys()) == {"id", "email", "display_name", "avatar", "timezone"}
    assert data["email"] == user.email
    assert data["display_name"] == "Existing User"
    assert data["id"] == str(user.id)


@pytest.mark.django_db
def test_me_patch_authenticated_updates_allowed_fields(authenticated_client, user):
    response = authenticated_client.patch(
        ME_URL,
        {"first_name": "Updated", "timezone": "America/New_York"},
        format="json",
    )

    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert body["data"]["display_name"] == "Updated User"
    assert body["data"]["timezone"] == "America/New_York"

    user.profile.refresh_from_db()
    assert user.profile.first_name == "Updated"
    assert user.profile.timezone == "America/New_York"


@pytest.mark.django_db
def test_me_patch_unauthenticated_returns_401(api_client):
    response = api_client.patch(
        ME_URL,
        {"first_name": "Hacker"},
        format="json",
    )

    assert response.status_code == 401
    assert response.json()["success"] is False
