from datetime import timedelta
from unittest.mock import patch

import pytest
from django.utils import timezone

from apps.accounts.models import UserInvitation
from apps.organizations.models import OrganizationMember
from apps.projects.models import ProjectMember, ProjectRole


@pytest.mark.django_db
@patch("apps.accounts.services.invitation_onboarding_service.send_project_added_notification_email.delay")
def test_invite_existing_user_adds_memberships(mock_notify, superuser_client, project, other_user):
    response = superuser_client.post(
        f"/api/projects/{project.id}/invite",
        {"email": other_user.email, "role": ProjectRole.DEVELOPER},
        format="json",
    )

    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert body["data"]["status"] == "added_existing_user"

    assert OrganizationMember.objects.filter(
        organization_id=project.organization_id,
        user_id=other_user.id,
        is_active=True,
    ).exists()
    assert ProjectMember.objects.filter(
        project_id=project.id,
        user_id=other_user.id,
        role=ProjectRole.DEVELOPER,
    ).exists()
    mock_notify.assert_called_once()


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
def test_invite_new_user_succeeds_when_email_task_fails(mock_invite_email, superuser_client, project):
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
@patch("apps.accounts.services.invitation_onboarding_service.send_project_added_notification_email.delay")
def test_invite_existing_user_succeeds_when_email_task_fails(
    mock_notify, superuser_client, project, other_user
):
    mock_notify.side_effect = ConnectionError("broker unavailable")

    response = superuser_client.post(
        f"/api/projects/{project.id}/invite",
        {"email": other_user.email, "role": ProjectRole.DEVELOPER},
        format="json",
    )

    assert response.status_code == 200
    assert response.json()["data"]["status"] == "added_existing_user"
    assert ProjectMember.objects.filter(
        project_id=project.id,
        user_id=other_user.id,
    ).exists()


@pytest.mark.django_db
def test_invite_invalid_role_returns_400(superuser_client, project):
    response = superuser_client.post(
        f"/api/projects/{project.id}/invite",
        {"email": "badrole@example.com", "role": "admin"},
        format="json",
    )

    assert response.status_code == 400
    assert response.json()["success"] is False
