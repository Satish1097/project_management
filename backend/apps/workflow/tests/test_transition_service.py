import pytest

from apps.contracts.workflow_contract import get_workflow_config, is_valid_transition
from apps.issues.services.issue_service import create_issue
from apps.projects.services import create_project
from apps.workflow.constants import DEFAULT_STATUSES, DEFAULT_TRANSITIONS
from apps.workflow.exceptions import (
    ForbiddenWorkflowTransitionError,
    InvalidWorkflowTransitionError,
)
from apps.workflow.services.transition_service import transition_service


@pytest.mark.django_db
def test_frozen_default_workflow_seeded_on_project_create(superuser, organization):
    project = create_project(
        organization=organization.id,
        name="Workflow Project",
        key="WF",
        slug="workflow-project",
        creator=superuser,
    )

    config = get_workflow_config(project.id)

    assert len(config.statuses) == len(DEFAULT_STATUSES)
    assert len(config.transitions) == len(DEFAULT_TRANSITIONS)
    slugs = {status.slug for status in config.statuses}
    assert slugs == {"todo", "in_progress", "in_review", "done", "blocked"}


@pytest.mark.django_db
def test_valid_transition_matrix(project):
    assert is_valid_transition(project.id, "todo", "in_progress") is True
    assert is_valid_transition(project.id, "in_progress", "in_review") is True
    assert is_valid_transition(project.id, "in_review", "done") is True
    assert is_valid_transition(project.id, "done", "in_review") is True
    assert is_valid_transition(project.id, "todo", "done") is False


@pytest.mark.django_db
def test_invalid_transition_rejection(project, superuser):
    from apps.workflow.selectors import select_workflow_config

    issue = create_issue(
        project_id=project.id,
        title="Transition test",
        actor_id=superuser.id,
    )

    # "todo" → "done" is not a valid transition — expects InvalidWorkflowTransitionError
    statuses = {s.slug: s for s in select_workflow_config(project.id).statuses}
    done_status = statuses["done"]

    with pytest.raises(InvalidWorkflowTransitionError):
        transition_service.transition_issue(superuser, issue.id, done_status.id)


@pytest.mark.django_db
def test_approve_reopen_restrictions(project, superuser, user):
    from apps.projects.models import ProjectRole
    from apps.projects.services.membership_service import add_project_member
    from apps.workflow.selectors import select_workflow_config

    add_project_member(
        project_id=project.id,
        user_id=user.id,
        added_by=superuser,
        role=ProjectRole.DEVELOPER,
    )

    issue = create_issue(
        project_id=project.id,
        title="Approve test",
        actor_id=superuser.id,
    )

    statuses = {s.slug: s for s in select_workflow_config(project.id).statuses}

    transition_service.transition_issue(superuser, issue.id, statuses["in_progress"].id)
    transition_service.transition_issue(superuser, issue.id, statuses["in_review"].id)

    # A DEVELOPER should not be able to approve "in_review" → "done"
    with pytest.raises(ForbiddenWorkflowTransitionError):
        transition_service.transition_issue(user, issue.id, statuses["done"].id)


@pytest.mark.django_db
def test_transition_service_single_authority(project, superuser):
    from apps.contracts.issue_contract import get_issue_by_id
    from apps.workflow.selectors import select_workflow_config

    issue = create_issue(
        project_id=project.id,
        title="Authority test",
        actor_id=superuser.id,
    )

    statuses = {s.slug: s for s in select_workflow_config(project.id).statuses}

    updated = transition_service.transition_issue(
        superuser,
        issue.id,
        statuses["in_progress"].id,
    )

    from apps.workflow.slug_utils import status_slug
    assert status_slug(name=updated.status.name, category=updated.status.category) == "in_progress"

    dto = get_issue_by_id(issue.id)
    assert dto.status_slug == "in_progress"

