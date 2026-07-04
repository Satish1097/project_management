from unittest.mock import MagicMock, patch
from uuid import uuid4

import pytest

from apps.issues.services.issue_service import issue_service
from apps.projects.exceptions import ProjectMethodologyError
from apps.projects.services.project_service import require_scrum_project

pytest_plugins = ["apps.projects.tests.conftest"]


@pytest.mark.django_db
def test_require_scrum_project_allows_scrum(project):
    require_scrum_project(project.id)


@pytest.mark.django_db
def test_require_scrum_project_rejects_kanban(kanban_project):
    with pytest.raises(ProjectMethodologyError, match="Kanban"):
        require_scrum_project(kanban_project.id)


@pytest.mark.django_db
def test_assign_sprint_rejects_kanban_project(kanban_project, superuser):
    mock_issue = MagicMock()
    mock_issue.project_id = kanban_project.id
    mock_issue.project = kanban_project

    with patch(
        "apps.issues.services.issue_service._get_issue_or_raise",
        return_value=mock_issue,
    ):
        with pytest.raises(ProjectMethodologyError, match="Kanban"):
            issue_service.assign_sprint(superuser, uuid4(), uuid4())


@pytest.mark.django_db
def test_bulk_assign_sprint_rejects_kanban_project(kanban_project, superuser):
    issue_id = uuid4()
    mock_issue = MagicMock()
    mock_issue.id = issue_id
    mock_issue.project_id = kanban_project.id
    mock_issue.project = kanban_project
    mock_issue.sprint = None
    mock_issue.sprint_id = None
    mock_issue.get_primary_assignee_id.return_value = None

    prefetch_related_mock = MagicMock(return_value=[mock_issue])
    select_related_mock = MagicMock()
    select_related_mock.prefetch_related = prefetch_related_mock

    with patch(
        "apps.issues.services.issue_service.Issue.objects.filter",
        return_value=MagicMock(
            select_related=MagicMock(return_value=select_related_mock),
        ),
    ):
        with pytest.raises(ProjectMethodologyError, match="Kanban"):
            issue_service.bulk_assign_sprint(superuser, [issue_id], uuid4())


@pytest.mark.django_db
def test_assign_sprint_reaches_permissions_on_scrum_project(project, superuser):
    mock_issue = MagicMock()
    mock_issue.project_id = project.id
    mock_issue.project = project

    with patch(
        "apps.issues.services.issue_service._get_issue_or_raise",
        return_value=mock_issue,
    ), patch(
        "apps.issues.services.issue_service.permission_service.can_edit_issue",
        return_value=False,
    ):
        from apps.issues.exceptions import IssueError

        with pytest.raises(IssueError, match="Permission denied"):
            issue_service.assign_sprint(superuser, uuid4(), uuid4())
