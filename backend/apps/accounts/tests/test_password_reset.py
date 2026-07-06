from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode

import pytest

VALID_PASSWORD = "StrongPassword123"
NEW_PASSWORD = "NewStrongPassword456"
FORGOT_URL = "/api/auth/password/forgot"
RESET_URL = "/api/auth/password/reset"


@pytest.mark.django_db
def test_forgot_password_always_returns_200(api_client):
    response = api_client.post(
        FORGOT_URL,
        {"email": "nobody@example.com"},
        format="json",
    )

    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert "message" in body


@pytest.mark.django_db
def test_forgot_password_existing_user_invokes_task(api_client, user, mock_password_reset_task):
    response = api_client.post(FORGOT_URL, {"email": user.email}, format="json")

    assert response.status_code == 200
    assert response.json()["success"] is True
    mock_password_reset_task.assert_called_once()
    assert mock_password_reset_task.call_args[0][0] == user.email


@pytest.mark.django_db
def test_forgot_password_nonexistent_user_same_response(api_client, mock_password_reset_task):
    response = api_client.post(
        FORGOT_URL,
        {"email": "missing@example.com"},
        format="json",
    )

    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert "If an account exists" in body["message"]
    mock_password_reset_task.assert_not_called()


@pytest.mark.django_db
def test_reset_password_valid_token_changes_password(api_client, user):
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = PasswordResetTokenGenerator().make_token(user)

    response = api_client.post(
        RESET_URL,
        {"uid": uid, "token": token, "password": NEW_PASSWORD},
        format="json",
    )

    assert response.status_code == 200
    assert response.json()["success"] is True

    user.refresh_from_db()
    assert user.check_password(NEW_PASSWORD)
    assert not user.check_password(VALID_PASSWORD)


@pytest.mark.django_db
def test_reset_password_invalid_token_returns_400(api_client, user):
    uid = urlsafe_base64_encode(force_bytes(user.pk))

    response = api_client.post(
        RESET_URL,
        {"uid": uid, "token": "invalid-token", "password": NEW_PASSWORD},
        format="json",
    )

    assert response.status_code == 400
    assert response.json()["success"] is False

    user.refresh_from_db()
    assert user.check_password(VALID_PASSWORD)


@pytest.mark.django_db
def test_reset_password_weak_password_rejected(api_client, user):
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = PasswordResetTokenGenerator().make_token(user)

    response = api_client.post(
        RESET_URL,
        {"uid": uid, "token": token, "password": "weak"},
        format="json",
    )

    assert response.status_code == 400
    assert response.json()["success"] is False
