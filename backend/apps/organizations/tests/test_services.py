import pytest

from apps.organizations.exceptions import (
    OrganizationMembershipError,
    OrganizationNotFoundError,
    OrganizationSlugConflictError,
)
from apps.organizations.models import OrganizationMember, OrganizationRole
from apps.organizations.selectors import (
    select_organization_by_id,
    select_organization_by_slug,
    select_organizations_for_user,
)
from apps.organizations.services import create_organization, update_organization
from apps.organizations.services.membership_service import (
    add_organization_member,
    remove_organization_member,
)


@pytest.mark.django_db
def test_create_organization_service_adds_owner_membership(superuser):
    organization = create_organization(
        name="Service Org",
        slug="service-org",
        owner_user_id=superuser.id,
        creator=superuser,
    )

    membership = OrganizationMember.objects.get(
        organization_id=organization.id,
        user_id=superuser.id,
    )
    assert membership.role == OrganizationRole.OWNER
    assert membership.can_create_projects is True
    assert organization.owner_id == superuser.id


@pytest.mark.django_db
def test_create_organization_duplicate_slug_raises(superuser, organization):
    with pytest.raises(OrganizationSlugConflictError):
        create_organization(
            name="Another Org",
            slug=organization.slug,
            owner_user_id=superuser.id,
            creator=superuser,
        )


@pytest.mark.django_db
def test_update_organization_partial_fields(superuser, organization):
    updated = update_organization(
        organization_id=organization.id,
        actor=superuser,
        name="Updated Name",
    )

    assert updated.name == "Updated Name"
    assert updated.slug == organization.slug


@pytest.mark.django_db
def test_add_member_duplicate_raises(superuser, organization, other_user):
    add_organization_member(
        organization_id=organization.id,
        user_id=other_user.id,
        added_by=superuser,
    )

    with pytest.raises(OrganizationMembershipError):
        add_organization_member(
            organization_id=organization.id,
            user_id=other_user.id,
            added_by=superuser,
        )


@pytest.mark.django_db
def test_remove_member_deactivates(superuser, organization, other_user):
    add_organization_member(
        organization_id=organization.id,
        user_id=other_user.id,
        added_by=superuser,
    )

    remove_organization_member(
        organization_id=organization.id,
        user_id=other_user.id,
    )

    member = OrganizationMember.objects.get(
        organization_id=organization.id,
        user_id=other_user.id,
    )
    assert member.is_active is False


@pytest.mark.django_db
def test_remove_owner_raises(superuser, organization):
    with pytest.raises(OrganizationMembershipError):
        remove_organization_member(
            organization_id=organization.id,
            user_id=superuser.id,
        )


@pytest.mark.django_db
def test_select_organization_by_id(superuser, organization):
    result = select_organization_by_id(organization.id)

    assert result is not None
    assert result.id == organization.id
    assert result.slug == organization.slug


@pytest.mark.django_db
def test_select_organization_by_slug(superuser, organization):
    result = select_organization_by_slug(organization.slug)

    assert result is not None
    assert result.id == organization.id


@pytest.mark.django_db
def test_select_organizations_for_user(superuser, organization, other_user):
    add_organization_member(
        organization_id=organization.id,
        user_id=other_user.id,
        added_by=superuser,
    )

    owner_orgs = select_organizations_for_user(superuser.id)
    member_orgs = select_organizations_for_user(other_user.id)

    assert len(owner_orgs) == 1
    assert owner_orgs[0].role == OrganizationRole.OWNER
    assert len(member_orgs) == 1
    assert member_orgs[0].role == OrganizationRole.MEMBER


@pytest.mark.django_db
def test_select_organization_by_id_not_found():
    import uuid

    assert select_organization_by_id(uuid.uuid4()) is None


@pytest.mark.django_db
def test_add_member_missing_organization_raises(superuser, other_user):
    import uuid

    with pytest.raises(OrganizationNotFoundError):
        add_organization_member(
            organization_id=uuid.uuid4(),
            user_id=other_user.id,
            added_by=superuser,
        )
