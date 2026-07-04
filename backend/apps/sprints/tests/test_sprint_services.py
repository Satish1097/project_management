import pytest

from apps.issues.services.issue_service import issue_service
from apps.sprints.exceptions import SprintCompletionError, SprintError
from apps.sprints.models import SprintStatus
from apps.sprints.services.sprint_service import sprint_service


@pytest.mark.django_db
def test_create_sprint_service(project, superuser):
    sprint = sprint_service.create_sprint(
        user=superuser,
        project_id=project.id,
        name="Service Sprint",
    )

    assert sprint.name == "Service Sprint"
    assert sprint.status == "planned"


@pytest.mark.django_db
def test_parallel_active_sprints_allowed_service(project, superuser):
    """Parallel Sprints: multiple sprints may be ACTIVE at the same time."""
    first = sprint_service.create_sprint(
        user=superuser, project_id=project.id, name="First"
    )
    second = sprint_service.create_sprint(
        user=superuser, project_id=project.id, name="Second"
    )

    started_first = sprint_service.start_sprint(user=superuser, sprint_id=first.id)
    # Starting the second sprint must NOT be blocked and must NOT affect the first.
    started_second = sprint_service.start_sprint(user=superuser, sprint_id=second.id)

    started_first.refresh_from_db()
    assert started_first.status == SprintStatus.ACTIVE
    assert started_second.status == SprintStatus.ACTIVE


@pytest.mark.django_db
def test_completing_one_sprint_does_not_affect_another(project, superuser):
    """Completing Sprint A must not change Sprint B's state."""
    a = sprint_service.create_sprint(user=superuser, project_id=project.id, name="A")
    b = sprint_service.create_sprint(user=superuser, project_id=project.id, name="B")
    sprint_service.start_sprint(user=superuser, sprint_id=a.id)
    sprint_service.start_sprint(user=superuser, sprint_id=b.id)

    sprint_service.complete_sprint(user=superuser, sprint_id=a.id)

    a.refresh_from_db()
    b.refresh_from_db()
    assert a.status == SprintStatus.COMPLETED
    assert b.status == SprintStatus.ACTIVE


@pytest.mark.django_db
def test_start_sprint_service(project, superuser):
    sprint = sprint_service.create_sprint(
        user=superuser, project_id=project.id, name="Start me"
    )

    started = sprint_service.start_sprint(user=superuser, sprint_id=sprint.id)

    assert started.status == SprintStatus.ACTIVE


@pytest.mark.django_db
def test_complete_sprint_carry_forward_backlog(project, superuser):
    active = sprint_service.create_sprint(
        user=superuser, project_id=project.id, name="Active"
    )
    sprint_service.start_sprint(user=superuser, sprint_id=active.id)

    issue = issue_service.create_issue(
        user=superuser,
        project_id=project.id,
        title="Incomplete",
    )
    issue_service.assign_sprint(superuser, issue.id, active.id)

    completed = sprint_service.complete_sprint(
        user=superuser,
        sprint_id=active.id,
        move_incomplete_to="backlog",
    )

    assert completed.status == SprintStatus.COMPLETED

    issue.refresh_from_db()
    assert issue.sprint_id is None


@pytest.mark.django_db
def test_complete_sprint_carry_forward_planned(project, superuser):
    active = sprint_service.create_sprint(
        user=superuser, project_id=project.id, name="Active"
    )
    planned = sprint_service.create_sprint(
        user=superuser, project_id=project.id, name="Planned"
    )
    sprint_service.start_sprint(user=superuser, sprint_id=active.id)

    issue = issue_service.create_issue(
        user=superuser,
        project_id=project.id,
        title="Move to planned",
    )
    issue_service.assign_sprint(superuser, issue.id, active.id)

    sprint_service.complete_sprint(
        user=superuser,
        sprint_id=active.id,
        move_incomplete_to="sprint",
        target_sprint_id=planned.id,
    )

    issue.refresh_from_db()
    assert issue.sprint_id == planned.id


@pytest.mark.django_db
def test_only_planned_sprints_can_start(project, superuser):
    sprint = sprint_service.create_sprint(
        user=superuser, project_id=project.id, name="Once"
    )
    sprint_service.start_sprint(user=superuser, sprint_id=sprint.id)

    with pytest.raises(SprintError):
        sprint_service.start_sprint(user=superuser, sprint_id=sprint.id)


@pytest.mark.django_db
def test_completed_sprint_cannot_be_completed_again(project, superuser):
    sprint = sprint_service.create_sprint(
        user=superuser, project_id=project.id, name="Done sprint"
    )
    sprint_service.start_sprint(user=superuser, sprint_id=sprint.id)
    sprint_service.complete_sprint(user=superuser, sprint_id=sprint.id)

    with pytest.raises(SprintCompletionError):
        sprint_service.complete_sprint(user=superuser, sprint_id=sprint.id)
