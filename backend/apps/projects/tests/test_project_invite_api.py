from unittest.mock import patch

import pytest
from django.core import mail

from apps.accounts.models import UserInvitation
from apps.accounts.tasks import send_project_invite_email
from apps.projects.models import ProjectRole


@pytest.mark.django_db
@patch("apps.accounts.services.invitation_onboarding_service.send_project_invite_email.delay")
def test_invite_existing_user_creates_invitation(
    mock_invite_email, superuser_client, project, other_user
):
    response = superuser_client.post(
        f"/api/projects/{project.id}/invite",
        {"email": other_user.email, "role": ProjectRole.DEVELOPER},
        format="json",
    )

    assert response.status_code == 201
    body = response.json()
    assert body["success"] is True
    assert body["data"]["status"] == "invite_sent"

    invitation = UserInvitation.objects.get(email=other_user.email)
    assert invitation.used_at is None
    assert invitation.metadata["project_id"] == str(project.id)
    assert invitation.metadata["project_role"] == ProjectRole.DEVELOPER
    mock_invite_email.assert_called_once()


@pytest.mark.django_db
@patch("apps.accounts.services.invitation_onboarding_service.send_project_invite_email.delay")
def test_invite_new_user_creates_invitation(mock_invite_email, superuser_client, project):
    response = superuser_client.post(
        f"/api/projects/{project.id}/invite",
        {"email": "newuser@example.com", "role": ProjectRole.QA},
        format="json",
    )

    assert response.status_code == 201
    body = response.json()
    assert body["data"]["status"] == "invite_sent"

    invitation = UserInvitation.objects.get(email="newuser@example.com")
    assert invitation.used_at is None
    assert invitation.metadata["project_id"] == str(project.id)
    assert invitation.metadata["organization_id"] == str(project.organization_id)
    assert invitation.metadata["project_role"] == ProjectRole.QA
    assert invitation.metadata["invited_for"] == "project"
    mock_invite_email.assert_called_once()


@pytest.mark.django_db
@patch("apps.accounts.services.invitation_onboarding_service.send_project_invite_email.delay")
def test_invite_duplicate_pending_invitation_returns_409(
    mock_invite_email, superuser_client, project
):
    payload = {"email": "pending@example.com", "role": ProjectRole.QA}
    first_response = superuser_client.post(
        f"/api/projects/{project.id}/invite",
        payload,
        format="json",
    )

    second_response = superuser_client.post(
        f"/api/projects/{project.id}/invite",
        payload,
        format="json",
    )

    assert first_response.status_code == 201
    assert second_response.status_code == 409
    assert (
        UserInvitation.objects.filter(email="pending@example.com", used_at__isnull=True).count()
        == 1
    )
    mock_invite_email.assert_called_once()


@pytest.mark.django_db
def test_invite_new_user_sends_invitation_email(settings, monkeypatch, superuser_client, project):
    settings.EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"
    settings.DEFAULT_FROM_EMAIL = "noreply@example.com"
    monkeypatch.setenv("FRONTEND_URL", "http://localhost:5173")
    monkeypatch.setattr(send_project_invite_email, "delay", send_project_invite_email.run)

    response = superuser_client.post(
        f"/api/projects/{project.id}/invite",
        {"email": "emailed@example.com", "role": ProjectRole.QA},
        format="json",
    )

    assert response.status_code == 201
    invitation = UserInvitation.objects.get(email="emailed@example.com")
    assert len(mail.outbox) == 1
    message = mail.outbox[0]
    assert message.to == ["emailed@example.com"]
    assert message.subject == f"You're invited to join {project.name}"
    assert f"http://localhost:5173/signup?invite_token={invitation.token}" in message.body


@pytest.mark.django_db
def test_invite_duplicate_project_member_returns_409(superuser_client, project, other_user):
    superuser_client.post(
        f"/api/projects/{project.id}/members",
        {"user_id": str(other_user.id), "role": ProjectRole.DEVELOPER},
        format="json",
    )

    response = superuser_client.post(
        f"/api/projects/{project.id}/invite",
        {"email": other_user.email, "role": ProjectRole.DEVELOPER},
        format="json",
    )

    assert response.status_code == 409
    assert response.json()["success"] is False


@pytest.mark.django_db
def test_invite_requires_manage_members_permission(developer_client, project):
    response = developer_client.post(
        f"/api/projects/{project.id}/invite",
        {"email": "someone@example.com"},
        format="json",
    )

    assert response.status_code == 403


@pytest.mark.django_db
@patch("apps.accounts.services.invitation_onboarding_service.send_project_invite_email.delay")
def test_invite_new_user_succeeds_when_email_task_fails(
    mock_invite_email, superuser_client, project
):
    mock_invite_email.side_effect = ConnectionError("broker unavailable")

    response = superuser_client.post(
        f"/api/projects/{project.id}/invite",
        {"email": "brokerfail@example.com", "role": ProjectRole.DEVELOPER},
        format="json",
    )

    assert response.status_code == 201
    assert response.json()["data"]["status"] == "invite_sent"
    assert UserInvitation.objects.filter(email="brokerfail@example.com").exists()


@pytest.mark.django_db
@patch("apps.accounts.services.invitation_onboarding_service.send_project_invite_email.delay")
def test_invite_existing_user_succeeds_when_email_task_fails(
    mock_invite_email, superuser_client, project, other_user
):
    mock_invite_email.side_effect = ConnectionError("broker unavailable")

    response = superuser_client.post(
        f"/api/projects/{project.id}/invite",
        {"email": other_user.email, "role": ProjectRole.DEVELOPER},
        format="json",
    )

    assert response.status_code == 201
    assert response.json()["data"]["status"] == "invite_sent"
    assert UserInvitation.objects.filter(email=other_user.email, used_at__isnull=True).exists()


@pytest.mark.django_db
def test_invite_invalid_role_returns_400(superuser_client, project):
    response = superuser_client.post(
        f"/api/projects/{project.id}/invite",
        {"email": "badrole@example.com", "role": "admin"},
        format="json",
    )

    assert response.status_code == 400
    assert response.json()["success"] is False
