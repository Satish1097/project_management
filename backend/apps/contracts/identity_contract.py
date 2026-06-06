"""
Identity module contract — DTOs and narrow read interfaces.

Cross-module boundary for identity access. Other modules must depend on this
contract, not apps.accounts.models.

Implementation deferred — wired in a later slice.
"""
from dataclasses import dataclass
from uuid import UUID


@dataclass(frozen=True)
class UserDTO:
    id: UUID
    email: str
    display_name: str
    avatar: str | None
    timezone: str | None
    is_superuser: bool = False


def get_user_by_id(user_id: UUID) -> UserDTO | None:
    from apps.accounts.selectors import select_user_by_id

    return select_user_by_id(user_id)


def get_users_by_ids(user_ids: list[UUID]) -> list[UserDTO]:
    from apps.accounts.selectors import select_users_by_ids

    return select_users_by_ids(user_ids)
