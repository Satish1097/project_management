from django.conf import settings
from django.db import models

from apps.foundation.models.base import BaseModel

from .issue import Issue


class IssueActivityEventType(models.TextChoices):
    STATUS_CHANGED = "status_changed", "Status changed"
    ASSIGNEE_CHANGED = "assignee_changed", "Assignee changed"
    SPRINT_CHANGED = "sprint_changed", "Sprint changed"
    COMMENT_ADDED = "comment_added", "Comment added"
    COMMENT_DELETED = "comment_deleted", "Comment deleted"
    ATTACHMENT_ADDED = "attachment_added", "Attachment added"
    ATTACHMENT_DELETED = "attachment_deleted", "Attachment deleted"
    STORY_POINTS_CHANGED = "story_points_changed", "Story points changed"
    ESTIMATE_CHANGED = "estimate_changed", "Estimate changed"


class IssueActivity(BaseModel):
    issue = models.ForeignKey(
        Issue,
        on_delete=models.CASCADE,
        related_name="activities",
    )
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="issue_activities",
    )
    event_type = models.CharField(
        max_length=32,
        choices=IssueActivityEventType.choices,
    )
    old_value = models.TextField(null=True, blank=True)
    new_value = models.TextField(null=True, blank=True)

    class Meta:
        verbose_name = "issue activity"
        verbose_name_plural = "issue activities"
        indexes = [
            models.Index(fields=["issue", "created_at"]),
        ]

    def save(self, *args, **kwargs):
        if self.pk and self.__class__.all_objects.filter(pk=self.pk).exists():
            raise TypeError("IssueActivity is append-only and cannot be updated.")
        return super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        raise TypeError("IssueActivity is append-only and cannot be deleted.")

    def soft_delete(self, user=None):
        raise TypeError("IssueActivity is append-only and cannot be deleted.")

    def restore(self, user=None):
        raise TypeError("IssueActivity is append-only and cannot be restored.")
