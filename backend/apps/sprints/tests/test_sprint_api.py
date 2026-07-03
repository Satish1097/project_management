import pytest


SPRINT_PAYLOAD = {
    "name": "Sprint 1",
    "goal": "Auth and project shell",
    "start_date": "2026-06-10",
    "end_date": "2026-06-24",
}


@pytest.mark.django_db
def test_create_sprint_success(manager_client, project_with_manager):
    response = manager_client.post(
        f"/api/projects/{project_with_manager.id}/sprints",
        SPRINT_PAYLOAD,
        format="json",
    )

    assert response.status_code == 201
    sprint = response.json()["data"]["sprint"]
    assert sprint["name"] == SPRINT_PAYLOAD["name"]
    assert sprint["status"] == "planned"


@pytest.mark.django_db
def test_developer_cannot_start_sprint(
    developer_client,
    project_with_manager,
    superuser,
):
    from apps.sprints.services.sprint_service import create_sprint

    sprint = create_sprint(
        project_id=project_with_manager.id,
        name="Dev Sprint",
        actor_id=superuser.id,
    )

    response = developer_client.post(
        f"/api/sprints/{sprint.id}/start",
        format="json",
    )

    assert response.status_code == 403


@pytest.mark.django_db
def test_start_sprint_success(manager_client, project_with_manager):
    create = manager_client.post(
        f"/api/projects/{project_with_manager.id}/sprints",
        SPRINT_PAYLOAD,
        format="json",
    )
    sprint_id = create.json()["data"]["sprint"]["id"]

    response = manager_client.post(
        f"/api/projects/{project_with_manager.id}/sprints/{sprint_id}/start",
        format="json",
    )

    assert response.status_code == 200
    assert response.json()["data"]["sprint"]["status"] == "active"


@pytest.mark.django_db
def test_one_active_sprint_guard(manager_client, project_with_manager):
    first = manager_client.post(
        f"/api/projects/{project_with_manager.id}/sprints",
        SPRINT_PAYLOAD,
        format="json",
    )
    second = manager_client.post(
        f"/api/projects/{project_with_manager.id}/sprints",
        {**SPRINT_PAYLOAD, "name": "Sprint 2"},
        format="json",
    )
    first_id = first.json()["data"]["sprint"]["id"]
    second_id = second.json()["data"]["sprint"]["id"]

    manager_client.post(
        f"/api/projects/{project_with_manager.id}/sprints/{first_id}/start",
        format="json",
    )
    response = manager_client.post(
        f"/api/projects/{project_with_manager.id}/sprints/{second_id}/start",
        format="json",
    )

    assert response.status_code == 409


@pytest.mark.django_db
def test_complete_sprint_carry_forward_to_backlog(
    manager_client,
    project_with_manager,
    superuser,
    create_test_issue,
):
    from apps.issues.services.issue_service import issue_service

    create = manager_client.post(
        f"/api/projects/{project_with_manager.id}/sprints",
        SPRINT_PAYLOAD,
        format="json",
    )
    sprint_id = create.json()["data"]["sprint"]["id"]
    manager_client.post(
        f"/api/projects/{project_with_manager.id}/sprints/{sprint_id}/start",
        format="json",
    )

    incomplete = create_test_issue(title="Incomplete")
    issue_service.assign_sprint(superuser, incomplete.id, sprint_id)

    response = manager_client.post(
        f"/api/projects/{project_with_manager.id}/sprints/{sprint_id}/complete",
        {"move_incomplete_to": "backlog", "target_sprint_id": None},
        format="json",
    )

    assert response.status_code == 200
    assert response.json()["data"]["sprint"]["status"] == "completed"

    from apps.contracts.issue_contract import get_issue_by_id

    updated = get_issue_by_id(incomplete.id)
    assert updated.sprint_id is None


@pytest.mark.django_db
def test_complete_sprint_carry_forward_to_planned_sprint(
    manager_client,
    project_with_manager,
    superuser,
    create_test_issue,
):
    from apps.issues.services.issue_service import issue_service

    active = manager_client.post(
        f"/api/projects/{project_with_manager.id}/sprints",
        {**SPRINT_PAYLOAD, "name": "Active Sprint"},
        format="json",
    )
    planned = manager_client.post(
        f"/api/projects/{project_with_manager.id}/sprints",
        {**SPRINT_PAYLOAD, "name": "Next Sprint"},
        format="json",
    )
    active_id = active.json()["data"]["sprint"]["id"]
    planned_id = planned.json()["data"]["sprint"]["id"]

    manager_client.post(
        f"/api/projects/{project_with_manager.id}/sprints/{active_id}/start",
        format="json",
    )

    incomplete = create_test_issue(title="Carry forward")
    issue_service.assign_sprint(superuser, incomplete.id, active_id)

    response = manager_client.post(
        f"/api/projects/{project_with_manager.id}/sprints/{active_id}/complete",
        {
            "move_incomplete_to": "sprint",
            "target_sprint_id": planned_id,
        },
        format="json",
    )

    assert response.status_code == 200

    from apps.contracts.issue_contract import get_issue_by_id

    updated = get_issue_by_id(incomplete.id)
    assert str(updated.sprint_id) == planned_id


@pytest.mark.django_db
def test_completed_sprint_immutable(manager_client, project_with_manager):
    create = manager_client.post(
        f"/api/projects/{project_with_manager.id}/sprints",
        SPRINT_PAYLOAD,
        format="json",
    )
    sprint_id = create.json()["data"]["sprint"]["id"]
    manager_client.post(
        f"/api/projects/{project_with_manager.id}/sprints/{sprint_id}/start",
        format="json",
    )
    manager_client.post(
        f"/api/projects/{project_with_manager.id}/sprints/{sprint_id}/complete",
        {"move_incomplete_to": "backlog"},
        format="json",
    )

    response = manager_client.patch(
        f"/api/sprints/{sprint_id}",
        {"name": "Renamed"},
        format="json",
    )

    assert response.status_code == 400


@pytest.mark.django_db
def test_move_issues_between_sprints(
    manager_client,
    project_with_manager,
    superuser,
    create_test_issue,
):
    from apps.issues.services.issue_service import move_issue_to_sprint

    source = manager_client.post(
        f"/api/projects/{project_with_manager.id}/sprints",
        {**SPRINT_PAYLOAD, "name": "Source Sprint"},
        format="json",
    )
    target = manager_client.post(
        f"/api/projects/{project_with_manager.id}/sprints",
        {**SPRINT_PAYLOAD, "name": "Target Sprint"},
        format="json",
    )
    source_id = source.json()["data"]["sprint"]["id"]
    target_id = target.json()["data"]["sprint"]["id"]

    issue = create_test_issue(title="Bulk move")
    move_issue_to_sprint(
        issue_id=issue.id,
        sprint_id=source_id,
        actor_id=superuser.id,
    )

    response = manager_client.post(
        f"/api/sprints/{source_id}/move-issues",
        {"issue_ids": [str(issue.id)], "sprint_id": target_id},
        format="json",
    )

    assert response.status_code == 200
    assert response.json()["data"]["moved_count"] == 1

    from apps.contracts.issue_contract import get_issue_by_id

    updated = get_issue_by_id(issue.id)
    assert str(updated.sprint_id) == target_id


@pytest.mark.django_db
def test_sprint_activity_returns_issue_events(
    manager_client,
    project_with_manager,
    superuser,
):
    from apps.issues.models.activity import IssueActivity, IssueActivityEventType
    from apps.issues.services.issue_service import issue_service

    create = manager_client.post(
        f"/api/projects/{project_with_manager.id}/sprints",
        SPRINT_PAYLOAD,
        format="json",
    )
    sprint_id = create.json()["data"]["sprint"]["id"]

    issue = issue_service.create_issue(
        user=superuser,
        project_id=project_with_manager.id,
        title="Sprint activity issue",
    )
    issue_service.assign_sprint(
        user=superuser,
        issue_id=issue.id,
        sprint_id=sprint_id,
    )

    IssueActivity.objects.create(
        issue=issue,
        actor=superuser,
        event_type=IssueActivityEventType.COMMENT_ADDED,
        new_value="Looks good",
    )

    response = manager_client.get(
        f"/api/projects/{project_with_manager.id}/sprints/{sprint_id}/activity",
    )

    assert response.status_code == 200
    activities = response.json()["data"]["activities"]
    assert len(activities) >= 2
    event_types = {activity["event_type"] for activity in activities}
    assert "comment_added" in event_types
    assert "sprint_changed" in event_types
    assert all(activity["issue"]["id"] == str(issue.id) for activity in activities)


@pytest.mark.django_db
def test_sprint_activity_excludes_backlog_issues(
    manager_client,
    project_with_manager,
    superuser,
):
    from apps.issues.models.activity import IssueActivity, IssueActivityEventType
    from apps.issues.services.issue_service import issue_service

    create = manager_client.post(
        f"/api/projects/{project_with_manager.id}/sprints",
        SPRINT_PAYLOAD,
        format="json",
    )
    sprint_id = create.json()["data"]["sprint"]["id"]

    backlog_issue = issue_service.create_issue(
        user=superuser,
        project_id=project_with_manager.id,
        title="Backlog only",
    )
    IssueActivity.objects.create(
        issue=backlog_issue,
        actor=superuser,
        event_type=IssueActivityEventType.STATUS_CHANGED,
        old_value="To Do",
        new_value="In Progress",
    )

    response = manager_client.get(
        f"/api/projects/{project_with_manager.id}/sprints/{sprint_id}/activity",
    )

    assert response.status_code == 200
    assert response.json()["data"]["activities"] == []
