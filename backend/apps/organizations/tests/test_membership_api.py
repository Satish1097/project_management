import pytest

from apps.organizations.models import OrganizationMember, OrganizationRole

VALID_PASSWORD = "StrongPassword123"


@pytest.mark.django_db
def test_add_organization_member_success(superuser_client, organization, other_user):
    response = superuser_client.post(
        f"/api/organizations/{organization.id}/members",
        {"user_id": str(other_user.id), "role": OrganizationRole.MEMBER},
        format="json",
    )

    assert response.status_code == 201
    member = response.json()["data"]["member"]
    assert member["user_id"] == str(other_user.id)
    assert member["role"] == OrganizationRole.MEMBER
    assert member["is_active"] is True


@pytest.mark.django_db
def test_add_organization_member_duplicate_blocked(
    superuser_client,
    organization,
    other_user,
):
    payload = {"user_id": str(other_user.id), "role": OrganizationRole.MEMBER}
    first = superuser_client.post(
        f"/api/organizations/{organization.id}/members",
        payload,
        format="json",
    )
    assert first.status_code == 201

    second = superuser_client.post(
        f"/api/organizations/{organization.id}/members",
        payload,
        format="json",
    )

    assert second.status_code == 409
    assert second.json()["success"] is False


@pytest.mark.django_db
def test_remove_organization_member_sets_inactive(
    superuser_client,
    organization,
    other_user,
):
    superuser_client.post(
        f"/api/organizations/{organization.id}/members",
        {"user_id": str(other_user.id)},
        format="json",
    )

    response = superuser_client.delete(
        f"/api/organizations/{organization.id}/members/{other_user.id}",
    )

    assert response.status_code == 200
    member = OrganizationMember.objects.get(
        organization_id=organization.id,
        user_id=other_user.id,
    )
    assert member.is_active is False


@pytest.mark.django_db
def test_cannot_remove_organization_owner(superuser_client, organization, superuser):
    response = superuser_client.delete(
        f"/api/organizations/{organization.id}/members/{superuser.id}",
    )

    assert response.status_code == 409
    assert response.json()["success"] is False

    membership = OrganizationMember.objects.get(
        organization_id=organization.id,
        user_id=superuser.id,
    )
    assert membership.is_active is True
