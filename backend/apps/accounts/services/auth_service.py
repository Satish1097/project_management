from django.contrib.auth import authenticate
from django.db import transaction
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken

from apps.accounts.exceptions import (
    AccountAlreadyExistsError,
    AuthenticationError,
    InvalidRefreshTokenError,
)
from apps.accounts.models import User, UserPreference, UserProfile
from apps.accounts.selectors import select_me, select_user_by_email
from apps.accounts.services.invitation_service import consume_invitation, validate_invitation
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
    invite_token: str,
    name: str,
    password: str,
) -> dict:
    invitation = validate_invitation(invite_token)
    email = invitation.email

    if select_user_by_email(email) is not None:
        raise AccountAlreadyExistsError("An account already exists for this invitation.")

    first_name, last_name = _split_name(name)

    with transaction.atomic():
        user = User.objects.create_user(email=email, password=password)
        UserProfile.objects.create(
            user=user,
            first_name=first_name,
            last_name=last_name,
        )
        UserPreference.objects.create(user=user)
        consume_invitation(invitation)

    return {
        "user": select_me(user),
        "tokens": _issue_tokens(user),
    }


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
