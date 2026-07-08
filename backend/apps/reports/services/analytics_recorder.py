"""
Analytics Event Recorder — decoupled analytics recording layer.

This class is the single hub for writing to the analytics schemas
(IssueStatusHistory, StoryPointHistory, SprintSnapshot / SprintIssueCommitment).

Design rules:
- Stateless: no instance-level state; all state lives in the database.
- No business logic: the recorder never decides whether an operation is valid.
- Callers are responsible for fault isolation: wrap calls in try/except when
  analytics failures must not block the surrounding business operation.
"""

import logging

from django.db import transaction
from django.utils import timezone

logger = logging.getLogger(__name__)


class AnalyticsEventRecorder:

    def record_status_transition(
        self,
        issue,
        from_status,
        to_status,
        transitioned_by,
        transitioned_at=None,
    ):
        """
        Closes the current open status-history interval and creates a new one.

        Uses SELECT FOR UPDATE on the open-record lookup to prevent race
        conditions when two concurrent transitions operate on the same issue.
        """
        if transitioned_at is None:
            transitioned_at = timezone.now()

        from apps.workflow.models import IssueStatusHistory, WorkflowStatusCategory

        with transaction.atomic():
            # 1. Close the current open interval for the previous status.
            if from_status:
                current_history = (
                    IssueStatusHistory.objects.select_for_update()
                    .filter(
                        issue=issue,
                        to_status=from_status,
                        duration_seconds__isnull=True,
                    )
                    .order_by("-transitioned_at")
                    .first()
                )

                if current_history:
                    elapsed = (transitioned_at - current_history.transitioned_at).total_seconds()
                    current_history.duration_seconds = max(0, int(elapsed))
                    current_history.save(update_fields=["duration_seconds", "updated_at"])

            # 2. Create the new open interval for the target status.
            IssueStatusHistory.objects.create(
                issue=issue,
                from_status=from_status,
                to_status=to_status,
                transitioned_by=transitioned_by,
                transitioned_at=transitioned_at,
            )

            # 3. Maintain Issue.completed_at.
            is_done = to_status.category == WorkflowStatusCategory.DONE
            was_done = (
                from_status.category == WorkflowStatusCategory.DONE
                if from_status
                else False
            )

            if is_done and not was_done:
                issue.completed_at = transitioned_at
                issue.save(update_fields=["completed_at", "updated_at"])
            elif not is_done and was_done:
                issue.completed_at = None
                issue.save(update_fields=["completed_at", "updated_at"])

    def record_story_point_change(
        self,
        issue,
        previous_story_points,
        new_story_points,
        changed_by,
    ):
        """Records a sizing change as an immutable history entry."""
        from apps.issues.models import StoryPointHistory

        StoryPointHistory.objects.create(
            issue=issue,
            previous_story_points=previous_story_points,
            new_story_points=new_story_points,
            changed_by=changed_by,
        )

    def record_sprint_snapshot(self, sprint, snapshot_type="start"):
        """
        Captures a point-in-time snapshot of all issues in a sprint.

        Must be called from within the caller's transaction.atomic() block so
        that the snapshot is rolled back atomically if the surrounding
        operation fails. The internal atomic() here creates a savepoint.
        """
        from apps.sprints.models import SprintSnapshot, SprintIssueCommitment

        with transaction.atomic():
            snapshot = SprintSnapshot.objects.create(
                sprint=sprint,
                snapshot_type=snapshot_type,
            )

            commitments = [
                SprintIssueCommitment(
                    snapshot=snapshot,
                    issue=issue,
                    committed_story_points=issue.story_points,
                    committed_estimate=issue.estimate_hours,
                    committed_status=issue.status,
                )
                for issue in sprint.issues.select_related("status").all()
            ]

            if commitments:
                SprintIssueCommitment.objects.bulk_create(commitments)


analytics_event_recorder = AnalyticsEventRecorder()
