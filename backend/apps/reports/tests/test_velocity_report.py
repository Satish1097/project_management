from types import SimpleNamespace
from unittest.mock import patch

import pytest
from django.core.cache import cache
from django.urls import reverse
from rest_framework import status

from apps.issues.models import StoryPointHistory
from apps.projects.models import Project
from apps.reports.services.calculators import (
    DEFAULT_VELOCITY_ROLLING_WINDOW,
    VelocityCalculator,
)
from apps.reports.services.report_service import ReportService
from apps.sprints.models import Sprint, SprintIssueCommitment, SprintSnapshot, SprintStatus
from apps.workflow.models import WorkflowStatus, WorkflowStatusCategory


def _status(category):
    return SimpleNamespace(category=category, name=category)


def _commitment(points, category=WorkflowStatusCategory.TODO):
    return SimpleNamespace(
        committed_story_points=points,
        committed_status=_status(category),
    )


def _sprint(name, status=SprintStatus.COMPLETED):
    return SimpleNamespace(
        id=name,
        name=name,
        status=status,
        start_date=None,
        end_date=None,
        created_at=None,
    )


def _velocity_data(name, committed, completed, status=SprintStatus.COMPLETED):
    return {
        "sprint": _sprint(name, status),
        "start_commitments": [_commitment(points) for points in committed],
        "end_commitments": [
            _commitment(points, WorkflowStatusCategory.DONE)
            for points in completed
        ],
    }


@pytest.fixture
def done_status(status_ids):
    return WorkflowStatus.objects.get(pk=status_ids["done"])


@pytest.fixture
def todo_status(status_ids):
    return WorkflowStatus.objects.get(pk=status_ids["todo"])


def _create_snapshot(sprint, snapshot_type, issues, status_by_issue, points_by_issue):
    snapshot = SprintSnapshot.objects.create(sprint=sprint, snapshot_type=snapshot_type)
    SprintIssueCommitment.objects.bulk_create(
        [
            SprintIssueCommitment(
                snapshot=snapshot,
                issue=issue,
                committed_story_points=points_by_issue[issue.id],
                committed_status=status_by_issue[issue.id],
            )
            for issue in issues
        ]
    )
    return snapshot


def _create_completed_sprint(
    *,
    project,
    create_test_issue,
    todo_status,
    done_status,
    index,
    start_points,
    end_points,
    done_issue_indexes,
):
    sprint = Sprint.objects.create(
        project=project,
        name=f"Sprint {index}",
        start_date=f"2026-06-{index:02d}",
        end_date=f"2026-06-{index + 1:02d}",
        status=SprintStatus.COMPLETED,
    )
    issues = [
        create_test_issue(
            sprint_id=sprint.id,
            story_points=points,
            title=f"Sprint {index} issue {i}",
        )
        for i, points in enumerate(start_points)
    ]
    _create_snapshot(
        sprint,
        "start",
        issues,
        {issue.id: todo_status for issue in issues},
        {issue.id: start_points[i] for i, issue in enumerate(issues)},
    )
    _create_snapshot(
        sprint,
        "end",
        issues,
        {
            issue.id: done_status if i in done_issue_indexes else todo_status
            for i, issue in enumerate(issues)
        },
        {issue.id: end_points[i] for i, issue in enumerate(issues)},
    )
    return sprint, issues


@pytest.mark.parametrize(
    ("sprint_data", "expected_average", "expected_rolling", "expected_trend"),
    [
        ([], 0.0, 0.0, "stable"),
        (
            [
                _velocity_data("s1", [5], [5]),
                _velocity_data("s2", [8], [8]),
                _velocity_data("s3", [13], [13]),
            ],
            8.67,
            8.67,
            "up",
        ),
    ],
)
def test_velocity_calculator_empty_and_multiple_completed_sprints(
    sprint_data,
    expected_average,
    expected_rolling,
    expected_trend,
):
    report = VelocityCalculator().calculate_velocity(sprint_data)

    assert report["metrics"]["average_velocity"] == expected_average
    assert report["rolling_average"]["value"] == expected_rolling
    assert report["trend"]["direction"] == expected_trend
    assert report["sprint_summary"]["rolling_window"] == DEFAULT_VELOCITY_ROLLING_WINDOW


def test_velocity_calculator_excludes_cancelled_from_average_rolling_and_trend():
    report = VelocityCalculator().calculate_velocity(
        [
            _velocity_data("s1", [5], [5]),
            _velocity_data("cancelled", [100], [100], SprintStatus.CANCELLED),
            _velocity_data("s2", [8], [3]),
        ]
    )

    assert report["sprint_summary"]["total_sprints"] == 3
    assert report["sprint_summary"]["cancelled_sprints"] == 1
    assert report["velocity_history"][1]["status"] == SprintStatus.CANCELLED
    assert report["metrics"]["average_velocity"] == 4.0
    assert report["rolling_average"]["value"] == 4.0
    assert report["trend"]["direction"] == "down"


def test_velocity_calculator_rolling_average_uses_last_five_completed_sprints():
    sprint_data = [
        _velocity_data(f"s{i}", [points], [points])
        for i, points in enumerate([1, 2, 3, 4, 5, 6], start=1)
    ]

    report = VelocityCalculator().calculate_velocity(sprint_data)

    assert report["rolling_average"]["window"] == DEFAULT_VELOCITY_ROLLING_WINDOW
    assert report["rolling_average"]["sprint_count"] == 5
    assert report["rolling_average"]["value"] == 4.0
    assert report["velocity_history"][-1]["rolling_average"] == 4.0


@pytest.mark.django_db
def test_velocity_api_empty_project(developer_client, project):
    url = reverse("project-report-velocity", kwargs={"project_id": project.id})

    res = developer_client.get(url)

    assert res.status_code == status.HTTP_200_OK
    report = res.data["data"]["report"]
    assert report["velocity_history"] == []
    assert report["metrics"]["average_velocity"] == 0.0
    assert report["rolling_average"]["window"] == DEFAULT_VELOCITY_ROLLING_WINDOW


@pytest.mark.django_db
def test_velocity_api_response_contract_and_historical_accuracy(
    developer_client,
    project,
    create_test_issue,
    todo_status,
    done_status,
):
    project_obj = Project.objects.get(pk=project.id)
    sprint, issues = _create_completed_sprint(
        project=project_obj,
        create_test_issue=create_test_issue,
        todo_status=todo_status,
        done_status=done_status,
        index=1,
        start_points=[5, 3],
        end_points=[8, 3],
        done_issue_indexes={0},
    )
    StoryPointHistory.objects.create(
        issue=issues[0],
        previous_story_points=5,
        new_story_points=8,
    )

    url = reverse("project-report-velocity", kwargs={"project_id": project.id})
    res = developer_client.get(url)

    assert res.status_code == status.HTTP_200_OK
    report = res.data["data"]["report"]
    assert set(report.keys()) == {
        "sprint_summary",
        "velocity_history",
        "rolling_average",
        "trend",
        "metrics",
    }
    row = report["velocity_history"][0]
    assert row["sprint_id"] == str(sprint.id)
    assert row["committed_story_points"] == 8
    assert row["completed_story_points"] == 8
    assert row["commitment_percentage"] == 100.0
    assert row["completion_percentage"] == 72.73
    assert report["metrics"]["average_velocity"] == 8.0


@pytest.mark.django_db
def test_velocity_scope_decrease_uses_end_snapshot_points(
    developer_client,
    project,
    create_test_issue,
    todo_status,
    done_status,
):
    project_obj = Project.objects.get(pk=project.id)
    _create_completed_sprint(
        project=project_obj,
        create_test_issue=create_test_issue,
        todo_status=todo_status,
        done_status=done_status,
        index=2,
        start_points=[8],
        end_points=[5],
        done_issue_indexes={0},
    )

    url = reverse("project-report-velocity", kwargs={"project_id": project.id})
    res = developer_client.get(url)

    row = res.data["data"]["report"]["velocity_history"][0]
    assert row["committed_story_points"] == 8
    assert row["completed_story_points"] == 5
    assert row["commitment_percentage"] == 62.5
    assert row["completion_percentage"] == 100.0


@pytest.mark.django_db
def test_velocity_cancelled_sprint_is_returned_but_not_counted(
    developer_client,
    project,
    create_test_issue,
    todo_status,
    done_status,
):
    project_obj = Project.objects.get(pk=project.id)
    _create_completed_sprint(
        project=project_obj,
        create_test_issue=create_test_issue,
        todo_status=todo_status,
        done_status=done_status,
        index=3,
        start_points=[5],
        end_points=[5],
        done_issue_indexes={0},
    )
    Sprint.objects.create(
        project=project_obj,
        name="Cancelled Sprint",
        start_date="2026-06-10",
        end_date="2026-06-11",
        status=SprintStatus.CANCELLED,
    )

    url = reverse("project-report-velocity", kwargs={"project_id": project.id})
    res = developer_client.get(url)

    report = res.data["data"]["report"]
    assert report["sprint_summary"]["total_sprints"] == 2
    assert report["sprint_summary"]["completed_sprints"] == 1
    assert report["sprint_summary"]["cancelled_sprints"] == 1
    assert [row["status"] for row in report["velocity_history"]] == [
        SprintStatus.COMPLETED,
        SprintStatus.CANCELLED,
    ]
    assert report["metrics"]["average_velocity"] == 5.0


@pytest.mark.django_db
def test_velocity_large_sprint_history(
    developer_client,
    project,
    create_test_issue,
    todo_status,
    done_status,
):
    project_obj = Project.objects.get(pk=project.id)
    for index in range(1, 16):
        _create_completed_sprint(
            project=project_obj,
            create_test_issue=create_test_issue,
            todo_status=todo_status,
            done_status=done_status,
            index=index,
            start_points=[index],
            end_points=[index],
            done_issue_indexes={0},
        )

    url = reverse("project-report-velocity", kwargs={"project_id": project.id})
    res = developer_client.get(url)

    report = res.data["data"]["report"]
    assert len(report["velocity_history"]) == 15
    assert report["rolling_average"]["value"] == 13.0
    assert report["metrics"]["average_velocity"] == 8.0


@pytest.mark.django_db
def test_velocity_cache_hit_skips_selectors(developer_client, project):
    cache.clear()
    cache_key = f"reports:proj:{project.id}:velocity"
    cache.set(cache_key, {"cached": True}, timeout=3600)

    url = reverse("project-report-velocity", kwargs={"project_id": project.id})
    with patch("apps.reports.services.report_service.get_project_sprints") as mock_sprints:
        res = developer_client.get(url)

    assert res.status_code == 200
    assert res.data["data"]["report"] == {"cached": True}
    mock_sprints.assert_not_called()


@pytest.mark.django_db
def test_velocity_cache_is_invalidated_by_story_point_change(
    project,
    create_test_issue,
):
    cache.clear()
    cache_key = f"reports:proj:{project.id}:velocity"
    cache.set(cache_key, {"cached": True}, timeout=3600)

    issue = create_test_issue(story_points=3)
    StoryPointHistory.objects.create(
        issue=issue,
        previous_story_points=3,
        new_story_points=5,
    )

    assert cache.get(cache_key) is None


@pytest.mark.django_db
def test_velocity_service_query_count_on_cache_miss(
    django_assert_num_queries,
    project,
    create_test_issue,
    todo_status,
    done_status,
):
    cache.clear()
    project_obj = Project.objects.get(pk=project.id)
    _create_completed_sprint(
        project=project_obj,
        create_test_issue=create_test_issue,
        todo_status=todo_status,
        done_status=done_status,
        index=4,
        start_points=[5],
        end_points=[5],
        done_issue_indexes={0},
    )

    with django_assert_num_queries(3):
        report = ReportService().get_velocity_report(project.id)

    assert report["metrics"]["average_velocity"] == 5.0
