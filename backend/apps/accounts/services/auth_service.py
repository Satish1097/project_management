from django.contrib.auth import authenticate
from django.db import transaction
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken

from apps.accounts.exceptions import (
    AccountAlreadyExistsError,
    AuthenticationError,
    InvalidInvitationError,
    InvalidRefreshTokenError,
)
from apps.accounts.models import User, UserPreference, UserProfile
from apps.accounts.selectors import select_me, select_user_by_email
from apps.accounts.services.invitation_onboarding_service import consume_invitation_memberships
from apps.accounts.services.invitation_service import validate_invitation
from config.jwt import REMEMBER_ME_REFRESH_TOKEN_LIFETIME


def _split_name(name: str) -> tuple[str, str]:
    parts = name.strip().split(None, 1)
    first_name = parts[0] if parts else ""
    last_name = parts[1] if len(parts) > 1 else ""
    return first_name, last_name


def _issue_tokens(user: User, *, remember_me: bool = False) -> dict[str, str]:
    refresh = RefreshToken.for_user(user)
    if remember_me:
        refresh.set_exp(lifetime=REMEMBER_ME_REFRESH_TOKEN_LIFETIME)
    return {
        "access": str(refresh.access_token),
        "refresh": str(refresh),
    }


def register_user(
    name: str,
    password: str,
    email: str | None = None,
    invite_token: str | None = None,
) -> dict:
    from django.utils.text import slugify
    from apps.organizations.models import Organization
    from apps.organizations.services.organization_service import create_organization

    if invite_token:
        invitation = validate_invitation(invite_token)
        account_email = invitation.email
    else:
        if not email:
            raise ValueError("Email is required when signup is not via invitation.")
        account_email = email
        invitation = None

    normalized_email = account_email.strip().lower()

    with transaction.atomic():
        if select_user_by_email(normalized_email) is not None:
            raise AccountAlreadyExistsError("An account already exists for this email/invitation.")

        first_name, last_name = _split_name(name)

        user = User.objects.create_user(email=normalized_email, password=password)
        UserProfile.objects.create(
            user=user,
            first_name=first_name,
            last_name=last_name,
        )
        UserPreference.objects.create(user=user)

        if invitation:
            consume_invitation_memberships(user=user, invitation=invitation)
        else:
            personal_slug = slugify(name.strip()) or "personal"
            base_slug = personal_slug
            counter = 1
            while Organization.objects.filter(slug=personal_slug).exists():
                personal_slug = f"{base_slug}-{counter}"
                counter += 1

            create_organization(
                name=f"{name.strip()}'s Workspace",
                slug=personal_slug,
                owner_user_id=user.id,
                creator=user,
            )

    return {
        "user": select_me(user),
        "tokens": _issue_tokens(user),
    }


def accept_invitation(
    *,
    user: User,
    invite_token: str,
) -> dict:
    invitation = validate_invitation(invite_token)
    if invitation.email.lower() != user.email.lower():
        raise AuthenticationError("Sign in with the invited email to accept this invitation.")

    with transaction.atomic():
        consume_invitation_memberships(user=user, invitation=invitation)

    return {"user": select_me(user)}


def login_user(
    email: str,
    password: str,
    remember_me: bool = False,
) -> dict:
    user = authenticate(username=email, password=password)
    if user is None:
        raise AuthenticationError("Invalid email or password.")

    return {
        "user": select_me(user),
        "tokens": _issue_tokens(user, remember_me=remember_me),
    }


def logout_user(refresh_token: str) -> None:
    try:
        token = RefreshToken(refresh_token)
        token.blacklist()
    except TokenError as exc:
        raise InvalidRefreshTokenError("Invalid refresh token.") from exc
