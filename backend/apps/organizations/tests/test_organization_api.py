import pytest

from apps.organizations.models import OrganizationMember, OrganizationRole

ORGANIZATIONS_URL = "/api/organizations"


@pytest.mark.django_db
def test_create_organization_superuser_success(superuser_client, superuser):
    response = superuser_client.post(
        ORGANIZATIONS_URL,
        {"name": "HKPMS", "slug": "hkpms", "owner_user_id": str(superuser.id)},
        format="json",
    )

    assert response.status_code == 201
    body = response.json()
    assert body["success"] is True
    org = body["data"]["organization"]
    assert org["name"] == "HKPMS"
    assert org["slug"] == "hkpms"
    assert org["owner_id"] == str(superuser.id)

    membership = OrganizationMember.objects.get(
        organization_id=org["id"],
        user_id=superuser.id,
    )
    assert membership.role == OrganizationRole.OWNER
    assert membership.is_active is True
    assert membership.can_create_projects is True


@pytest.mark.django_db
def test_create_workspace_authenticated_user_success(user_client, user):
    response = user_client.post(
        ORGANIZATIONS_URL,
        {"name": "Self Serve Org", "slug": "self-serve-org", "owner_user_id": str(user.id)},
        format="json",
    )

    assert response.status_code == 201
    org = response.json()["data"]["organization"]
    assert org["owner_id"] == str(user.id)

    membership = OrganizationMember.objects.get(
        organization_id=org["id"],
        user_id=user.id,
    )
    assert membership.role == OrganizationRole.OWNER
    assert membership.is_active is True


@pytest.mark.django_db
def test_create_workspace_creator_becomes_owner(user_client, user, other_user):
    response = user_client.post(
        ORGANIZATIONS_URL,
        {
            "name": "Creator Owned Org",
            "slug": "creator-owned-org",
            "owner_user_id": str(other_user.id),
        },
        format="json",
    )

    assert response.status_code == 201
    org = response.json()["data"]["organization"]
    assert org["owner_id"] == str(user.id)

    assert OrganizationMember.objects.filter(
        organization_id=org["id"],
        user_id=user.id,
        role=OrganizationRole.OWNER,
    ).exists()
    assert not OrganizationMember.objects.filter(
        organization_id=org["id"],
        user_id=other_user.id,
    ).exists()


@pytest.mark.django_db
def test_create_organization_duplicate_slug_returns_409(superuser_client, superuser):
    payload = {
        "name": "First Org",
        "slug": "duplicate-slug",
        "owner_user_id": str(superuser.id),
    }
    first = superuser_client.post(ORGANIZATIONS_URL, payload, format="json")
    assert first.status_code == 201

    second = superuser_client.post(ORGANIZATIONS_URL, payload, format="json")

    assert second.status_code == 409
    assert second.json()["success"] is False


@pytest.mark.django_db
def test_update_organization_owner_success(superuser_client, organization):
    response = superuser_client.patch(
        f"{ORGANIZATIONS_URL}/{organization.id}",
        {"name": "Renamed Organization"},
        format="json",
    )

    assert response.status_code == 200
    assert response.json()["data"]["organization"]["name"] == "Renamed Organization"


@pytest.mark.django_db
def test_update_organization_admin_success(
    api_client,
    organization_with_admin,
    org_admin,
    authenticate,
):
    client = authenticate(org_admin)
    response = client.patch(
        f"{ORGANIZATIONS_URL}/{organization_with_admin.id}",
        {"name": "Admin Renamed"},
        format="json",
    )

    assert response.status_code == 200
    assert response.json()["data"]["organization"]["name"] == "Admin Renamed"


@pytest.mark.django_db
def test_update_organization_member_forbidden(
    api_client,
    organization_with_member,
    user,
    authenticate,
):
    client = authenticate(user)
    response = client.patch(
        f"{ORGANIZATIONS_URL}/{organization_with_member.id}",
        {"name": "Member Attempt"},
        format="json",
    )

    assert response.status_code == 403
    assert response.json()["success"] is False


@pytest.mark.django_db
def test_update_organization_partial_update(superuser_client, organization):
    response = superuser_client.patch(
        f"{ORGANIZATIONS_URL}/{organization.id}",
        {"branding": {"accent_color": "#336699"}},
        format="json",
    )

    assert response.status_code == 200
    org = response.json()["data"]["organization"]
    assert org["name"] == organization.name


@pytest.mark.django_db
def test_list_organizations_for_authenticated_member(
    api_client,
    organization_with_member,
    user,
    authenticate,
):
    client = authenticate(user)
    response = client.get(ORGANIZATIONS_URL)

    assert response.status_code == 200
    organizations = response.json()["data"]["organizations"]
    assert len(organizations) == 1
    assert organizations[0]["id"] == str(organization_with_member.id)
    assert organizations[0]["role"] == OrganizationRole.MEMBER
