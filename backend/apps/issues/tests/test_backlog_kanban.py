import pytest

from apps.contracts.issue_contract import get_backlog_issues, get_kanban_board
from apps.issues.selectors import select_backlog_issues, select_kanban_board
from apps.sprints.services.sprint_service import create_sprint


@pytest.mark.django_db
def test_backlog_selector_lists_unsprinted_issues(project, superuser, create_test_issue):
    in_backlog = create_test_issue(title="Backlog item")
    sprint = create_sprint(project_id=project.id, name="Sprint A", actor_id=superuser.id)
    create_test_issue(title="Sprint item", sprint_id=sprint.id)

    backlog = select_backlog_issues(project.id)
    keys = [issue.key for issue in backlog]

    assert in_backlog.key in keys
    assert len(backlog) == 1


@pytest.mark.django_db
def test_backlog_api(superuser_client, project, create_test_issue):
    create_test_issue(title="Backlog via API")

    response = superuser_client.get(f"/api/projects/{project.id}/backlog")

    assert response.status_code == 200
    issues = response.json()["data"]["issues"]
    assert len(issues) == 1
    assert issues[0]["title"] == "Backlog via API"


@pytest.mark.django_db
def test_kanban_selector_groups_by_status(project, superuser, create_test_issue, status_ids):
    create_test_issue(title="Todo card")
    create_test_issue(title="Another todo")

    board = select_kanban_board(project.id)
    todo_column = next(c for c in board.columns if c.status_slug == "todo")

    assert len(todo_column.issues) == 2
    assert board.project_id == project.id


@pytest.mark.django_db
def test_kanban_api_backlog_scope(superuser_client, project, create_test_issue):
    create_test_issue(title="Kanban card")

    response = superuser_client.get(f"/api/projects/{project.id}/kanban")

    assert response.status_code == 200
    board = response.json()["data"]["board"]
    todo_column = next(c for c in board["columns"] if c["status_slug"] == "todo")
    assert len(todo_column["issues"]) == 1


@pytest.mark.django_db
def test_sprint_board_selector(project, superuser, create_test_issue):
    sprint = create_sprint(project_id=project.id, name="Board Sprint", actor_id=superuser.id)
    create_test_issue(title="Sprint board card", sprint_id=sprint.id)
    create_test_issue(title="Backlog only")

    board = select_kanban_board(project.id, sprint_id=sprint.id)
    issue_keys = [
        issue.key for column in board.columns for issue in column.issues
    ]

    assert len(issue_keys) == 1
    assert issue_keys[0].startswith("HRMS-")


@pytest.mark.django_db
def test_sprint_board_api(superuser_client, project, superuser, create_test_issue):
    sprint = create_sprint(project_id=project.id, name="API Sprint", actor_id=superuser.id)
    create_test_issue(title="On sprint board", sprint_id=sprint.id)

    response = superuser_client.get(f"/api/sprints/{sprint.id}/board")

    assert response.status_code == 200
    board = response.json()["data"]["board"]
    assert board["project_id"] == str(project.id)


@pytest.mark.django_db
def test_move_sprint_via_service_updates_backlog(project, superuser, create_test_issue):
    sprint = create_sprint(project_id=project.id, name="Move target", actor_id=superuser.id)
    issue = create_test_issue()

    from apps.issues.services.issue_service import move_issue_to_sprint

    move_issue_to_sprint(
        issue_id=issue.id,
        sprint_id=sprint.id,
        actor_id=superuser.id,
    )

    backlog = get_backlog_issues(project.id)
    assert all(i.id != issue.id for i in backlog)

    move_issue_to_sprint(
        issue_id=issue.id,
        sprint_id=None,
        actor_id=superuser.id,
    )
    backlog_after = get_backlog_issues(project.id)
    assert any(i.id == issue.id for i in backlog_after)
