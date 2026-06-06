"""Frozen default workflow definitions for Phase 3."""

from typing import TypedDict


class StatusDef(TypedDict):
    name: str
    slug: str
    category: str
    position: int
    is_default: bool
    is_terminal: bool


class TransitionDef(TypedDict):
    from_slug: str
    to_slug: str
    name: str
    requires_approval: bool


DEFAULT_STATUSES: tuple[StatusDef, ...] = (
    {
        "name": "To Do",
        "slug": "todo",
        "category": "pending",
        "position": 1,
        "is_default": True,
        "is_terminal": False,
    },
    {
        "name": "In Progress",
        "slug": "in_progress",
        "category": "active",
        "position": 2,
        "is_default": False,
        "is_terminal": False,
    },
    {
        "name": "In Review",
        "slug": "in_review",
        "category": "review",
        "position": 3,
        "is_default": False,
        "is_terminal": False,
    },
    {
        "name": "Done",
        "slug": "done",
        "category": "complete",
        "position": 4,
        "is_default": False,
        "is_terminal": True,
    },
    {
        "name": "Blocked",
        "slug": "blocked",
        "category": "blocked",
        "position": 5,
        "is_default": False,
        "is_terminal": False,
    },
)

DEFAULT_TRANSITIONS: tuple[TransitionDef, ...] = (
    {
        "from_slug": "todo",
        "to_slug": "in_progress",
        "name": "Start Progress",
        "requires_approval": False,
    },
    {
        "from_slug": "in_progress",
        "to_slug": "in_review",
        "name": "Submit for Review",
        "requires_approval": False,
    },
    {
        "from_slug": "in_review",
        "to_slug": "done",
        "name": "Approve",
        "requires_approval": True,
    },
    {
        "from_slug": "done",
        "to_slug": "in_review",
        "name": "Reopen",
        "requires_approval": False,
    },
    {
        "from_slug": "blocked",
        "to_slug": "todo",
        "name": "Unblock to To Do",
        "requires_approval": False,
    },
    {
        "from_slug": "blocked",
        "to_slug": "in_progress",
        "name": "Unblock to In Progress",
        "requires_approval": False,
    },
    {
        "from_slug": "todo",
        "to_slug": "blocked",
        "name": "Block",
        "requires_approval": False,
    },
    {
        "from_slug": "in_progress",
        "to_slug": "blocked",
        "name": "Block",
        "requires_approval": False,
    },
    {
        "from_slug": "in_review",
        "to_slug": "blocked",
        "name": "Block",
        "requires_approval": False,
    },
    {
        "from_slug": "done",
        "to_slug": "blocked",
        "name": "Block",
        "requires_approval": False,
    },
)

RESTRICTED_TRANSITIONS: dict[tuple[str, str], str] = {
    ("in_review", "done"): "approve",
    ("done", "in_review"): "reopen",
}

DEFAULT_STATUS_SLUG = "todo"
