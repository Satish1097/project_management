import pytest

from apps.issues.services.issue_service import create_issue, move_issue_to_sprint
from apps.sprints.exceptions import SprintAlreadyActiveError, SprintCompletionError
from apps.sprints.services.sprint_service import (
    complete_sprint,
    create_sprint,
    start_sprint,
    update_sprint,
)


@pytest.mark.django_db
def test_create_sprint_service(project, superuser):
    sprint = create_sprint(
        project_id=project.id,
        name="Service Sprint",
        actor_id=superuser.id,
    )

    assert sprint.name == "Service Sprint"
    assert sprint.status == "planned"


@pytest.mark.django_db
def test_one_active_sprint_guard_service(project, superuser):
    first = create_sprint(project_id=project.id, name="First", actor_id=superuser.id)
    second = create_sprint(project_id=project.id, name="Second", actor_id=superuser.id)

    start_sprint(sprint_id=first.id, actor_id=superuser.id)

    with pytest.raises(SprintAlreadyActiveError):
        start_sprint(sprint_id=second.id, actor_id=superuser.id)


@pytest.mark.django_db
def test_start_sprint_service(project, superuser):
    sprint = create_sprint(project_id=project.id, name="Start me", actor_id=superuser.id)

    started = start_sprint(sprint_id=sprint.id, actor_id=superuser.id)

    assert started.status == "active"
    assert started.started_at is not None


@pytest.mark.django_db
def test_complete_sprint_carry_forward_backlog(project, superuser):
    active = create_sprint(project_id=project.id, name="Active", actor_id=superuser.id)
    start_sprint(sprint_id=active.id, actor_id=superuser.id)

    issue = create_issue(
        project_id=project.id,
        title="Incomplete",
        actor_id=superuser.id,
    )
    move_issue_to_sprint(issue_id=issue.id, sprint_id=active.id, actor_id=superuser.id)

    completed = complete_sprint(
        sprint_id=active.id,
        actor_id=superuser.id,
        move_incomplete_to="backlog",
    )

    assert completed.status == "completed"

    from apps.contracts.issue_contract import get_issue_by_id

    updated = get_issue_by_id(issue.id)
    assert updated.sprint_id is None


@pytest.mark.django_db
def test_complete_sprint_carry_forward_planned(project, superuser):
    active = create_sprint(project_id=project.id, name="Active", actor_id=superuser.id)
    planned = create_sprint(project_id=project.id, name="Planned", actor_id=superuser.id)
    start_sprint(sprint_id=active.id, actor_id=superuser.id)

    issue = create_issue(
        project_id=project.id,
        title="Move to planned",
        actor_id=superuser.id,
    )
    move_issue_to_sprint(issue_id=issue.id, sprint_id=active.id, actor_id=superuser.id)

    complete_sprint(
        sprint_id=active.id,
        actor_id=superuser.id,
        move_incomplete_to="sprint",
        target_sprint_id=planned.id,
    )

    from apps.contracts.issue_contract import get_issue_by_id

    updated = get_issue_by_id(issue.id)
    assert updated.sprint_id == planned.id


@pytest.mark.django_db
def test_completed_sprint_immutable_service(project, superuser):
    sprint = create_sprint(project_id=project.id, name="Done sprint", actor_id=superuser.id)
    start_sprint(sprint_id=sprint.id, actor_id=superuser.id)
    complete_sprint(sprint_id=sprint.id, actor_id=superuser.id)

    with pytest.raises(SprintCompletionError):
        update_sprint(sprint_id=sprint.id, actor_id=superuser.id, name="Renamed")
