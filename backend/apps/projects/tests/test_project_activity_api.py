import pytest

from apps.issues.models.activity import IssueActivity, IssueActivityEventType
from apps.issues.services.issue_service import issue_service


@pytest.mark.django_db
def test_project_activity_preview_returns_latest_five(
    manager_client,
    project_with_manager,
    superuser,
):
    for index in range(7):
        issue = issue_service.create_issue(
            user=superuser,
            project_id=project_with_manager.id,
            title=f"Activity issue {index}",
        )
        IssueActivity.objects.create(
            issue=issue,
            actor=superuser,
            event_type=IssueActivityEventType.STATUS_CHANGED,
            old_value="To Do",
            new_value="In Progress",
        )

    response = manager_client.get(
        f"/api/projects/{project_with_manager.id}/activity",
        {"limit": 5},
    )

    assert response.status_code == 200
    activities = response.json()["data"]["activities"]
    assert len(activities) == 5
    timestamps = [activity["timestamp"] for activity in activities]
    assert timestamps == sorted(timestamps, reverse=True)


@pytest.mark.django_db
def test_project_activity_preview_includes_backlog_issues(
    manager_client,
    project_with_manager,
    superuser,
):
    issue = issue_service.create_issue(
        user=superuser,
        project_id=project_with_manager.id,
        title="Backlog activity issue",
    )
    IssueActivity.objects.create(
        issue=issue,
        actor=superuser,
        event_type=IssueActivityEventType.COMMENT_ADDED,
        new_value="Hello",
    )

    response = manager_client.get(
        f"/api/projects/{project_with_manager.id}/activity",
    )

    assert response.status_code == 200
    activities = response.json()["data"]["activities"]
    assert len(activities) >= 1
    assert activities[0]["event_type"] == "comment_added"
    assert activities[0]["issue"]["key"] == issue.key


@pytest.mark.django_db
def test_project_activity_paginated_returns_results(
    manager_client,
    project_with_manager,
    superuser,
):
    for index in range(12):
        issue = issue_service.create_issue(
            user=superuser,
            project_id=project_with_manager.id,
            title=f"Paginated activity issue {index}",
        )
        IssueActivity.objects.create(
            issue=issue,
            actor=superuser,
            event_type=IssueActivityEventType.STATUS_CHANGED,
            old_value="To Do",
            new_value="Done",
        )

    response = manager_client.get(
        f"/api/projects/{project_with_manager.id}/activity",
        {"page": 1},
    )

    assert response.status_code == 200
    payload = response.json()["data"]
    assert len(payload["results"]) == 10
    assert payload["pagination"]["count"] >= 12
    assert payload["pagination"]["page"] == 1
    assert payload["pagination"]["page_size"] == 10
    assert payload["pagination"]["total_pages"] >= 2
    assert payload["pagination"]["next"] is not None
    assert payload["pagination"]["previous"] is None

    timestamps = [activity["timestamp"] for activity in payload["results"]]
    assert timestamps == sorted(timestamps, reverse=True)


@pytest.mark.django_db
def test_project_activity_paginated_second_page(
    manager_client,
    project_with_manager,
    superuser,
):
    for index in range(12):
        issue = issue_service.create_issue(
            user=superuser,
            project_id=project_with_manager.id,
            title=f"Second page activity {index}",
        )
        IssueActivity.objects.create(
            issue=issue,
            actor=superuser,
            event_type=IssueActivityEventType.STATUS_CHANGED,
            old_value="To Do",
            new_value="Done",
        )

    response = manager_client.get(
        f"/api/projects/{project_with_manager.id}/activity",
        {"page": 2, "page_size": 10},
    )

    assert response.status_code == 200
    payload = response.json()["data"]
    assert len(payload["results"]) == 2
    assert payload["pagination"]["page"] == 2
    assert payload["pagination"]["previous"] is not None
    assert payload["pagination"]["next"] is None


@pytest.mark.django_db
def test_project_activity_paginated_respects_custom_page_size(
    manager_client,
    project_with_manager,
    superuser,
):
    for index in range(5):
        issue = issue_service.create_issue(
            user=superuser,
            project_id=project_with_manager.id,
            title=f"Custom page size activity {index}",
        )
        IssueActivity.objects.create(
            issue=issue,
            actor=superuser,
            event_type=IssueActivityEventType.ASSIGNEE_CHANGED,
            old_value=None,
            new_value=str(superuser.id),
        )

    response = manager_client.get(
        f"/api/projects/{project_with_manager.id}/activity",
        {"page_size": 3},
    )

    assert response.status_code == 200
    payload = response.json()["data"]
    assert len(payload["results"]) == 3
    assert payload["pagination"]["page_size"] == 3
    assert payload["pagination"]["count"] >= 5


@pytest.mark.django_db
def test_dashboard_activity_respects_limit(
    manager_client,
    project_with_manager,
    superuser,
):
    for index in range(6):
        issue = issue_service.create_issue(
            user=superuser,
            project_id=project_with_manager.id,
            title=f"Dashboard activity {index}",
        )
        IssueActivity.objects.create(
            issue=issue,
            actor=superuser,
            event_type=IssueActivityEventType.ASSIGNEE_CHANGED,
            old_value=None,
            new_value=str(superuser.id),
        )

    response = manager_client.get("/api/dashboard/activity", {"limit": 5})

    assert response.status_code == 200
    activities = response.json()["data"]["activities"]
    assert len(activities) == 5


@pytest.mark.django_db
def test_dashboard_activity_paginated_returns_results(
    manager_client,
    project_with_manager,
    superuser,
):
    for index in range(12):
        issue = issue_service.create_issue(
            user=superuser,
            project_id=project_with_manager.id,
            title=f"Dashboard paginated activity {index}",
        )
        IssueActivity.objects.create(
            issue=issue,
            actor=superuser,
            event_type=IssueActivityEventType.STATUS_CHANGED,
            old_value="To Do",
            new_value="Done",
        )

    response = manager_client.get("/api/dashboard/activity", {"page": 1})

    assert response.status_code == 200
    payload = response.json()["data"]
    assert len(payload["results"]) == 10
    assert payload["pagination"]["count"] >= 12
    assert payload["pagination"]["page"] == 1
    assert payload["pagination"]["page_size"] == 10
    assert payload["pagination"]["next"] is not None
    assert payload["pagination"]["previous"] is None


@pytest.mark.django_db
def test_dashboard_activity_filter_comments(
    manager_client,
    project_with_manager,
    superuser,
):
    status_issue = issue_service.create_issue(
        user=superuser,
        project_id=project_with_manager.id,
        title="Status activity issue",
    )
    IssueActivity.objects.create(
        issue=status_issue,
        actor=superuser,
        event_type=IssueActivityEventType.STATUS_CHANGED,
        old_value="To Do",
        new_value="Done",
    )

    comment_issue = issue_service.create_issue(
        user=superuser,
        project_id=project_with_manager.id,
        title="Comment activity issue",
    )
    IssueActivity.objects.create(
        issue=comment_issue,
        actor=superuser,
        event_type=IssueActivityEventType.COMMENT_ADDED,
        new_value="Hello",
    )

    response = manager_client.get(
        "/api/dashboard/activity",
        {"page": 1, "filter": "comments"},
    )

    assert response.status_code == 200
    payload = response.json()["data"]
    assert len(payload["results"]) == 1
    assert payload["results"][0]["event_type"] == "comment_added"
