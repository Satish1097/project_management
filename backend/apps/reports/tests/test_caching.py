import pytest
from django.urls import reverse
from django.core.cache import cache
from unittest.mock import patch
from apps.sprints.models import Sprint, SprintStatus, SprintSnapshot, SprintIssueCommitment
from apps.projects.models import Project


@pytest.mark.django_db
def test_burndown_cache_and_invalidation(developer_client, project, superuser, create_test_issue, status_ids):
    """Verify endpoint is cached and invalidated on issue changes."""
    # Ensure cache is clear
    cache.clear()

    project_obj = Project.objects.get(pk=project.id)
    sprint = Sprint.objects.create(
        project=project_obj,
        name="Sprint 1",
        start_date="2026-07-01",
        end_date="2026-07-10",
        status=SprintStatus.ACTIVE,
    )
    
    # Create issue and snapshot
    issue = create_test_issue(sprint_id=sprint.id, story_points=8)
    snapshot = SprintSnapshot.objects.create(sprint=sprint, snapshot_type="start")
    from apps.workflow.models import WorkflowStatus
    todo_status = WorkflowStatus.objects.get(pk=status_ids["todo"])
    SprintIssueCommitment.objects.create(
        snapshot=snapshot,
        issue=issue,
        committed_story_points=8,
        committed_status=todo_status,
    )

    url = reverse("project-report-burndown", kwargs={"project_id": project.id})
    sprint_url = f"{url}?sprint_id={sprint.id}"

    # First request - cache miss, should fetch and write
    cache_key = f"reports:proj:{project.id}:burndown:{sprint.id}"
    assert cache.get(cache_key) is None

    res = developer_client.get(sprint_url)
    assert res.status_code == 200
    
    # Verify cache key is written
    cached = cache.get(cache_key)
    assert cached is not None
    assert cached["committed_points"] == 8

    # Second request - intercept get_sprint_burndown to ensure selector is NOT called
    with patch("apps.reports.selectors.get_sprint_data_for_burndown") as mock_selector:
        res = developer_client.get(sprint_url)
        assert res.status_code == 200
        mock_selector.assert_not_called()

    # Invalidate cache by updating story points
    issue.story_points = 10
    issue.save()  # Triggers signal

    # Cache should now be empty
    assert cache.get(cache_key) is None
