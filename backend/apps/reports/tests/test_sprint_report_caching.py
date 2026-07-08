"""
Caching tests for the Sprint Report endpoint.

Verifies:
- Cache miss → compute → cache hit
- Cache invalidation on issue save
- Selector not called on cache hit
"""
import pytest
from django.urls import reverse
from django.core.cache import cache
from unittest.mock import patch
from apps.sprints.models import Sprint, SprintStatus, SprintSnapshot, SprintIssueCommitment
from apps.projects.models import Project


@pytest.mark.django_db
def test_sprint_report_cache_and_invalidation(developer_client, project, superuser, create_test_issue, status_ids):
    """Verify sprint report is cached and invalidated on issue changes."""
    cache.clear()

    project_obj = Project.objects.get(pk=project.id)
    sprint = Sprint.objects.create(
        project=project_obj,
        name="Sprint Cache",
        start_date="2026-07-01",
        end_date="2026-07-10",
        status=SprintStatus.ACTIVE,
    )

    issue = create_test_issue(sprint_id=sprint.id, story_points=5)
    snapshot = SprintSnapshot.objects.create(sprint=sprint, snapshot_type="start")
    from apps.workflow.models import WorkflowStatus
    todo_status = WorkflowStatus.objects.get(pk=status_ids["todo"])
    SprintIssueCommitment.objects.create(
        snapshot=snapshot, issue=issue,
        committed_story_points=5, committed_status=todo_status,
    )

    url = reverse("project-report-sprint-report", kwargs={"project_id": project.id})
    sprint_url = f"{url}?sprint_id={sprint.id}"

    cache_key = f"reports:proj:{project.id}:sprint-report:{sprint.id}"

    # 1. Cache should be empty initially
    assert cache.get(cache_key) is None

    # 2. First request populates the cache
    res = developer_client.get(sprint_url)
    assert res.status_code == 200

    cached = cache.get(cache_key)
    assert cached is not None
    assert cached["summary"]["committed_story_points"] == 5

    # 3. Second request uses cache (selector NOT called)
    with patch("apps.reports.selectors.get_sprint_data_for_sprint_report") as mock_selector:
        res = developer_client.get(sprint_url)
        assert res.status_code == 200
        mock_selector.assert_not_called()

    # 4. Issue update invalidates cache
    issue.story_points = 10
    issue.save()

    assert cache.get(cache_key) is None


@pytest.mark.django_db
def test_sprint_report_cache_ttl_active(developer_client, project, superuser, create_test_issue, status_ids):
    """Active sprint cache TTL should be 1 hour (3600 seconds)."""
    cache.clear()

    project_obj = Project.objects.get(pk=project.id)
    sprint = Sprint.objects.create(
        project=project_obj,
        name="Sprint TTL Active",
        start_date="2026-07-01",
        end_date="2026-07-10",
        status=SprintStatus.ACTIVE,
    )

    issue = create_test_issue(sprint_id=sprint.id, story_points=3)
    snapshot = SprintSnapshot.objects.create(sprint=sprint, snapshot_type="start")
    from apps.workflow.models import WorkflowStatus
    todo_status = WorkflowStatus.objects.get(pk=status_ids["todo"])
    SprintIssueCommitment.objects.create(
        snapshot=snapshot, issue=issue,
        committed_story_points=3, committed_status=todo_status,
    )

    url = reverse("project-report-sprint-report", kwargs={"project_id": project.id})

    with patch("apps.reports.services.report_service.cache") as mock_cache:
        mock_cache.get.return_value = None  # Force cache miss
        res = developer_client.get(f"{url}?sprint_id={sprint.id}")
        assert res.status_code == 200

        # Verify cache.set was called with TTL of 3600
        mock_cache.set.assert_called_once()
        _, kwargs = mock_cache.set.call_args
        if kwargs:
            assert kwargs.get("timeout") == 3600
        else:
            args = mock_cache.set.call_args[0]
            assert args[2] == 3600  # timeout positional arg
