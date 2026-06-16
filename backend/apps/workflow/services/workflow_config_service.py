from __future__ import annotations

from uuid import UUID

from django.db import transaction

from apps.workflow.models import (
    WorkflowScheme,
    WorkflowStatus,
    WorkflowStatusCategory,
    WorkflowTransition,
)
from apps.workflow.selectors import get_project_workflow
from apps.workflow.slug_utils import status_slug


class WorkflowConfigService:
    DEFAULT_SCHEME_NAME = "Default Workflow"
    DEFAULT_STATUS_COLOR = "#94A3B8"
    ALLOWED_CATEGORIES = frozenset(
        {
            WorkflowStatusCategory.TODO,
            WorkflowStatusCategory.IN_PROGRESS,
            WorkflowStatusCategory.DONE,
        }
    )
    DEFAULT_STATUSES = (
        {
            "name": "Todo",
            "category": WorkflowStatusCategory.TODO,
            "is_default": True,
            "order": 1,
        },
        {
            "name": "In Progress",
            "category": WorkflowStatusCategory.IN_PROGRESS,
            "is_default": False,
            "order": 2,
        },
        {
            "name": "Done",
            "category": WorkflowStatusCategory.DONE,
            "is_default": False,
            "order": 3,
        },
    )
    DEFAULT_TRANSITIONS = (
        ("Todo", "In Progress"),
        ("In Progress", "Done"),
        ("Done", "In Progress"),
    )

    def create_default_workflow(self, project_id: UUID) -> WorkflowScheme:
        with transaction.atomic():
            scheme, _ = WorkflowScheme.objects.get_or_create(
                project_id=project_id,
                defaults={"name": self.DEFAULT_SCHEME_NAME},
            )

            statuses_by_name: dict[str, WorkflowStatus] = {}
            for status_def in self.DEFAULT_STATUSES:
                status, _ = WorkflowStatus.objects.get_or_create(
                    project_id=project_id,
                    name=status_def["name"],
                    defaults={
                        "category": status_def["category"],
                        "color": self.DEFAULT_STATUS_COLOR,
                        "order": status_def["order"],
                        "is_default": status_def["is_default"],
                    },
                )
                statuses_by_name[status.name] = status

            for from_name, to_name in self.DEFAULT_TRANSITIONS:
                from_status = statuses_by_name[from_name]
                to_status = statuses_by_name[to_name]
                WorkflowTransition.objects.get_or_create(
                    project_id=project_id,
                    from_status=from_status,
                    to_status=to_status,
                    defaults={"name": f"{from_name} -> {to_name}"},
                )

            return scheme

    def update_workflow(
        self,
        user,
        project_id: UUID,
        statuses: list[dict],
        transitions: list[dict],
    ) -> dict[str, str | list[dict]]:
        del user
        normalized_statuses = self._validate_statuses_shape(statuses)
        normalized_transitions = self._validate_transitions_shape(transitions)
        self._validate_directional_references(normalized_statuses, normalized_transitions)
        return self.format_validation_response(project_id, normalized_statuses, normalized_transitions)

    def format_validation_response(
        self,
        project_id: UUID,
        statuses: list[dict],
        transitions: list[dict],
    ) -> dict[str, str | list[dict] | None]:
        scheme = get_project_workflow(project_id)
        ref_to_slug: dict[str, str] = {}
        statuses_out: list[dict] = []

        for status in statuses:
            slug = status_slug(name=status["name"], category=status["category"])
            status_id = status.get("id") or status.get("temp_id") or ""
            if status_id:
                ref_to_slug[str(status_id)] = slug
            statuses_out.append(
                {
                    "id": str(status_id),
                    "slug": slug,
                    "name": status["name"],
                    "category": status["category"],
                    "order": status["order"],
                    "is_default": status.get("is_default", False),
                    "is_terminal": slug == "done",
                }
            )

        transitions_out: list[dict] = []
        for index, transition in enumerate(transitions):
            from_slug = ref_to_slug.get(transition["from_status_id"], "")
            to_slug = ref_to_slug.get(transition["to_status_id"], "")
            transitions_out.append(
                {
                    "id": f"validated-{index}",
                    "from_status_slug": from_slug,
                    "to_status_slug": to_slug,
                    "name": transition.get("name", ""),
                    "requires_approval": False,
                }
            )

        return {
            "scheme_name": scheme.name if scheme is not None else None,
            "statuses": statuses_out,
            "transitions": transitions_out,
        }

    def _validate_statuses_shape(self, statuses: list[dict]) -> list[dict]:
        if not isinstance(statuses, list):
            raise ValueError("statuses must be a list.")
        if not statuses:
            raise ValueError("statuses cannot be empty.")

        normalized_statuses: list[dict] = []
        for status in statuses:
            if not isinstance(status, dict):
                raise ValueError("each status must be an object.")
            for key in ("name", "category", "order"):
                if key not in status:
                    raise ValueError(f"status missing required key: {key}.")
            if status["category"] not in self.ALLOWED_CATEGORIES:
                raise ValueError(f"invalid category: {status['category']}.")
            normalized_status = {
                "name": status["name"],
                "category": status["category"],
                "order": status["order"],
                "color": status.get("color", self.DEFAULT_STATUS_COLOR),
                "is_default": bool(status.get("is_default", False)),
            }
            if "id" in status and status["id"] is not None:
                normalized_status["id"] = str(status["id"])
            if "temp_id" in status and status["temp_id"] is not None:
                normalized_status["temp_id"] = str(status["temp_id"])
            normalized_statuses.append(normalized_status)
        return normalized_statuses

    def _validate_transitions_shape(self, transitions: list[dict]) -> list[dict]:
        if not isinstance(transitions, list):
            raise ValueError("transitions must be a list.")

        normalized_transitions: list[dict] = []
        for transition in transitions:
            if not isinstance(transition, dict):
                raise ValueError("each transition must be an object.")
            for key in ("from_status_id", "to_status_id"):
                if key not in transition:
                    raise ValueError(f"transition missing required key: {key}.")
            if transition["from_status_id"] == transition["to_status_id"]:
                raise ValueError("self transitions are not allowed.")
            normalized_transitions.append(
                {
                    "from_status_id": str(transition["from_status_id"]),
                    "to_status_id": str(transition["to_status_id"]),
                    "name": transition.get("name", ""),
                }
            )
        return normalized_transitions

    @staticmethod
    def _validate_directional_references(
        statuses: list[dict],
        transitions: list[dict],
    ) -> None:
        allowed_refs = {
            ref
            for status in statuses
            for ref in (status.get("id"), status.get("temp_id"))
            if ref
        }
        for transition in transitions:
            if transition["from_status_id"] not in allowed_refs:
                raise ValueError("transition from_status_id must reference provided statuses.")
            if transition["to_status_id"] not in allowed_refs:
                raise ValueError("transition to_status_id must reference provided statuses.")


workflow_config_service = WorkflowConfigService()
