from apps.accounts.exceptions import InvalidProfileFieldError
from apps.accounts.models import User, UserProfile
from apps.accounts.selectors import select_me
from apps.contracts.identity_contract import UserDTO

_ALLOWED_PROFILE_FIELDS = frozenset({"first_name", "last_name", "avatar", "timezone"})


def update_profile(user: User, **fields) -> UserDTO:
    if "email" in fields:
        raise InvalidProfileFieldError("Email cannot be updated.")

    invalid_fields = set(fields) - _ALLOWED_PROFILE_FIELDS
    if invalid_fields:
        raise InvalidProfileFieldError(
            f"Invalid profile fields: {', '.join(sorted(invalid_fields))}."
        )

    if not fields:
        return select_me(user)

    profile, _ = UserProfile.objects.get_or_create(
        user=user,
        defaults={"first_name": "", "last_name": ""},
    )

    for field_name, value in fields.items():
        setattr(profile, field_name, value)

    profile.save(update_fields=list(fields.keys()))
    return select_me(user)
