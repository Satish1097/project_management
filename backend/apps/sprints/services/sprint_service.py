"""
Sprint business logic service.

Scope:
- create/update/start/pause/resume/complete sprint lifecycle
- no issue/workflow/analytics integration
"""
from uuid import UUID

from django.db import transaction

from apps.issues.selectors import get_incomplete_sprint_issue_ids
from apps.permissions.services import permission_service
from apps.projects.services.project_service import require_scrum_project
from apps.sprints.exceptions import (
    SprintCompletionError,
    SprintError,
    SprintNotFoundError,
)
from apps.sprints.models import Sprint, SprintStatus
from apps.sprints.selectors import get_sprint_by_id


def _get_sprint_or_raise(sprint_id: UUID) -> Sprint:
    sprint = get_sprint_by_id(sprint_id)
    if sprint is None:
        raise SprintNotFoundError(f"Sprint '{sprint_id}' not found.")
    return sprint


def _normalize_name(name: str) -> str:
    return name.strip()


def _can_start_sprint(user_id: UUID, sprint: Sprint) -> bool:
    return permission_service.can_start_sprint(user_id, sprint.project_id)


def _can_start_sprint_for_project(user_id: UUID, project_id: UUID) -> bool:
    return permission_service.can_start_sprint(user_id, project_id)


class SprintService:
    def create_sprint(
        self,
        user,
        project_id: UUID,
        name: str,
        goal: str | None = None,
        start_date=None,
        end_date=None,
        capacity_points: int | None = None,
    ) -> Sprint:
        require_scrum_project(project_id)
        if not _can_start_sprint_for_project(user.id, project_id):
            raise SprintError("Permission denied: cannot create sprint.")

        return Sprint.objects.create(
            project_id=project_id,
            name=_normalize_name(name),
            goal=goal,
            start_date=start_date,
            end_date=end_date,
            capacity_points=capacity_points,
            status=SprintStatus.PLANNED,
        )

    def update_sprint(self, user, sprint_id: UUID, **fields) -> Sprint:
        sprint = _get_sprint_or_raise(sprint_id)
        require_scrum_project(sprint.project_id)
        if not permission_service.can_start_sprint(user.id, sprint.project_id):
            raise SprintError("Permission denied: cannot update sprint.")

        allowed_fields = {
            "name",
            "goal",
            "start_date",
            "end_date",
            "capacity_points",
        }
        if "status" in fields:
            raise SprintError("Sprint status cannot be updated directly.")

        update_fields: list[str] = []
        for key, value in fields.items():
            if key not in allowed_fields:
                continue
            if key == "name" and value is not None:
                value = _normalize_name(value)
            setattr(sprint, key, value)
            update_fields.append(key)

        if update_fields:
            update_fields.append("updated_at")
            sprint.save(update_fields=update_fields)

        return sprint

    def start_sprint(self, user, sprint_id: UUID) -> Sprint:
        sprint = _get_sprint_or_raise(sprint_id)
        require_scrum_project(sprint.project_id)
        if not _can_start_sprint(user.id, sprint):
            raise SprintError("Permission denied: cannot start sprint.")
        if sprint.status != SprintStatus.PLANNED:
            raise SprintError("Only planned sprints can be started.")

        # Parallel Sprints: starting this sprint must NOT touch any other
        # active sprint in the project. Multiple active sprints may coexist.
        sprint.status = SprintStatus.ACTIVE
        sprint.save(update_fields=["status", "updated_at"])
        return sprint

    def pause_sprint(self, user, sprint_id: UUID) -> Sprint:
        sprint = _get_sprint_or_raise(sprint_id)
        require_scrum_project(sprint.project_id)
        if not permission_service.can_start_sprint(user.id, sprint.project_id):
            raise SprintError("Permission denied: cannot pause sprint.")
        if sprint.status != SprintStatus.ACTIVE:
            raise SprintError("Only active sprints can be paused.")

        sprint.status = SprintStatus.PAUSED
        sprint.save(update_fields=["status", "updated_at"])
        return sprint

    def resume_sprint(self, user, sprint_id: UUID) -> Sprint:
        sprint = _get_sprint_or_raise(sprint_id)
        require_scrum_project(sprint.project_id)
        if not permission_service.can_start_sprint(user.id, sprint.project_id):
            raise SprintError("Permission denied: cannot resume sprint.")
        if sprint.status != SprintStatus.PAUSED:
            raise SprintError("Only paused sprints can be resumed.")

        # Parallel Sprints: resuming this sprint must NOT touch any other
        # active sprint in the project.
        sprint.status = SprintStatus.ACTIVE
        sprint.save(update_fields=["status", "updated_at"])
        return sprint

    def complete_sprint(
        self,
        user,
        sprint_id: UUID,
        *,
        move_incomplete_to: str = "backlog",
        target_sprint_id: UUID | None = None,
    ) -> Sprint:
        sprint = _get_sprint_or_raise(sprint_id)
        require_scrum_project(sprint.project_id)
        if not permission_service.can_complete_sprint(user.id, sprint.project_id):
            raise SprintError("Permission denied: cannot complete sprint.")
        if sprint.status not in {SprintStatus.ACTIVE, SprintStatus.PAUSED}:
            raise SprintCompletionError(
                "Only active or paused sprints can be completed."
            )

        incomplete_issue_ids = get_incomplete_sprint_issue_ids(sprint_id)
        destination_sprint_id: UUID | None = None

        if incomplete_issue_ids:
            if move_incomplete_to == "sprint":
                if target_sprint_id is None:
                    raise SprintCompletionError(
                        "Target sprint is required when moving incomplete issues to another sprint."
                    )
                if target_sprint_id == sprint_id:
                    raise SprintCompletionError(
                        "Cannot move incomplete issues to the sprint being completed."
                    )

                target_sprint = _get_sprint_or_raise(target_sprint_id)
                if target_sprint.project_id != sprint.project_id:
                    raise SprintCompletionError(
                        "Target sprint must belong to the same project."
                    )
                if target_sprint.status != SprintStatus.PLANNED:
                    raise SprintCompletionError(
                        "Target sprint must be a planned sprint."
                    )
                destination_sprint_id = target_sprint_id

            from apps.issues.services.issue_service import issue_service

            with transaction.atomic():
                issue_service.bulk_assign_sprint(
                    user,
                    incomplete_issue_ids,
                    destination_sprint_id,
                )
                sprint.status = SprintStatus.COMPLETED
                sprint.save(update_fields=["status", "updated_at"])
        else:
            sprint.status = SprintStatus.COMPLETED
            sprint.save(update_fields=["status", "updated_at"])

        return sprint


sprint_service = SprintService()


def create_sprint(
    project_id,
    name,
    actor_id,
    goal=None,
    start_date=None,
    end_date=None,
    capacity_points=None,
):
    from django.contrib.auth import get_user_model

    User = get_user_model()
    user = User.objects.get(pk=actor_id)
    return sprint_service.create_sprint(
        user=user,
        project_id=project_id,
        name=name,
        goal=goal,
        start_date=start_date,
        end_date=end_date,
        capacity_points=capacity_points,
    )


def start_sprint(sprint_id, actor_id):
    from django.contrib.auth import get_user_model

    User = get_user_model()
    user = User.objects.get(pk=actor_id)
    return sprint_service.start_sprint(
        user=user,
        sprint_id=sprint_id,
    )

