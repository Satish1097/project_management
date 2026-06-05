from datetime import timedelta

import pytest
from django.utils import timezone

from apps.accounts.models import User, UserInvitation, UserPreference, UserProfile

VALID_PASSWORD = "StrongPassword123"
REGISTER_URL = "/api/auth/register"


@pytest.mark.django_db
def test_register_success_with_valid_invitation(api_client, invitation):
    response = api_client.post(
        REGISTER_URL,
        {
            "invite_token": invitation.token,
            "name": "John Doe",
            "password": VALID_PASSWORD,
        },
        format="json",
    )

    assert response.status_code == 201
    body = response.json()
    assert body["success"] is True
    assert "data" in body
    assert body["data"]["user"]["email"] == invitation.email
    assert body["data"]["user"]["display_name"] == "John Doe"
    assert "access" in body["data"]["tokens"]
    assert "refresh" in body["data"]["tokens"]

    user = User.objects.get(email=invitation.email)
    assert UserProfile.objects.filter(user=user).exists()
    assert UserPreference.objects.filter(user=user).exists()

    invitation.refresh_from_db()
    assert invitation.used_at is not None


@pytest.mark.django_db
def test_register_invalid_invite_returns_400(api_client):
    response = api_client.post(
        REGISTER_URL,
        {
            "invite_token": "nonexistent-token",
            "name": "John Doe",
            "password": VALID_PASSWORD,
        },
        format="json",
    )

    assert response.status_code == 400
    body = response.json()
    assert body["success"] is False
    assert "errors" in body


@pytest.mark.django_db
def test_register_expired_invite_returns_400(api_client, invitation):
    invitation.expires_at = timezone.now() - timedelta(minutes=1)
    invitation.save(update_fields=["expires_at"])

    response = api_client.post(
        REGISTER_URL,
        {
            "invite_token": invitation.token,
            "name": "John Doe",
            "password": VALID_PASSWORD,
        },
        format="json",
    )

    assert response.status_code == 400
    assert response.json()["success"] is False


@pytest.mark.django_db
def test_register_already_used_invite_returns_400(api_client, invitation):
    invitation.used_at = timezone.now()
    invitation.save(update_fields=["used_at"])

    response = api_client.post(
        REGISTER_URL,
        {
            "invite_token": invitation.token,
            "name": "John Doe",
            "password": VALID_PASSWORD,
        },
        format="json",
    )

    assert response.status_code == 400
    assert response.json()["success"] is False


@pytest.mark.django_db
def test_register_account_exists_returns_409(api_client, invitation, user):
    invitation.email = user.email
    invitation.save(update_fields=["email"])

    response = api_client.post(
        REGISTER_URL,
        {
            "invite_token": invitation.token,
            "name": "John Doe",
            "password": VALID_PASSWORD,
        },
        format="json",
    )

    assert response.status_code == 409
    assert response.json()["success"] is False


@pytest.mark.django_db
def test_register_weak_password_rejected(api_client, invitation):
    response = api_client.post(
        REGISTER_URL,
        {
            "invite_token": invitation.token,
            "name": "John Doe",
            "password": "short",
        },
        format="json",
    )

    assert response.status_code == 400
    body = response.json()
    assert body["success"] is False
    assert "errors" in body
    assert not User.objects.filter(email=invitation.email).exists()


@pytest.mark.django_db
def test_register_creates_user_profile_and_preference(api_client, invitation):
    assert User.objects.count() == 0
    assert UserProfile.objects.count() == 0
    assert UserPreference.objects.count() == 0

    api_client.post(
        REGISTER_URL,
        {
            "invite_token": invitation.token,
            "name": "Jane Smith",
            "password": VALID_PASSWORD,
        },
        format="json",
    )

    assert User.objects.count() == 1
    assert UserProfile.objects.count() == 1
    assert UserPreference.objects.count() == 1

    user = User.objects.get(email=invitation.email)
    profile = UserProfile.objects.get(user=user)
    assert profile.first_name == "Jane"
    assert profile.last_name == "Smith"

    invitation.refresh_from_db()
    assert invitation.used_at is not None
