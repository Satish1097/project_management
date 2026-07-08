from django.conf import settings
from django.db import models
from django.utils import timezone

from apps.foundation.models.base import BaseModel
from .status import WorkflowStatus


class IssueStatusHistory(BaseModel):
    """
    Immutable record of every status transition an issue undergoes.

    Records are append-only analytics facts. Direct deletion is prevented;
    records are only removed via CASCADE when the parent Issue is deleted.
    """

    issue = models.ForeignKey(
        "issues.Issue",
        on_delete=models.CASCADE,
        related_name="status_histories",
    )
    from_status = models.ForeignKey(
        WorkflowStatus,
        on_delete=models.PROTECT,
        related_name="transitions_from",
        null=True,
        blank=True,
    )
    to_status = models.ForeignKey(
        WorkflowStatus,
        on_delete=models.PROTECT,
        related_name="transitions_to",
    )
    transitioned_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="status_transitions",
    )
    transitioned_at = models.DateTimeField(default=timezone.now)
    duration_seconds = models.PositiveIntegerField(null=True, blank=True)

    class Meta:
        verbose_name = "issue status history"
        verbose_name_plural = "issue status histories"
        ordering = ["-transitioned_at"]
        indexes = [
            models.Index(fields=["issue", "transitioned_at"]),
            # Partial index to speed up the "close open record" lookup performed on
            # every status transition: filter(issue, to_status, duration_seconds=None)
            models.Index(
                fields=["issue", "to_status"],
                name="workflow_ish_open_records_idx",
                condition=models.Q(duration_seconds__isnull=True),
            ),
        ]

    # ------------------------------------------------------------------
    # Immutability guards — history records must never be deleted through
    # application code. Only CASCADE deletes (when the parent Issue is
    # removed) are permitted at the database level.
    # ------------------------------------------------------------------

    def delete(self, *args, **kwargs):
        raise TypeError(
            "IssueStatusHistory records are immutable analytics facts and cannot be deleted."
        )

    def soft_delete(self, user=None):
        raise TypeError(
            "IssueStatusHistory records are immutable analytics facts and cannot be deleted."
        )

    def restore(self, user=None):
        raise TypeError(
            "IssueStatusHistory records cannot be restored — they are never soft-deleted."
        )
