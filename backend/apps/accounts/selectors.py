"""
Read-only user lookups and projections for apps.accounts.

Selectors must not mutate data or contain business logic.
"""
from uuid import UUID

from apps.accounts.models import User, UserProfile
from apps.contracts.identity_contract import UserDTO


def _user_to_dto(user: User) -> UserDTO:
    display_name = user.email
    avatar = None
    timezone = None

    try:
        profile = user.profile
    except UserProfile.DoesNotExist:
        profile = None

    if profile is not None:
        display_name = f"{profile.first_name} {profile.last_name}".strip() or user.email
        avatar = profile.avatar
        timezone = profile.timezone

    return UserDTO(
        id=user.id,
        email=user.email,
        display_name=display_name,
        avatar=avatar,
        timezone=timezone,
        is_superuser=user.is_superuser,
    )


def select_user_by_email(email: str) -> User | None:
    try:
        return User.objects.get(email=email)
    except User.DoesNotExist:
        return None


def select_user_by_id(user_id: UUID) -> UserDTO | None:
    try:
        user = User.objects.select_related("profile").get(pk=user_id)
    except User.DoesNotExist:
        return None
    return _user_to_dto(user)


def select_users_by_ids(user_ids: list[UUID]) -> list[UserDTO]:
    if not user_ids:
        return []
    users = User.objects.select_related("profile").filter(pk__in=user_ids)
    return [_user_to_dto(user) for user in users]


def select_me(user: User) -> UserDTO:
    user_with_profile = User.objects.select_related("profile").get(pk=user.pk)
    return _user_to_dto(user_with_profile)
