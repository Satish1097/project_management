from decimal import Decimal
from uuid import UUID

from django.db.models import Max

from apps.contracts.membership_contract import get_project_role
from apps.contracts.workflow_contract import WorkflowStatusDTO, WorkflowTransitionDTO
from apps.issues.models import Issue
from apps.workflow.constants import RESTRICTED_TRANSITIONS
from apps.workflow.exceptions import (
    ForbiddenWorkflowTransitionError,
    InvalidWorkflowTransitionError,
    WorkflowStatusNotFoundError,
)
from apps.workflow.models import WorkflowStatus, WorkflowTransition

_APPROVE_ROLES = frozenset({"project_admin", "project_manager", "qa"})
_REOPEN_ROLES = frozenset({"project_admin", "project_manager"})
_TRANSITION_ROLES = frozenset({"project_admin", "project_manager", "developer", "qa"})


def _status_to_dto(status: WorkflowStatus) -> WorkflowStatusDTO:
    return WorkflowStatusDTO(
        id=status.id,
        name=status.name,
        slug=status.slug,
        category=status.category,
        position=status.position,
        is_default=status.is_default,
        is_terminal=status.is_terminal,
    )


def _transition_to_dto(transition: WorkflowTransition) -> WorkflowTransitionDTO:
    return WorkflowTransitionDTO(
        id=transition.id,
        from_status_slug=transition.from_status.slug,
        to_status_slug=transition.to_status.slug,
        name=transition.name,
        requires_approval=transition.requires_approval,
    )


def _resolve_status(project_id: UUID, slug: str) -> WorkflowStatus:
    try:
        return WorkflowStatus.objects.get(project_id=project_id, slug=slug)
    except WorkflowStatus.DoesNotExist as exc:
        raise WorkflowStatusNotFoundError(
            f"Status '{slug}' not found for project '{project_id}'."
        ) from exc


def _transition_exists(project_id: UUID, from_slug: str, to_slug: str) -> bool:
    return WorkflowTransition.objects.filter(
        project_id=project_id,
        from_status__slug=from_slug,
        to_status__slug=to_slug,
    ).exists()


def _restricted_kind(from_slug: str, to_slug: str) -> str | None:
    return RESTRICTED_TRANSITIONS.get((from_slug, to_slug))


def _role_may_transition(
    role: str | None,
    from_slug: str,
    to_slug: str,
) -> bool:
    if role is None:
        return False

    kind = _restricted_kind(from_slug, to_slug)
    if kind == "approve":
        return role in _APPROVE_ROLES
    if kind == "reopen":
        return role in _REOPEN_ROLES
    return role in _TRANSITION_ROLES


def _end_of_column_position(issue: Issue, target_status_id: UUID) -> Decimal:
    scope = Issue.objects.filter(
        project_id=issue.project_id,
        status_id=target_status_id,
    )
    if issue.sprint_id is None:
        scope = scope.filter(sprint__isnull=True)
    else:
        scope = scope.filter(sprint_id=issue.sprint_id)

    max_position = scope.aggregate(max_position=Max("position"))["max_position"]
    if max_position is None:
        return Decimal("1000")
    return max_position + Decimal("1000")


class TransitionService:
    def get_status_by_slug(
        self,
        project_id: UUID,
        slug: str,
    ) -> WorkflowStatusDTO | None:
        try:
            status = _resolve_status(project_id, slug)
        except WorkflowStatusNotFoundError:
            return None
        return _status_to_dto(status)

    def is_valid_transition(
        self,
        project_id: UUID,
        from_slug: str,
        to_slug: str,
    ) -> bool:
        return _transition_exists(project_id, from_slug, to_slug)

    def is_transition_allowed(
        self,
        project_id: UUID,
        from_slug: str,
        to_slug: str,
        user_id: UUID,
    ) -> bool:
        if not self.is_valid_transition(project_id, from_slug, to_slug):
            return False
        role = get_project_role(user_id, project_id)
        return _role_may_transition(role, from_slug, to_slug)

    def get_allowed_transitions(
        self,
        project_id: UUID,
        from_slug: str,
        user_id: UUID,
    ) -> list[str]:
        transitions = WorkflowTransition.objects.filter(
            project_id=project_id,
            from_status__slug=from_slug,
        ).select_related("to_status")

        allowed: list[str] = []
        for transition in transitions:
            to_slug = transition.to_status.slug
            if self.is_transition_allowed(project_id, from_slug, to_slug, user_id):
                allowed.append(to_slug)
        return allowed

    def get_allowed_transition_dtos(
        self,
        project_id: UUID,
        from_slug: str,
        user_id: UUID,
    ) -> list[WorkflowTransitionDTO]:
        transitions = WorkflowTransition.objects.filter(
            project_id=project_id,
            from_status__slug=from_slug,
        ).select_related("from_status", "to_status")

        allowed: list[WorkflowTransitionDTO] = []
        for transition in transitions:
            from_status_slug = transition.from_status.slug
            to_slug = transition.to_status.slug
            if self.is_transition_allowed(
                project_id,
                from_status_slug,
                to_slug,
                user_id,
            ):
                allowed.append(_transition_to_dto(transition))
        return allowed

    def transition_issue(
        self,
        issue: Issue,
        to_status_slug: str,
        user_id: UUID,
    ) -> Issue:
        from_slug = issue.status.slug
        project_id = issue.project_id

        target_status = _resolve_status(project_id, to_status_slug)

        if target_status.project_id != issue.project_id:
            raise InvalidWorkflowTransitionError(
                "Target status does not belong to the issue project."
            )

        if not self.is_valid_transition(project_id, from_slug, to_status_slug):
            raise InvalidWorkflowTransitionError(
                f"Transition from '{from_slug}' to '{to_status_slug}' is not allowed."
            )

        role = get_project_role(user_id, project_id)
        if not _role_may_transition(role, from_slug, to_status_slug):
            raise ForbiddenWorkflowTransitionError(
                f"User '{user_id}' cannot transition from '{from_slug}' to '{to_status_slug}'."
            )

        issue.status = target_status
        issue.position = _end_of_column_position(issue, target_status.id)
        issue.save(update_fields=["status", "position", "updated_at"])

        return issue


transition_service = TransitionService()
