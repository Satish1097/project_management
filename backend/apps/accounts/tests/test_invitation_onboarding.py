from datetime import timedelta

import pytest
from django.utils import timezone

from apps.accounts.models import User, UserInvitation, UserPreference, UserProfile
from apps.organizations.models import OrganizationMember, OrganizationRole
from apps.projects.models import ProjectMember, ProjectRole

pytest_plugins = ["apps.projects.tests.conftest"]

VALID_PASSWORD = "StrongPassword123"
REGISTER_URL = "/api/auth/register"
ACCEPT_INVITATION_URL = "/api/auth/invitations/accept"
VALIDATE_INVITATION_URL = "/api/auth/invitations/validate"


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
def test_public_registration_without_invitation_success(api_client):
    response = api_client.post(
        REGISTER_URL,
        {
            "email": "selfserve@example.com",
            "name": "Self Serve",
            "password": VALID_PASSWORD,
        },
        format="json",
    )

    assert response.status_code == 201
    assert response.json()["success"] is True
    user = User.objects.get(email="selfserve@example.com")
    assert UserProfile.objects.filter(user=user).exists()
    assert UserPreference.objects.filter(user=user).exists()

    memberships = OrganizationMember.objects.filter(user=user)
    assert memberships.count() == 1
    membership = memberships.first()
    assert membership.role == OrganizationRole.OWNER
    assert membership.organization.name == "Self Serve's Workspace"


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
def test_validate_invitation_returns_invited_email(api_client, project_invitation):
    response = api_client.get(
        VALIDATE_INVITATION_URL,
        {"invite_token": project_invitation.token},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["data"]["invitation"]["email"] == project_invitation.email
    assert body["data"]["invitation"]["account_exists"] is False


@pytest.mark.django_db
def test_existing_user_accepts_project_invitation(
    authenticate,
    project_invitation,
    project,
    other_user,
):
    project_invitation.email = other_user.email
    project_invitation.save(update_fields=["email"])
    client = authenticate(other_user)

    response = client.post(
        ACCEPT_INVITATION_URL,
        {"invite_token": project_invitation.token},
        format="json",
    )

    assert response.status_code == 200
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

    project_invitation.refresh_from_db()
    assert project_invitation.used_at is not None


@pytest.mark.django_db
def test_existing_user_accepting_invitation_reactivates_workspace_membership(
    authenticate,
    project_invitation,
    project,
    other_user,
):
    project_invitation.email = other_user.email
    project_invitation.save(update_fields=["email"])
    OrganizationMember.objects.create(
        organization_id=project.organization_id,
        user_id=other_user.id,
        role=OrganizationRole.MEMBER,
        is_active=False,
    )
    client = authenticate(other_user)

    response = client.post(
        ACCEPT_INVITATION_URL,
        {"invite_token": project_invitation.token},
        format="json",
    )

    assert response.status_code == 200
    assert (
        OrganizationMember.objects.filter(
            organization_id=project.organization_id,
            user_id=other_user.id,
        ).count()
        == 1
    )
    membership = OrganizationMember.objects.get(
        organization_id=project.organization_id,
        user_id=other_user.id,
    )
    assert membership.is_active is True
    assert ProjectMember.objects.filter(
        project_id=project.id,
        user_id=other_user.id,
        role=ProjectRole.DEVELOPER,
    ).exists()


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


@pytest.mark.django_db
def test_invitation_cannot_be_accepted_twice(
    authenticate,
    project_invitation,
    project,
    other_user,
):
    project_invitation.email = other_user.email
    project_invitation.save(update_fields=["email"])
    client = authenticate(other_user)

    # First acceptance
    response = client.post(
        ACCEPT_INVITATION_URL,
        {"invite_token": project_invitation.token},
        format="json",
    )
    assert response.status_code == 200

    # Second acceptance should fail
    response_second = client.post(
        ACCEPT_INVITATION_URL,
        {"invite_token": project_invitation.token},
        format="json",
    )
    assert response_second.status_code == 400
    assert response_second.json()["success"] is False


@pytest.mark.django_db
def test_joined_workspace_appears_in_workspace_list_and_context_after_acceptance(
    authenticate,
    project_invitation,
    project,
    other_user,
):
    project_invitation.email = other_user.email
    project_invitation.save(update_fields=["email"])
    client = authenticate(other_user)

    # Before acceptance, they shouldn't see it in organizations
    from apps.organizations.selectors import select_organizations_for_user
    orgs_before = select_organizations_for_user(other_user.id)
    assert not any(o.id == project.organization_id for o in orgs_before)

    # Accept the invitation
    response = client.post(
        ACCEPT_INVITATION_URL,
        {"invite_token": project_invitation.token},
        format="json",
    )
    assert response.status_code == 200

    # After acceptance, they should see it
    orgs_after = select_organizations_for_user(other_user.id)
    assert any(o.id == project.organization_id for o in orgs_after)

    # Verify membership created exactly once
    memberships_count = OrganizationMember.objects.filter(
        organization_id=project.organization_id,
        user_id=other_user.id,
    ).count()
    assert memberships_count == 1

    # Verify context API (/api/me/context) returns the organization
    context_response = client.get("/api/me/context")
    assert context_response.status_code == 200
    context_data = context_response.json()["data"]
    org_ids_in_context = [org["id"] for org in context_data["organizations"]]
    assert str(project.organization_id) in org_ids_in_context


@pytest.mark.django_db
def test_users_cannot_access_workspaces_they_are_not_members_of(
    authenticate,
    project_invitation,
    project,
    other_user,
):
    # other_user has not accepted the invitation yet, they should not have access
    client = authenticate(other_user)
    
    # Try fetching organization details
    response = client.get(f"/api/organizations/{project.organization_id}")
    assert response.status_code == 403
