from django.db import models

from apps.foundation.models.base import BaseModel
from apps.workflow.models import WorkflowStatus
from .sprint import Sprint


class SprintSnapshot(BaseModel):
    """
    Immutable point-in-time record of a sprint's issue set and state.

    A "start" snapshot is captured when a sprint is activated; an "end"
    snapshot is captured when it is completed. Daily snapshots may be added
    in a future phase. Duplicate start/end snapshots for the same sprint are
    prevented by a partial unique constraint.

    Note: ``created_at`` (inherited from BaseModel) serves as the capture
    timestamp. The earlier ``captured_at`` field has been removed to avoid
    redundancy.
    """

    sprint = models.ForeignKey(
        Sprint,
        on_delete=models.CASCADE,
        related_name="snapshots",
    )
    snapshot_type = models.CharField(
        max_length=32,
        choices=[("start", "Start"), ("daily", "Daily"), ("end", "End")],
        default="start",
    )

    class Meta:
        verbose_name = "sprint snapshot"
        verbose_name_plural = "sprint snapshots"
        ordering = ["-created_at"]
        indexes = [
            # Supports queries like: "get the start snapshot for sprint X"
            models.Index(fields=["sprint", "snapshot_type"], name="sprints_snap_sprint_type_idx"),
        ]
        constraints = [
            # Prevent duplicate start or end snapshots for the same sprint.
            # Multiple "daily" snapshots are intentionally allowed.
            models.UniqueConstraint(
                fields=["sprint", "snapshot_type"],
                condition=models.Q(snapshot_type__in=["start", "end"]),
                name="sprints_snapshot_unique_start_end",
            ),
        ]

    # ------------------------------------------------------------------
    # Immutability guards
    # ------------------------------------------------------------------

    def delete(self, *args, **kwargs):
        raise TypeError(
            "SprintSnapshot records are immutable analytics facts and cannot be deleted."
        )

    def soft_delete(self, user=None):
        raise TypeError(
            "SprintSnapshot records are immutable analytics facts and cannot be deleted."
        )

    def restore(self, user=None):
        raise TypeError(
            "SprintSnapshot records cannot be restored — they are never soft-deleted."
        )


class SprintIssueCommitment(BaseModel):
    """
    Records one issue's committed state (story points, estimate, status) at
    the moment a ``SprintSnapshot`` was captured.
    """

    snapshot = models.ForeignKey(
        SprintSnapshot,
        on_delete=models.CASCADE,
        related_name="commitments",
    )
    issue = models.ForeignKey(
        "issues.Issue",
        on_delete=models.CASCADE,
        related_name="sprint_commitments",
    )
    committed_story_points = models.IntegerField(null=True, blank=True)
    committed_estimate = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        null=True,
        blank=True,
    )
    committed_status = models.ForeignKey(
        WorkflowStatus,
        on_delete=models.PROTECT,
        related_name="sprint_commitments",
    )

    class Meta:
        verbose_name = "sprint issue commitment"
        verbose_name_plural = "sprint issue commitments"
        constraints = [
            # Prevent the same issue appearing more than once in a snapshot
            # (guards against duplicate snapshot writes under concurrent load).
            models.UniqueConstraint(
                fields=["snapshot", "issue"],
                name="sprints_commitment_unique_snapshot_issue",
            ),
        ]
