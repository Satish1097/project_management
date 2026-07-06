from datetime import timedelta
from unittest.mock import patch

import pytest
from django.utils import timezone
from rest_framework.test import APIClient

from apps.accounts.models import User, UserInvitation, UserPreference, UserProfile

VALID_PASSWORD = "StrongPassword123"


@pytest.fixture(autouse=True)
def celery_always_eager(settings):
    settings.CELERY_TASK_ALWAYS_EAGER = True


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def user(db):
    user = User.objects.create_user(email="existing@example.com", password=VALID_PASSWORD)
    UserProfile.objects.create(user=user, first_name="Existing", last_name="User")
    UserPreference.objects.create(user=user)
    return user


@pytest.fixture
def invitation(db):
    return UserInvitation.objects.create(
        email="invite@example.com",
        token="valid-invite-token",
        expires_at=timezone.now() + timedelta(days=7),
    )


@pytest.fixture
def authenticated_client(api_client, user):
    response = api_client.post(
        "/api/auth/login",
        {"email": user.email, "password": VALID_PASSWORD},
        format="json",
    )
    access = response.json()["data"]["tokens"]["access"]
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")
    return api_client


@pytest.fixture
def mock_password_reset_task():
    with patch("apps.accounts.services.password_service.send_password_reset_email.delay") as mock_delay:
        yield mock_delay
