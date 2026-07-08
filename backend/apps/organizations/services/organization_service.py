from uuid import UUID

from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils import timezone

from apps.contracts.organization_contract import OrganizationDTO
from apps.organizations.exceptions import (
    OrganizationMembershipError,
    OrganizationNotFoundError,
    OrganizationSlugConflictError,
)
from apps.organizations.models import Organization, OrganizationMember, OrganizationRole
from apps.organizations.selectors import select_organization_by_id

User = get_user_model()


def _normalize_slug(slug: str) -> str:
    return slug.strip().lower()


def create_organization(
    *,
    name: str,
    slug: str,
    owner_user_id: UUID,
    creator,
    branding: dict | None = None,
    settings: dict | None = None,
) -> OrganizationDTO:
    normalized_slug = _normalize_slug(slug)

    if Organization.objects.filter(slug=normalized_slug).exists():
        raise OrganizationSlugConflictError(
            f"Organization slug '{normalized_slug}' is already in use."
        )

    try:
        owner = User.objects.get(pk=owner_user_id)
    except User.DoesNotExist as exc:
        raise OrganizationMembershipError(f"User '{owner_user_id}' does not exist.") from exc

    with transaction.atomic():
        organization = Organization.objects.create(
            name=name.strip(),
            slug=normalized_slug,
            owner=owner,
            branding=branding or {},
            settings=settings or {},
            created_by=creator,
            updated_by=creator,
        )
        OrganizationMember.objects.create(
            organization=organization,
            user=owner,
            role=OrganizationRole.OWNER,
            can_create_projects=True,
            added_by=creator,
            created_by=creator,
            updated_by=creator,
        )

    dto = select_organization_by_id(organization.id)
    assert dto is not None
    return dto


def update_organization(
    *,
    organization_id: UUID,
    actor,
    name: str | None = None,
    branding: dict | None = None,
    settings: dict | None = None,
    is_active: bool | None = None,
) -> OrganizationDTO:
    try:
        organization = Organization.objects.get(pk=organization_id)
    except Organization.DoesNotExist as exc:
        raise OrganizationNotFoundError(
            f"Organization '{organization_id}' does not exist."
        ) from exc

    update_fields = ["updated_by", "updated_at"]

    if name is not None:
        organization.name = name.strip()
        update_fields.append("name")
    if branding is not None:
        organization.branding = branding
        update_fields.append("branding")
    if settings is not None:
        organization.settings = settings
        update_fields.append("settings")
    if is_active is not None:
        organization.is_active = is_active
        update_fields.append("is_active")

    organization.updated_by = actor
    organization.save(update_fields=update_fields)

    dto = select_organization_by_id(organization.id)
    assert dto is not None
    return dto
