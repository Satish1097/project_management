import pytest

from apps.projects.services import archive_project
from apps.sprints.models import Sprint, SprintStatus


@pytest.mark.django_db
def test_create_issue_success(superuser_client, project, issue_payload):
    response = superuser_client.post(
        f"/api/projects/{project.id}/issues",
        issue_payload,
        format="json",
    )

    assert response.status_code == 201
    issue = response.json()["data"]["issue"]
    assert issue["key"] == "HRMS-1"
    assert issue["title"] == issue_payload["title"]
    assert issue["status"]["slug"] == "todo"


@pytest.mark.django_db
def test_create_issue_archived_project_returns_403(
    superuser_client,
    superuser,
    project,
    issue_payload,
):
    archive_project(project_id=project.id, actor=superuser)

    response = superuser_client.post(
        f"/api/projects/{project.id}/issues",
        issue_payload,
        format="json",
    )

    assert response.status_code == 403
    assert response.json()["success"] is False


@pytest.mark.django_db
def test_create_issue_key_generation(superuser_client, project, issue_payload):
    first = superuser_client.post(
        f"/api/projects/{project.id}/issues",
        issue_payload,
        format="json",
    )
    second = superuser_client.post(
        f"/api/projects/{project.id}/issues",
        {**issue_payload, "title": "Second issue"},
        format="json",
    )

    assert first.json()["data"]["issue"]["key"] == "HRMS-1"
    assert second.json()["data"]["issue"]["key"] == "HRMS-2"


@pytest.mark.django_db
def test_create_subtask_requires_parent(superuser_client, project, create_test_issue):
    parent = create_test_issue(title="Parent task")

    response = superuser_client.post(
        f"/api/projects/{project.id}/issues",
        {
            "title": "Orphan subtask",
            "issue_type": "subtask",
        },
        format="json",
    )

    assert response.status_code == 400

    response = superuser_client.post(
        f"/api/projects/{project.id}/issues",
        {
            "title": "Valid subtask",
            "issue_type": "subtask",
            "parent_issue_id": str(parent.id),
        },
        format="json",
    )

    assert response.status_code == 201
    assert response.json()["data"]["issue"]["parent_issue_id"] == str(parent.id)


@pytest.mark.django_db
def test_subtask_same_project_parent_enforcement(
    superuser_client,
    superuser,
    organization,
    project,
    create_test_issue,
):
    from apps.projects.services import create_project

    other_project = create_project(
        organization=organization.id,
        name="Other Project",
        key="OTH",
        slug="other-project",
        creator=superuser,
    )
    foreign_parent = create_test_issue(project_id=other_project.id, title="Foreign parent")

    response = superuser_client.post(
        f"/api/projects/{project.id}/issues",
        {
            "title": "Cross-project subtask",
            "issue_type": "subtask",
            "parent_issue_id": str(foreign_parent.id),
        },
        format="json",
    )

    assert response.status_code == 400


@pytest.mark.django_db
def test_scrum_kanban_api_returns_only_active_sprint_issues(
    superuser_client,
    project,
    create_test_issue,
):
    from apps.sprints.models import Sprint, SprintStatus

    active_sprint = Sprint.objects.create(
        project_id=project.id,
        name="Active Sprint",
        status=SprintStatus.ACTIVE,
    )
    planned_sprint = Sprint.objects.create(project_id=project.id, name="Planned Sprint")
    create_test_issue(title="Active sprint card", sprint_id=active_sprint.id)
    create_test_issue(title="Planned sprint card", sprint_id=planned_sprint.id)
    create_test_issue(title="Backlog card")

    response = superuser_client.get(f"/api/projects/{project.id}/kanban")

    assert response.status_code == 200
    board = response.json()["data"]["board"]
    total_count = sum(column.get("count", 0) for column in board["columns"])
    assert total_count == 1
    assert board["selected_sprint"]["id"] == str(active_sprint.id)
    assert board["has_active_sprint"] is True
    assert board["methodology"] == "scrum"


@pytest.mark.django_db
def test_scrum_kanban_api_empty_when_no_active_sprint(
    superuser_client,
    project,
    create_test_issue,
):
    from apps.sprints.models import Sprint

    planned_sprint = Sprint.objects.create(project_id=project.id, name="Planned Sprint")
    create_test_issue(title="Planned sprint card", sprint_id=planned_sprint.id)
    create_test_issue(title="Backlog card")

    response = superuser_client.get(f"/api/projects/{project.id}/kanban")

    assert response.status_code == 200
    board = response.json()["data"]["board"]
    total_count = sum(column.get("count", 0) for column in board["columns"])
    assert total_count == 0
    assert board["selected_sprint"] is None
    assert board["has_active_sprint"] is False
    assert board["methodology"] == "scrum"


@pytest.mark.django_db
def test_scrum_kanban_api_selected_sprint_param(
    superuser_client,
    project,
    create_test_issue,
):
    from apps.sprints.models import Sprint, SprintStatus

    first_active = Sprint.objects.create(
        project_id=project.id,
        name="Sprint A",
        status=SprintStatus.ACTIVE,
    )
    second_active = Sprint.objects.create(
        project_id=project.id,
        name="Sprint B",
        status=SprintStatus.ACTIVE,
    )
    first_issue = create_test_issue(title="Sprint A card", sprint_id=first_active.id)
    create_test_issue(title="Sprint B card", sprint_id=second_active.id)

    response = superuser_client.get(
        f"/api/projects/{project.id}/kanban",
        {"sprint": str(first_active.id)},
    )

    assert response.status_code == 200
    board = response.json()["data"]["board"]
    total_count = sum(column.get("count", 0) for column in board["columns"])
    assert total_count == 1
    assert board["selected_sprint"]["id"] == str(first_active.id)


@pytest.mark.django_db
def test_kanban_methodology_board_returns_all_issues(
    superuser_client,
    kanban_project,
    create_test_issue,
):
    from apps.sprints.models import Sprint, SprintStatus

    active_sprint = Sprint.objects.create(
        project_id=kanban_project.id,
        name="Active Sprint",
        status=SprintStatus.ACTIVE,
    )
    planned_sprint = Sprint.objects.create(project_id=kanban_project.id, name="Planned Sprint")

    def _create(**kwargs):
        return create_test_issue(project_id=kanban_project.id, **kwargs)

    _create(title="Active sprint card", sprint_id=active_sprint.id)
    _create(title="Planned sprint card", sprint_id=planned_sprint.id)
    _create(title="Backlog card")

    response = superuser_client.get(f"/api/projects/{kanban_project.id}/kanban")

    assert response.status_code == 200
    board = response.json()["data"]["board"]
    total_count = sum(column.get("count", 0) for column in board["columns"])
    assert total_count == 3
    assert board["selected_sprint"] is None
    assert board["has_active_sprint"] is True
    assert board["methodology"] == "kanban"


@pytest.mark.django_db
def test_kanban_api_includes_filter_metadata(
    superuser_client,
    project,
    superuser,
    create_test_issue,
):
    create_test_issue(title="Filtered card")

    response = superuser_client.get(f"/api/projects/{project.id}/kanban")

    assert response.status_code == 200
    filters = response.json()["data"]["board"]["filters"]
    assert "assignees" in filters
    assert "statuses" in filters
    assert "labels" in filters
    assert "priorities" in filters

    assignee_ids = {item["id"] for item in filters["assignees"]}
    assert {"all", "unassigned", str(superuser.id)} <= assignee_ids

    status_names = {item["name"] for item in filters["statuses"]}
    assert "All" in status_names
    assert "To Do" in status_names or "Todo" in status_names

    priority_ids = {item["id"] for item in filters["priorities"]}
    assert priority_ids == {"all", "low", "medium", "high", "critical"}


@pytest.mark.django_db
def test_kanban_filters_endpoint_returns_metadata(
    superuser_client,
    project,
    superuser,
):
    response = superuser_client.get(f"/api/projects/{project.id}/kanban/filters")

    assert response.status_code == 200
    filters = response.json()["data"]["filters"]
    assert any(item["id"] == str(superuser.id) for item in filters["assignees"])
    assert filters["statuses"][0]["id"] == "all"
    assert len(filters["statuses"]) > 1


@pytest.mark.django_db
def test_assign_issue_success(developer_client, project_with_roles, user, create_test_issue):
    issue = create_test_issue()

    response = developer_client.post(
        f"/api/issues/{issue.id}/assign",
        {"assignee_id": str(user.id)},
        format="json",
    )

    assert response.status_code == 200
    assert response.json()["data"]["issue"]["assignee"]["id"] == str(user.id)


@pytest.mark.django_db
def test_viewer_cannot_assign(viewer_client, project_with_roles, user, create_test_issue):
    issue = create_test_issue()

    response = viewer_client.post(
        f"/api/issues/{issue.id}/assign",
        {"assignee_id": str(user.id)},
        format="json",
    )

    assert response.status_code == 403
