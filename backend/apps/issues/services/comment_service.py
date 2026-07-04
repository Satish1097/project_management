"""
Comment write services — create, update, delete.

All reads must go through selectors; no API/workflow/activity logic here.
"""
from uuid import UUID

from apps.issues.exceptions import IssueError, IssueValidationError
from apps.issues.models import Issue, IssueActivityEventType, IssueComment
from apps.issues.selectors import get_comment_by_id, get_issue_by_id
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


def _get_comment_or_raise(comment_id: UUID) -> IssueComment:
    comment = get_comment_by_id(comment_id)
    if comment is None:
        raise IssueError(f"Comment '{comment_id}' not found.")
    return comment


def _normalize_body(body: str) -> str:
    normalized = body.strip()
    if not normalized:
        raise IssueValidationError("Comment body cannot be empty.")
    return normalized


class CommentService:
    def create_comment(self, user, issue_id: UUID, body: str) -> IssueComment:
        issue = _get_issue_or_raise(issue_id)

        if not permission_service.can_edit_issue(user.id, issue.project_id):
            raise IssueError("Permission denied: cannot comment on this issue.")

        comment = IssueComment.objects.create(
            issue_id=issue.id,
            author_id=user.id,
            body=_normalize_body(body),
        )
        create_issue_activity(
            issue_id=issue.id,
            actor=user,
            event_type=IssueActivityEventType.COMMENT_ADDED,
            old_value=None,
            new_value=comment.id,
        )
        if issue.get_primary_assignee_id() is not None and issue.get_primary_assignee_id() != user.id:
            actor_name = get_user_display_value(user.id) or "Someone"
            notification_service.create_notification(
                user_id=issue.get_primary_assignee_id(),
                actor_id=user.id,
                event_type="comment_added",
                title="New Comment",
                message=f"{actor_name} commented on {issue.key}",
                related_issue_id=issue.id,
            )
        return get_comment_by_id(comment.id) or comment

    def update_comment(self, user, comment_id: UUID, body: str) -> IssueComment:
        comment = _get_comment_or_raise(comment_id)

        if comment.author_id != user.id:
            raise IssueError("Permission denied: only the comment author may edit.")

        comment.body = _normalize_body(body)
        comment.save(update_fields=["body", "updated_at"])
        return get_comment_by_id(comment.id) or comment

    def delete_comment(self, user, comment_id: UUID) -> bool:
        comment = _get_comment_or_raise(comment_id)

        if comment.author_id != user.id:
            raise IssueError("Permission denied: only the comment author may delete.")

        create_issue_activity(
            issue_id=comment.issue_id,
            actor=user,
            event_type=IssueActivityEventType.COMMENT_DELETED,
            old_value=comment.id,
            new_value=None,
        )
        comment.delete()
        return True


comment_service = CommentService()
