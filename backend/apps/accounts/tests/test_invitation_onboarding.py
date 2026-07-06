from datetime import timedelta

import pytest
from django.utils import timezone

from apps.accounts.models import User, UserInvitation, UserPreference, UserProfile
from apps.organizations.models import OrganizationMember
from apps.projects.models import ProjectMember, ProjectRole

from apps.projects.tests.conftest import (  # noqa: F401
    celery_always_eager,
    organization,
    project,
    superuser,
)

VALID_PASSWORD = "StrongPassword123"
REGISTER_URL = "/api/auth/register"


@pytest.fixture
def project_invitation(db, project, superuser):
    return UserInvitation.objects.create(
        email="onboard@example.com",
        token="project-invite-token",
        expires_at=timezone.now() + timedelta(days=7),
        invited_by=superuser,
        metadata={
            "organization_id": str(project.organization_id),
            "organization_role": "member",
            "project_id": str(project.id),
            "project_role": ProjectRole.DEVELOPER,
            "invited_for": "project",
        },
    )


@pytest.mark.django_db
def test_register_with_project_invitation_auto_onboards(api_client, project_invitation, project):
    response = api_client.post(
        REGISTER_URL,
        {
            "invite_token": project_invitation.token,
            "name": "Onboard User",
            "password": VALID_PASSWORD,
        },
        format="json",
    )

    assert response.status_code == 201
    user = User.objects.get(email=project_invitation.email)

    assert OrganizationMember.objects.filter(
        organization_id=project.organization_id,
        user_id=user.id,
        is_active=True,
    ).exists()
    assert ProjectMember.objects.filter(
        project_id=project.id,
        user_id=user.id,
        role=ProjectRole.DEVELOPER,
    ).exists()

    project_invitation.refresh_from_db()
    assert project_invitation.used_at is not None


@pytest.mark.django_db
def test_register_plain_invitation_still_works(api_client, invitation):
    response = api_client.post(
        REGISTER_URL,
        {
            "invite_token": invitation.token,
            "name": "Plain User",
            "password": VALID_PASSWORD,
        },
        format="json",
    )

    assert response.status_code == 201
    assert User.objects.filter(email=invitation.email).exists()
    assert UserProfile.objects.filter(user__email=invitation.email).exists()
    assert UserPreference.objects.filter(user__email=invitation.email).exists()

    invitation.refresh_from_db()
    assert invitation.used_at is not None
