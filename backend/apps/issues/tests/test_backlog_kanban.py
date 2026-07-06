import pytest

from apps.contracts.issue_contract import get_backlog_issues
from apps.issues.selectors import get_sprint_kanban, select_backlog_issues
from apps.sprints.services.sprint_service import sprint_service
from apps.workflow.slug_utils import status_slug


@pytest.mark.django_db
def test_backlog_selector_lists_unsprinted_issues(project, superuser, create_test_issue):
    in_backlog = create_test_issue(title="Backlog item")
    sprint = sprint_service.create_sprint(user=superuser, project_id=project.id, name="Sprint A")
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
    backlog = response.json()["data"]["backlog"]
    assert backlog["backlog_issue_count"] == 1
    assert backlog["sprints"] == []


@pytest.mark.django_db
def test_backlog_issues_pagination(superuser_client, project, create_test_issue):
    for index in range(20):
        create_test_issue(title=f"Backlog {index}")

    response = superuser_client.get(
        f"/api/projects/{project.id}/backlog/issues",
        {"page": 1, "page_size": 15},
    )

    assert response.status_code == 200
    payload = response.json()["data"]
    assert len(payload["issues"]) == 15
    assert payload["total"] == 20
    assert payload["has_next"] is True
    assert payload["page_size"] == 15


@pytest.mark.django_db
def test_kanban_selector_groups_all_project_issues(
    kanban_project,
    superuser,
    create_test_issue,
    status_ids,
):
    def _create(**kwargs):
        return create_test_issue(project_id=kanban_project.id, **kwargs)

    _create(title="Todo card")
    _create(title="Another todo")

    from apps.issues.selectors import get_project_kanban

    board = get_project_kanban(kanban_project.id)
    todo_column = next(
        column for column in board["columns"] if status_slug(
            name=column["status"].name,
            category=column["status"].category,
        ) == "todo"
    )

    assert len(todo_column["issues"]) == 2


@pytest.mark.django_db
def test_scrum_kanban_selector_groups_active_sprint_issues(
    project,
    superuser,
    create_test_issue,
    status_ids,
):
    from apps.issues.selectors import get_project_kanban
    from apps.sprints.models import Sprint, SprintStatus

    active_sprint = Sprint.objects.create(
        project_id=project.id,
        name="Active",
        status=SprintStatus.ACTIVE,
    )
    create_test_issue(title="Sprint card", sprint_id=active_sprint.id)
    create_test_issue(title="Backlog card")

    board = get_project_kanban(project.id)
    todo_column = next(
        column for column in board["columns"] if status_slug(
            name=column["status"].name,
            category=column["status"].category,
        ) == "todo"
    )

    assert len(todo_column["issues"]) == 1


@pytest.mark.django_db
def test_kanban_api_backlog_scope(kanban_project, superuser_client, create_test_issue):
    create_test_issue(project_id=kanban_project.id, title="Kanban card")

    response = superuser_client.get(f"/api/projects/{kanban_project.id}/kanban")

    assert response.status_code == 200
    board = response.json()["data"]["board"]
    todo_column = next(c for c in board["columns"] if c["status_slug"] == "todo")
    assert todo_column["count"] == 1


@pytest.mark.django_db
def test_sprint_board_selector(project, superuser, create_test_issue):
    sprint = sprint_service.create_sprint(user=superuser, project_id=project.id, name="Board Sprint")
    sprint_issue = create_test_issue(title="Sprint board card", sprint_id=sprint.id)
    create_test_issue(title="Backlog only")

    board = get_sprint_kanban(sprint.id)
    issue_keys = [
        issue.key for column in board["columns"] for issue in column["issues"]
    ]

    assert len(issue_keys) == 1
    assert issue_keys[0] == sprint_issue.key


@pytest.mark.django_db
def test_sprint_board_api(superuser_client, project, superuser, create_test_issue):
    sprint = sprint_service.create_sprint(user=superuser, project_id=project.id, name="API Sprint")
    sprint_issue = create_test_issue(title="On sprint board", sprint_id=sprint.id)
    create_test_issue(title="Backlog only")

    response = superuser_client.get(f"/api/sprints/{sprint.id}/board")

    assert response.status_code == 200
    board = response.json()["data"]["board"]
    assert board["project_id"] == str(project.id)
    total_count = sum(column.get("count", 0) for column in board["columns"])
    assert total_count == 1
    assert board["selected_sprint"]["id"] == str(sprint.id)


@pytest.mark.django_db
def test_project_sprint_board_api(superuser_client, project, superuser, create_test_issue):
    sprint = sprint_service.create_sprint(user=superuser, project_id=project.id, name="Project API Sprint")
    sprint_issue = create_test_issue(title="On project sprint board", sprint_id=sprint.id)
    create_test_issue(title="Backlog only")

    response = superuser_client.get(
        f"/api/projects/{project.id}/sprints/{sprint.id}/board",
    )

    assert response.status_code == 200
    board = response.json()["data"]["board"]
    assert board["project_id"] == str(project.id)
    total_count = sum(column.get("count", 0) for column in board["columns"])
    assert total_count == 1
    assert board["selected_sprint"]["id"] == str(sprint.id)


@pytest.mark.django_db
def test_project_board_column_includes_issue_sprint(
    superuser_client,
    project,
    superuser,
    create_test_issue,
    status_ids,
):
    sprint = sprint_service.create_sprint(user=superuser, project_id=project.id, name="Sprint 6")
    sprint_service.start_sprint(user=superuser, sprint_id=sprint.id)
    sprint_issue = create_test_issue(title="Sprint card", sprint_id=sprint.id)
    create_test_issue(title="Backlog card")

    board_response = superuser_client.get(f"/api/projects/{project.id}/board")
    todo_column = next(
        column
        for column in board_response.json()["data"]["board"]["columns"]
        if column["status_slug"] == "todo"
    )

    response = superuser_client.get(
        f"/api/projects/{project.id}/board/columns/{todo_column['status_id']}",
    )

    assert response.status_code == 200
    issues_by_key = {issue["key"]: issue for issue in response.json()["data"]["issues"]}
    assert sprint_issue.key in issues_by_key
    assert issues_by_key[sprint_issue.key]["sprint"] == {
        "id": str(sprint.id),
        "name": "Sprint 6",
    }
    assert len(issues_by_key) == 1


@pytest.mark.django_db
def test_project_board_column_pagination(
    superuser_client,
    kanban_project,
    create_test_issue,
    status_ids,
):
    for index in range(5):
        create_test_issue(project_id=kanban_project.id, title=f"Paginated card {index}")

    board_response = superuser_client.get(f"/api/projects/{kanban_project.id}/board")
    assert board_response.status_code == 200
    todo_column = next(
        column
        for column in board_response.json()["data"]["board"]["columns"]
        if column["status_slug"] == "todo"
    )

    response = superuser_client.get(
        f"/api/projects/{kanban_project.id}/board/columns/{todo_column['status_id']}",
        {"page": 1, "page_size": 2},
    )

    assert response.status_code == 200
    payload = response.json()["data"]
    assert payload["page"] == 1
    assert payload["page_size"] == 2
    assert payload["total"] >= 5
    assert payload["has_next"] is True
    assert len(payload["issues"]) == 2


@pytest.mark.django_db
def test_sprint_board_column_pagination(
    superuser_client,
    project,
    superuser,
    create_test_issue,
):
    sprint = sprint_service.create_sprint(user=superuser, project_id=project.id, name="Paginated sprint")
    for index in range(3):
        create_test_issue(title=f"Sprint card {index}", sprint_id=sprint.id)

    board_response = superuser_client.get(
        f"/api/projects/{project.id}/sprints/{sprint.id}/board",
    )
    todo_column = next(
        column
        for column in board_response.json()["data"]["board"]["columns"]
        if column["status_slug"] == "todo"
    )

    response = superuser_client.get(
        f"/api/projects/{project.id}/sprints/{sprint.id}/board/columns/{todo_column['status_id']}",
        {"page": 1, "page_size": 2},
    )

    assert response.status_code == 200
    payload = response.json()["data"]
    assert payload["total"] == 3
    assert payload["has_next"] is True
    assert len(payload["issues"]) == 2


@pytest.mark.django_db
def test_board_column_default_page_size(
    superuser_client,
    kanban_project,
    create_test_issue,
):
    for index in range(20):
        create_test_issue(project_id=kanban_project.id, title=f"Default page card {index}")

    board_response = superuser_client.get(f"/api/projects/{kanban_project.id}/board")
    todo_column = next(
        column
        for column in board_response.json()["data"]["board"]["columns"]
        if column["status_slug"] == "todo"
    )

    response = superuser_client.get(
        f"/api/projects/{kanban_project.id}/board/columns/{todo_column['status_id']}",
    )

    assert response.status_code == 200
    payload = response.json()["data"]
    assert payload["page"] == 1
    assert payload["page_size"] == 15
    assert len(payload["issues"]) == 15
    assert payload["has_next"] is True


@pytest.mark.django_db
def test_move_sprint_via_service_updates_backlog(project, superuser, create_test_issue):
    sprint = sprint_service.create_sprint(user=superuser, project_id=project.id, name="Move target")
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
