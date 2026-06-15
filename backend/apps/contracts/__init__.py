"""
Cross-module contract boundary.

Modules communicate through contract stubs — never import another module's
models or services directly. See ARCHITECTURE_RULES.md.
"""

from apps.contracts.identity_contract import UserDTO, get_user_by_id, get_users_by_ids

__all__ = [
    "UserDTO",
    "get_user_by_id",
    "get_users_by_ids",
]
