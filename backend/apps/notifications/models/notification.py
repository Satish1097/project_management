from django.conf import settings
from django.db import models

from apps.foundation.models.base import BaseModel


class NotificationEventType(models.TextChoices):
    ISSUE_ASSIGNED = "issue_assigned", "Issue assigned"
    ASSIGNEE_CHANGED = "assignee_changed", "Assignee changed"
    COMMENT_ADDED = "comment_added", "Comment added"
    SPRINT_ASSIGNED = "sprint_assigned", "Sprint assigned"
    STATUS_CHANGED = "status_changed", "Status changed"
    ATTACHMENT_ADDED = "attachment_added", "Attachment added"


class Notification(BaseModel):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
    )
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="acted_notifications",
    )
    event_type = models.CharField(
        max_length=32,
        choices=NotificationEventType.choices,
    )
    title = models.CharField(max_length=255)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    related_issue = models.ForeignKey(
        "issues.Issue",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="notifications",
    )

    class Meta:
        verbose_name = "notification"
        verbose_name_plural = "notifications"
        ordering = ["-created_at"]
        indexes = [
            models.Index(
                fields=["user", "is_read"],
                name="notificatio_user_id_8b1f4f_idx",
            ),
            models.Index(
                fields=["user", "created_at"],
                name="notificatio_user_id_6f24b3_idx",
            ),
        ]
