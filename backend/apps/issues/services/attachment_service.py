"""
Attachment write services — upload and delete.

All reads must go through selectors; no API/upload/storage customization logic here.
"""
from uuid import UUID

from apps.issues.exceptions import IssueError
from apps.issues.models import Issue, IssueActivityEventType, IssueAttachment
from apps.issues.selectors import get_attachment_by_id, get_issue_by_id
from apps.issues.services.activity_service import (
    create_issue_activity,
    get_user_display_value,
)
from apps.notifications.services import notification_service
from apps.permissions.services import permission_service


def _get_issue_or_raise(issue_id: UUID) -> Issue:
    issue = get_issue_by_id(issue_id)
    if issue is None:
        raise IssueError(f"Issue '{issue_id}' not found.")
    return issue


def _get_attachment_or_raise(attachment_id: UUID) -> IssueAttachment:
    attachment = get_attachment_by_id(attachment_id)
    if attachment is None:
        raise IssueError(f"Attachment '{attachment_id}' not found.")
    return attachment


class AttachmentService:
    def upload_attachment(self, user, issue_id: UUID, file) -> IssueAttachment:
        issue = _get_issue_or_raise(issue_id)

        if not permission_service.can_edit_issue(user.id, issue.project_id):
            raise IssueError("Permission denied: cannot upload attachments to this issue.")

        attachment = IssueAttachment.objects.create(
            issue_id=issue.id,
            uploaded_by_id=user.id,
            file=file,
        )
        create_issue_activity(
            issue_id=issue.id,
            actor=user,
            event_type=IssueActivityEventType.ATTACHMENT_ADDED,
            old_value=None,
            new_value=attachment.id,
        )
        if issue.assignee_id is not None and issue.assignee_id != user.id:
            actor_name = get_user_display_value(user.id) or "Someone"
            notification_service.create_notification(
                user_id=issue.assignee_id,
                actor_id=user.id,
                event_type="attachment_added",
                title="Attachment Added",
                message=f"{actor_name} added an attachment",
                related_issue_id=issue.id,
            )
        return get_attachment_by_id(attachment.id) or attachment

    def delete_attachment(self, user, attachment_id: UUID) -> bool:
        attachment = _get_attachment_or_raise(attachment_id)

        if not permission_service.can_edit_issue(user.id, attachment.issue.project_id):
            raise IssueError("Permission denied: cannot delete attachments from this issue.")

        create_issue_activity(
            issue_id=attachment.issue_id,
            actor=user,
            event_type=IssueActivityEventType.ATTACHMENT_DELETED,
            old_value=attachment.id,
            new_value=None,
        )
        attachment.delete()
        return True


attachment_service = AttachmentService()
