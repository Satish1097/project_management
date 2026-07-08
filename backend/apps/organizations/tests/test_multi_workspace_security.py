import pytest
from django.db import IntegrityError
from apps.organizations.models import Organization, OrganizationMember, OrganizationRole
from apps.organizations.services import create_organization
from apps.organizations.services.membership_service import add_organization_member, remove_organization_member

ORGANIZATIONS_URL = "/api/organizations"


@pytest.mark.django_db
def test_user_cannot_access_unjoined_workspace(api_client, user, other_user, authenticate):
    # Create workspace owned by other_user
    org = create_organization(
        name="Other's Workspace",
        slug="others-ws",
        owner_user_id=other_user.id,
        creator=other_user,
    )

    # Log in as user
    client = authenticate(user)

    # Attempt to access the detail page of other's organization
    response = client.get(f"{ORGANIZATIONS_URL}/{org.id}")
    assert response.status_code == 403
    assert response.json()["success"] is False


@pytest.mark.django_db
def test_duplicate_membership_is_blocked(superuser, user):
    org = create_organization(
        name="HK Org",
        slug="hk-org",
        owner_user_id=superuser.id,
        creator=superuser,
    )

    # First membership addition
    add_organization_member(
        organization_id=org.id,
        user_id=user.id,
        added_by=superuser,
        role=OrganizationRole.MEMBER,
    )

    # Second membership addition (duplicate) should fail (unique constraint)
    with pytest.raises(IntegrityError):
        OrganizationMember.objects.create(
            organization_id=org.id,
            user_id=user.id,
            role=OrganizationRole.MEMBER,
        )


@pytest.mark.django_db
def test_revoke_membership_immediately_removes_workspace_access(
    api_client,
    superuser,
    user,
    authenticate,
):
    org = create_organization(
        name="Shared Workspace",
        slug="shared-ws",
        owner_user_id=superuser.id,
        creator=superuser,
    )

    # Add user as member
    add_organization_member(
        organization_id=org.id,
        user_id=user.id,
        added_by=superuser,
        role=OrganizationRole.MEMBER,
    )

    # Verify user can view the organization
    client = authenticate(user)
    response = client.get(f"{ORGANIZATIONS_URL}/{org.id}")
    assert response.status_code == 200

    # Revoke user membership
    remove_organization_member(organization_id=org.id, user_id=user.id)

    # Verify user can no longer view organization (now returns 403)
    response = client.get(f"{ORGANIZATIONS_URL}/{org.id}")
    assert response.status_code == 403


@pytest.mark.django_db
def test_workspace_creation_assigns_exactly_one_owner_membership(superuser):
    org = create_organization(
        name="Owner Workspace",
        slug="owner-ws",
        owner_user_id=superuser.id,
        creator=superuser,
    )

    # Verify there is exactly one owner membership for this workspace
    memberships = OrganizationMember.objects.filter(organization_id=org.id)
    assert memberships.count() == 1
    membership = memberships.first()
    assert membership.user == superuser
    assert membership.role == OrganizationRole.OWNER
