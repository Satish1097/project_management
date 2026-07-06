import pytest

from apps.issues.exceptions import IssueValidationError
from apps.issues.services.issue_service import assign_issue, create_issue, move_issue_to_sprint
from apps.projects.services import archive_project
from apps.sprints.services.sprint_service import create_sprint


@pytest.mark.django_db
def test_create_issue_service_generates_key(project, superuser):
    issue = create_issue(
        project_id=project.id,
        title="Service issue",
        actor_id=superuser.id,
    )

    assert issue.key == "HRMS-1"
    assert issue.status_slug == "todo"


@pytest.mark.django_db
def test_create_issue_archived_project_raises(superuser, project):
    archive_project(project_id=project.id, actor=superuser)

    from apps.issues.exceptions import ArchivedProjectIssueError

    with pytest.raises(ArchivedProjectIssueError):
        create_issue(
            project_id=project.id,
            title="Blocked",
            actor_id=superuser.id,
        )


@pytest.mark.django_db
def test_subtask_validation(project, superuser, create_test_issue):
    with pytest.raises(IssueValidationError, match="Subtask requires"):
        create_issue(
            project_id=project.id,
            title="Bad subtask",
            issue_type="subtask",
            actor_id=superuser.id,
        )

    parent = create_test_issue(title="Parent")
    subtask = create_issue(
        project_id=project.id,
        title="Good subtask",
        issue_type="subtask",
        parent_issue_id=parent.id,
        actor_id=superuser.id,
    )
    assert subtask.parent_issue_id == parent.id


@pytest.mark.django_db
def test_assign_issue_service(project_with_roles, user, superuser, create_test_issue):
    issue = create_test_issue()

    updated = assign_issue(
        issue_id=issue.id,
        assignee_id=user.id,
        actor_id=superuser.id,
    )

    assert updated.assignee_id == user.id


@pytest.mark.django_db
def test_move_issue_to_sprint(project, superuser, create_test_issue):
    sprint = create_sprint(
        project_id=project.id,
        name="Sprint 1",
        actor_id=superuser.id,
    )
    issue = create_test_issue()

    moved = move_issue_to_sprint(
        issue_id=issue.id,
        sprint_id=sprint.id,
        actor_id=superuser.id,
    )

    assert moved.sprint_id == sprint.id

    backlog = move_issue_to_sprint(
        issue_id=issue.id,
        sprint_id=None,
        actor_id=superuser.id,
    )
    assert backlog.sprint_id is None
