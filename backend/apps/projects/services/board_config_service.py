"""
Kanban board column configuration (WIP limits, visibility, order).

Stored in Project.board_config and applied only when methodology=kanban.
Scrum projects ignore board_config entirely.

WIP count policy: gross count of top-level issues in the column (board scope,
no active filters). Subtasks are excluded via the board issue queryset.
"""
from __future__ import annotations

from dataclasses import dataclass
from uuid import UUID

from django.db import transaction

from apps.projects.exceptions import ProjectNotFoundError
from apps.projects.models import Project
from apps.projects.services.project_service import require_kanban_project
from apps.workflow.selectors import get_project_statuses


def _get_project_model(project_id: UUID) -> Project:
    try:
        return Project.objects.get(pk=project_id)
    except Project.DoesNotExist:
        raise ProjectNotFoundError(f"Project '{project_id}' does not exist.") from None


@dataclass(frozen=True)
class KanbanColumnConfig:
    status_id: UUID
    status_name: str
    status_slug: str
    wip_limit: int | None
    is_enabled: bool
    display_order: int


def _status_slug(status) -> str:
    from apps.workflow.slug_utils import status_slug

    return status_slug(name=status.name, category=status.category)


def _normalize_wip_limit(value) -> int | None:
    if value is None or value == "":
        return None
    limit = int(value)
    if limit < 1:
        raise ValueError("WIP limit must be at least 1 when set.")
    return limit


def resolve_kanban_column_configs(project_id: UUID) -> list[KanbanColumnConfig]:
    """
    Merge workflow statuses with stored board_config overrides.

    Defaults per status: is_enabled=True, display_order=workflow order, wip_limit=None.
    """
    project = _get_project_model(project_id)

    statuses = list(get_project_statuses(project_id))
    stored = (project.board_config or {}).get("columns", [])
    overrides_by_status: dict[str, dict] = {}
    for entry in stored:
        status_id = entry.get("status_id")
        if status_id:
            overrides_by_status[str(status_id)] = entry

    configs: list[KanbanColumnConfig] = []
    for status in statuses:
        override = overrides_by_status.get(str(status.id), {})
        display_order = override.get("display_order", status.order)
        is_enabled = override.get("is_enabled", True)
        wip_limit = override.get("wip_limit")
        if wip_limit is not None:
            wip_limit = int(wip_limit)

        configs.append(
            KanbanColumnConfig(
                status_id=status.id,
                status_name=status.name,
                status_slug=_status_slug(status),
                wip_limit=wip_limit,
                is_enabled=bool(is_enabled),
                display_order=int(display_order),
            )
        )

    configs.sort(key=lambda item: (item.display_order, item.status_name.lower()))
    return configs


def get_kanban_board_config(project_id: UUID) -> list[KanbanColumnConfig]:
    require_kanban_project(project_id)
    return resolve_kanban_column_configs(project_id)


@transaction.atomic
def update_kanban_board_config(project_id: UUID, columns: list[dict]) -> list[KanbanColumnConfig]:
    require_kanban_project(project_id)
    project = _get_project_model(project_id)

    statuses = list(get_project_statuses(project_id))
    status_ids = {status.id for status in statuses}

    if not columns:
        raise ValueError("At least one column configuration is required.")

    seen_status_ids: set[UUID] = set()
    normalized_columns: list[dict] = []

    for index, column in enumerate(columns):
        raw_status_id = column.get("status_id")
        if not raw_status_id:
            raise ValueError("Each column must include status_id.")
        status_id = UUID(str(raw_status_id))
        if status_id not in status_ids:
            raise ValueError(f"Unknown workflow status '{status_id}'.")
        if status_id in seen_status_ids:
            raise ValueError(f"Duplicate configuration for status '{status_id}'.")
        seen_status_ids.add(status_id)

        is_enabled = column.get("is_enabled", True)
        display_order = column.get("display_order", index)
        if display_order < 0 or not isinstance(display_order, int):
            raise ValueError("display_order must be a non-negative integer.")

        wip_limit = _normalize_wip_limit(column.get("wip_limit"))

        normalized_columns.append(
            {
                "status_id": str(status_id),
                "wip_limit": wip_limit,
                "is_enabled": bool(is_enabled),
                "display_order": int(display_order),
            }
        )

    missing = status_ids - seen_status_ids
    if missing:
        raise ValueError("Configuration must include every workflow status.")

    project.board_config = {"columns": normalized_columns}
    project.save(update_fields=["board_config", "updated_at"])
    return resolve_kanban_column_configs(project_id)
