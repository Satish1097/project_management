"""
Activity module contract — event DTOs and append interface.

Implementation deferred to Phase 11 (Activity).
"""
from dataclasses import dataclass
from datetime import datetime
from typing import Any, Optional
from uuid import UUID


@dataclass(frozen=True)
class ActivityEventDTO:
    id: UUID
    event_type: str
    actor_id: Optional[UUID]
    scope_type: str
    scope_id: UUID
    payload: dict[str, Any]
    created_at: datetime


def append_event(
    event_type: str,
    actor_id: Optional[UUID],
    scope_type: str,
    scope_id: UUID,
    payload: dict[str, Any],
) -> ActivityEventDTO:
    """Stub — implemented in apps.activity (Phase 11)."""
    raise NotImplementedError("activity_contract.append_event — Phase 11")
