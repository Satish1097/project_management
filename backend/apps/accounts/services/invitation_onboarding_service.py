import logging
import os
import secrets
from datetime import timedelta
from uuid import UUID

from django.utils import timezone

from apps.accounts.exceptions import PendingInvitationExistsError
from apps.accounts.models import UserInvitation
from apps.accounts.selectors import select_user_by_email
from apps.accounts.services.invitation_service import consume_invitation
from apps.accounts.tasks import send_project_invite_email
from apps.contracts.organization_contract import get_organization_by_id
from apps.organizations.models import OrganizationMember, OrganizationRole
from apps.organizations.selectors import select_organization_member
from apps.organizations.services.membership_service import add_organization_member
from apps.permissions.services import permission_service
from apps.projects.exceptions import (
    ProjectAccessDeniedError,
    ProjectMembershipError,
    ProjectNotFoundError,
)
from apps.projects.selectors import select_project_by_id, select_project_member
from apps.projects.services.membership_service import add_project_member

logger = logging.getLogger(__name__)

INVITATION_EXPIRY_DAYS = 7
INVITED_FOR_PROJECT = "project"
DEFAULT_ORGANIZATION_ROLE = OrganizationRole.MEMBER


def _frontend_url() -> str:
    return os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip("/")


def _normalize_email(email: str) -> str:
    return email.strip().lower()


def _build_project_invite_metadata(
    *,
    organization_id: UUID,
    project_id: UUID,
    project_role: str,
    organization_role: str = DEFAULT_ORGANIZATION_ROLE,
) -> dict:
    return {
        "organization_id": str(organization_id),
        "organization_role": organization_role,
        "project_id": str(project_id),
        "project_role": project_role,
        "invited_for": INVITED_FOR_PROJECT,
    }


def _ensure_organization_membership(
    *,
    organization_id: UUID,
    user_id: UUID,
    added_by,
    role: str = DEFAULT_ORGANIZATION_ROLE,
) -> None:
    existing = select_organization_member(organization_id, user_id)
    if existing is not None:
        if not existing.is_active:
            OrganizationMember.objects.filter(
                organization_id=organization_id,
                user_id=user_id,
            ).update(
                is_active=True,
                role=role,
                added_by=added_by,
                updated_by=added_by,
                updated_at=timezone.now(),
            )
        return
    add_organization_member(
        organization_id=organization_id,
        user_id=user_id,
        added_by=added_by,
        role=role,
    )


def _has_pending_project_invitation(*, email: str, project_id: UUID) -> bool:
    return UserInvitation.objects.filter(
        email=email,
        used_at__isnull=True,
        expires_at__gt=timezone.now(),
        metadata__project_id=str(project_id),
    ).exists()


def _dispatch_invitation_email(task, *args) -> None:
    try:
        task.delay(*args)
    except Exception:
        logger.exception("Invitation email failed")


def invite_to_project(
    *,
    actor,
    project_id: UUID,
    email: str,
    project_role: str,
) -> dict:
    logger.info(
        "Project invite",
        extra={
            "project_id": str(project_id),
            "email": email,
            "role": project_role,
        },
    )

    if not permission_service.can_manage_members(actor.id, project_id):
        raise ProjectAccessDeniedError("You cannot manage members for this project.")

    project = select_project_by_id(project_id)
    if project is None:
        raise ProjectNotFoundError(f"Project '{project_id}' does not exist.")

    organization = get_organization_by_id(project.organization_id)
    if organization is None:
        raise ProjectNotFoundError(f"Organization for project '{project_id}' does not exist.")

    normalized_email = _normalize_email(email)
    existing_user = select_user_by_email(normalized_email)

    if existing_user is not None:
        existing_project_member = select_project_member(project_id, existing_user.id)
        if existing_project_member is not None:
            raise ProjectMembershipError(
                f"User '{existing_user.id}' is already a member of project '{project_id}'."
            )

    if _has_pending_project_invitation(email=normalized_email, project_id=project_id):
        raise PendingInvitationExistsError(
            "A pending invitation already exists for this user and project."
        )

    token = secrets.token_urlsafe(32)
    expires_at = timezone.now() + timedelta(days=INVITATION_EXPIRY_DAYS)
    metadata = _build_project_invite_metadata(
        organization_id=project.organization_id,
        project_id=project_id,
        project_role=project_role,
    )

    UserInvitation.objects.create(
        email=normalized_email,
        token=token,
        expires_at=expires_at,
        invited_by=actor,
        metadata=metadata,
    )

    signup_url = f"{_frontend_url()}/signup?invite_token={token}"
    _dispatch_invitation_email(
        send_project_invite_email,
        normalized_email,
        signup_url,
        project.name,
        organization.name,
    )
    return {"status": "invite_sent"}


def consume_invitation_memberships(*, user, invitation: UserInvitation) -> None:
    metadata = invitation.metadata or {}

    organization_id_raw = metadata.get("organization_id")
    project_id_raw = metadata.get("project_id")

    if organization_id_raw:
        organization_id = UUID(str(organization_id_raw))
        organization_role = metadata.get("organization_role", DEFAULT_ORGANIZATION_ROLE)
        _ensure_organization_membership(
            organization_id=organization_id,
            user_id=user.id,
            added_by=invitation.invited_by,
            role=organization_role,
        )

    if project_id_raw:
        project_id = UUID(str(project_id_raw))
        project_role = metadata.get("project_role", "developer")
        existing = select_project_member(project_id, user.id)
        if existing is None:
            add_project_member(
                project_id=project_id,
                user_id=user.id,
                added_by=invitation.invited_by,
                role=project_role,
            )

    consume_invitation(invitation)
