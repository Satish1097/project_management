from django.utils import timezone

from apps.accounts.exceptions import (
    ExpiredInvitationError,
    InvalidInvitationError,
    InvitationAlreadyUsedError,
)
from apps.accounts.models import UserInvitation


def validate_invitation(invite_token: str) -> UserInvitation:
    if not invite_token:
        raise InvalidInvitationError("Invalid invitation token.")

    try:
        invitation = UserInvitation.objects.get(token=invite_token)
    except UserInvitation.DoesNotExist as exc:
        raise InvalidInvitationError("Invalid invitation token.") from exc

    if invitation.used_at is not None:
        raise InvitationAlreadyUsedError("Invitation has already been used.")

    if timezone.now() >= invitation.expires_at:
        raise ExpiredInvitationError("Invitation has expired.")

    return invitation


def consume_invitation(invitation: UserInvitation) -> UserInvitation:
    invitation.used_at = timezone.now()
    invitation.save(update_fields=["used_at"])
    return invitation
