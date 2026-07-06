import pytest
from django.core.files.uploadedfile import SimpleUploadedFile

from apps.contracts.workflow_contract import get_status_by_slug
from apps.issues.services import attachment_service, comment_service, issue_service
from apps.notifications.models import Notification
from apps.projects.models import ProjectRole
from apps.projects.services.membership_service import add_project_member
from apps.sprints.services.sprint_service import sprint_service
from apps.workflow.services import transition_service


pytestmark = pytest.mark.django_db


@pytest.fixture(autouse=True)
def media_root(tmp_path, settings):
    settings.MEDIA_ROOT = tmp_path


@pytest.fixture
def notification_project(project, superuser, user, other_user):
    add_project_member(
        project_id=project.id,
        user_id=user.id,
        added_by=superuser,
        role=ProjectRole.DEVELOPER,
    )
    add_project_member(
        project_id=project.id,
        user_id=other_user.id,
        added_by=superuser,
        role=ProjectRole.DEVELOPER,
    )
    return project


@pytest.fixture
def assigned_issue(notification_project, superuser, user):
    return issue_service.create_issue(
        user=superuser,
        project_id=notification_project.id,
        title="Notification workflow issue",
        assignee_id=user.id,
    )


def _latest_notification(event_type: str):
    return Notification.objects.filter(event_type=event_type).latest("created_at")


def test_notification_generation_for_supported_issue_events(
    notification_project,
    assigned_issue,
    superuser,
    user,
    other_user,
):
    comment_service.create_comment(
        user=superuser,
        issue_id=assigned_issue.id,
        body="Please review this when you can.",
    )
    assert _latest_notification("comment_added").user_id == user.id

    issue_service.update_issue(
        user=superuser,
        issue_id=assigned_issue.id,
        assignee_id=other_user.id,
    )
    assert _latest_notification("assignee_changed").user_id == other_user.id

    issue_service.update_issue(
        user=superuser,
        issue_id=assigned_issue.id,
        assignee_id=user.id,
    )

    target_status = get_status_by_slug(notification_project.id, "in_progress")
    transition_service.transition_issue(
        user=superuser,
        issue_id=assigned_issue.id,
        to_status_id=target_status.id,
    )
    assert _latest_notification("status_changed").user_id == user.id

    sprint = sprint_service.create_sprint(
        user=superuser,
        project_id=notification_project.id,
        name="Notifications Sprint",
    )
    issue_service.assign_sprint(
        user=superuser,
        issue_id=assigned_issue.id,
        sprint_id=sprint.id,
    )
    assert _latest_notification("sprint_assigned").user_id == user.id

    upload = SimpleUploadedFile("notes.txt", b"notification attachment")
    attachment_service.upload_attachment(
        user=superuser,
        issue_id=assigned_issue.id,
        file=upload,
    )
    assert _latest_notification("attachment_added").user_id == user.id


def test_notification_api_delivery_mark_read_and_mark_all(
    assigned_issue,
    superuser,
    user,
    other_user,
    authenticate,
):
    first = comment_service.create_comment(
        user=superuser,
        issue_id=assigned_issue.id,
        body="First notification.",
    )
    second = attachment_service.upload_attachment(
        user=superuser,
        issue_id=assigned_issue.id,
        file=SimpleUploadedFile("api.txt", b"api notification"),
    )
    assert first is not None
    assert second is not None

    client = authenticate(user)

    list_response = client.get("/api/notifications")
    assert list_response.status_code == 200
    notifications = list_response.json()["data"]["notifications"]
    assert [item["event_type"] for item in notifications] == [
        "attachment_added",
        "comment_added",
    ]
    assert all(item["is_read"] is False for item in notifications)

    count_response = client.get("/api/notifications/unread-count")
    assert count_response.status_code == 200
    assert count_response.json()["data"]["count"] == 2

    first_id = notifications[0]["id"]
    mark_response = client.post(f"/api/notifications/{first_id}/read")
    assert mark_response.status_code == 200
    assert mark_response.json()["data"]["notification"]["is_read"] is True
    assert client.get("/api/notifications/unread-count").json()["data"]["count"] == 1

    mark_all_response = client.post("/api/notifications/read-all")
    assert mark_all_response.status_code == 200
    assert mark_all_response.json()["data"]["updated"] == 1
    assert client.get("/api/notifications/unread-count").json()["data"]["count"] == 0
    assert all(
        item["is_read"] is True
        for item in client.get("/api/notifications").json()["data"]["notifications"]
    )

    other_client = authenticate(other_user)
    other_response = other_client.get("/api/notifications")
    assert other_response.status_code == 200
    assert other_response.json()["data"]["notifications"] == []


def test_self_notification_is_suppressed(assigned_issue, user):
    comment_service.create_comment(
        user=user,
        issue_id=assigned_issue.id,
        body="I am updating my own assigned issue.",
    )

    assert Notification.objects.filter(user_id=user.id).count() == 0
