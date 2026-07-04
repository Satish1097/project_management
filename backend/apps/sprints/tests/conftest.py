import pytest

from apps.issues.services.issue_service import issue_service
from apps.projects.tests.conftest import (  # noqa: F401
    VALID_PASSWORD,
    api_client,
    authenticate,
    celery_always_eager,
    developer_client,
    manager_client,
    organization,
    project_manager_user,
    project_with_manager,
    superuser_client,
    user,
)


pytest_plugins = ["apps.projects.tests.conftest"]


@pytest.fixture
def create_test_issue(project, superuser):
    def _create(**kwargs):
        sprint_id = kwargs.pop("sprint_id", None)
        defaults = {
            "user": superuser,
            "project_id": project.id,
            "title": "Test issue",
        }
        defaults.update(kwargs)
        issue = issue_service.create_issue(**defaults)
        if sprint_id is not None:
            issue = issue_service.assign_sprint(superuser, issue.id, sprint_id)
        return issue

    return _create
