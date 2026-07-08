import pytest

pytest_plugins = ["apps.issues.tests.conftest"]

from apps.issues.selectors import get_project_board_metadata
from apps.projects.services.board_config_service import update_kanban_board_config
from apps.workflow.selectors import get_project_statuses


@pytest.mark.django_db
def test_board_config_api_get_defaults(kanban_project, superuser_client):
    response = superuser_client.get(f"/api/projects/{kanban_project.id}/board-config")

    assert response.status_code == 200
    columns = response.json()["data"]["board_config"]["columns"]
    statuses = list(get_project_statuses(kanban_project.id))
    assert len(columns) == len(statuses)
    assert all(column["is_enabled"] is True for column in columns)
    assert all(column["wip_limit"] is None for column in columns)


@pytest.mark.django_db
def test_board_config_api_rejects_scrum_project(project, superuser_client):
    response = superuser_client.get(f"/api/projects/{project.id}/board-config")

    assert response.status_code == 400
    assert response.json()["errors"]["code"] == "methodology_not_supported"


@pytest.fixture
def kanban_status_ids(kanban_project):
    from apps.workflow.selectors import select_status_by_slug

    slugs = ("todo", "in_progress", "in_review", "done", "blocked")
    return {
        slug: select_status_by_slug(kanban_project.id, slug).id
        for slug in slugs
    }


@pytest.mark.django_db
def test_board_config_update_wip_and_visibility(
    kanban_project,
    superuser_client,
    kanban_status_ids,
):
    statuses = list(get_project_statuses(kanban_project.id))
    payload = {
        "columns": [
            {
                "status_id": str(status.id),
                "wip_limit": 5 if status.id == kanban_status_ids["in_progress"] else None,
                "is_enabled": status.id != kanban_status_ids["blocked"],
                "display_order": index,
            }
            for index, status in enumerate(statuses)
        ]
    }

    response = superuser_client.put(
        f"/api/projects/{kanban_project.id}/board-config",
        payload,
        format="json",
    )

    assert response.status_code == 200
    columns = response.json()["data"]["board_config"]["columns"]
    in_progress = next(c for c in columns if c["status_slug"] == "in_progress")
    blocked = next(c for c in columns if c["status_slug"] == "blocked")
    assert in_progress["wip_limit"] == 5
    assert blocked["is_enabled"] is False


@pytest.mark.django_db
def test_kanban_board_metadata_includes_wip_fields(
    kanban_project,
    superuser_client,
    kanban_status_ids,
):
    statuses = list(get_project_statuses(kanban_project.id))
    update_kanban_board_config(
        kanban_project.id,
        [
            {
                "status_id": str(status.id),
                "wip_limit": 1 if status.id == kanban_status_ids["in_progress"] else None,
                "is_enabled": True,
                "display_order": index,
            }
            for index, status in enumerate(statuses)
        ],
    )

    response = superuser_client.get(f"/api/projects/{kanban_project.id}/kanban")
    assert response.status_code == 200
    board = response.json()["data"]["board"]
    in_progress = next(c for c in board["columns"] if c["status_slug"] == "in_progress")
    assert in_progress["wip_limit"] == 1
    assert in_progress["wip_count"] == 0
    assert in_progress["count"] == 0


@pytest.mark.django_db
def test_kanban_board_metadata_selector_exposes_wip_fields(
    kanban_project,
    kanban_status_ids,
):
    statuses = list(get_project_statuses(kanban_project.id))
    update_kanban_board_config(
        kanban_project.id,
        [
            {
                "status_id": str(status.id),
                "wip_limit": 3,
                "is_enabled": True,
                "display_order": index,
            }
            for index, status in enumerate(statuses)
        ],
    )

    board = get_project_board_metadata(kanban_project.id)
    in_progress = next(
        column
        for column in board["columns"]
        if column["status"].id == kanban_status_ids["in_progress"]
    )
    assert in_progress["wip_limit"] == 3
    assert in_progress["wip_count"] == 0
    assert in_progress["count"] == 0


@pytest.mark.django_db
def test_scrum_board_metadata_omits_wip_fields(project, superuser_client):
    response = superuser_client.get(f"/api/projects/{project.id}/kanban")
    assert response.status_code == 200
    board = response.json()["data"]["board"]
    assert board["methodology"] == "scrum"
    assert len(board["columns"]) > 0
    for column in board["columns"]:
        assert "wip_limit" not in column
        assert "wip_count" not in column


@pytest.mark.django_db
def test_kanban_board_hides_disabled_columns(
    kanban_project,
    superuser_client,
    kanban_status_ids,
):
    statuses = list(get_project_statuses(kanban_project.id))
    update_kanban_board_config(
        kanban_project.id,
        [
            {
                "status_id": str(status.id),
                "wip_limit": None,
                "is_enabled": status.id != kanban_status_ids["blocked"],
                "display_order": index,
            }
            for index, status in enumerate(statuses)
        ],
    )

    response = superuser_client.get(f"/api/projects/{kanban_project.id}/kanban")
    slugs = [column["status_slug"] for column in response.json()["data"]["board"]["columns"]]
    assert "blocked" not in slugs
