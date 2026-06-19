import pytest

from apps.issues.models import Issue
from apps.issues.services.issue_service import move_issue_to_sprint
from apps.sprints.selectors import get_sprint_metrics
from apps.sprints.services.sprint_service import create_sprint, start_sprint
from apps.workflow.services.transition_service import transition_service


def _transition(issue_id, slug: str, actor_id):
    issue = Issue.objects.select_related("status").get(pk=issue_id)
    transition_service.transition_issue(issue, slug, actor_id)


@pytest.mark.django_db
def test_get_sprint_metrics_uses_done_category(project, superuser, create_test_issue):
    sprint = create_sprint(
        project_id=project.id,
        name="Sprint 3",
        actor_id=superuser.id,
    )
    start_sprint(sprint_id=sprint.id, actor_id=superuser.id)

    issues = [create_test_issue(title=f"Issue {index}") for index in range(1, 7)]
    for issue in issues:
        move_issue_to_sprint(
            issue_id=issue.id,
            sprint_id=sprint.id,
            actor_id=superuser.id,
        )

    _transition(issues[0].id, "done", superuser.id)
    _transition(issues[1].id, "in_progress", superuser.id)
    _transition(issues[2].id, "in_review", superuser.id)

    metrics = get_sprint_metrics(sprint.id)

    assert metrics is not None
    assert metrics["total_issues"] == 6
    assert metrics["completed_issues"] == 1
    assert metrics["remaining_issues"] == 5
    assert metrics["in_progress_issues"] == 2
    assert metrics["progress_percentage"] == 17


@pytest.mark.django_db
def test_sprint_list_api_returns_consistent_metrics(
    manager_client,
    project_with_manager,
    superuser,
    create_test_issue,
):
    sprint = create_sprint(
        project_id=project_with_manager.id,
        name="Sprint 3",
        actor_id=superuser.id,
    )
    start_sprint(sprint_id=sprint.id, actor_id=superuser.id)

    issues = [create_test_issue(title=f"Issue {index}") for index in range(1, 7)]
    for issue in issues:
        move_issue_to_sprint(
            issue_id=issue.id,
            sprint_id=sprint.id,
            actor_id=superuser.id,
        )

    _transition(issues[0].id, "done", superuser.id)

    response = manager_client.get(
        f"/api/projects/{project_with_manager.id}/sprints",
    )

    assert response.status_code == 200
    sprint_payload = next(
        item
        for item in response.json()["data"]["sprints"]
        if item["id"] == str(sprint.id)
    )
    assert sprint_payload["total_issues"] == 6
    assert sprint_payload["completed_issues"] == 1
    assert sprint_payload["remaining_issues"] == 5
    assert sprint_payload["progress_percentage"] == 17
    assert sprint_payload["issue_count"] == sprint_payload["total_issues"]
    assert sprint_payload["completed_issue_count"] == sprint_payload["completed_issues"]
