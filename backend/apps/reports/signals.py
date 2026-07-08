import logging
from django.db.models.signals import post_save, post_delete, pre_save
from django.dispatch import receiver
from django.core.cache import cache

from apps.issues.models import Issue, StoryPointHistory
from apps.sprints.models import Sprint, SprintSnapshot, SprintIssueCommitment
from apps.workflow.models import IssueStatusHistory

logger = logging.getLogger(__name__)


def invalidate_report_cache(project_id, sprint_id=None):
    """Safely invalidates cached reports for a project and optionally a specific sprint."""
    try:
        keys = [f"reports:proj:{project_id}:velocity"]
        if sprint_id:
            keys.extend([
                f"reports:proj:{project_id}:burndown:{sprint_id}",
                f"reports:proj:{project_id}:sprint-report:{sprint_id}",
                f"reports:proj:{project_id}:sprint-health:{sprint_id}",
            ])
        cache.delete_many(keys)
    except Exception:
        # Fault isolation: log and continue to avoid blocking main transaction
        logger.exception("Failed to invalidate reports cache.")


@receiver(pre_save, sender=Issue)
def track_old_sprint(sender, instance, **kwargs):
    """Keeps track of old sprint ID before save to invalidate both old and new sprint caches."""
    if instance.pk:
        try:
            old_issue = Issue.objects.filter(pk=instance.pk).values("sprint_id").first()
            if old_issue:
                instance._old_sprint_id = old_issue["sprint_id"]
        except Exception:
            pass


@receiver(post_save, sender=Issue)
def issue_saved(sender, instance, created, **kwargs):
    # Invalidate new sprint cache
    invalidate_report_cache(instance.project_id, instance.sprint_id)
    # Invalidate old sprint cache if it changed
    old_sprint_id = getattr(instance, "_old_sprint_id", None)
    if old_sprint_id and old_sprint_id != instance.sprint_id:
        invalidate_report_cache(instance.project_id, old_sprint_id)


@receiver(post_delete, sender=Issue)
def issue_deleted(sender, instance, **kwargs):
    invalidate_report_cache(instance.project_id, instance.sprint_id)


@receiver(post_save, sender=Sprint)
def sprint_saved(sender, instance, created, **kwargs):
    invalidate_report_cache(instance.project_id, instance.id)


@receiver(post_delete, sender=Sprint)
def sprint_deleted(sender, instance, **kwargs):
    invalidate_report_cache(instance.project_id, instance.id)


@receiver(post_save, sender=SprintSnapshot)
def snapshot_saved(sender, instance, created, **kwargs):
    invalidate_report_cache(instance.sprint.project_id, instance.sprint_id)


@receiver(post_save, sender=SprintIssueCommitment)
def commitment_saved(sender, instance, created, **kwargs):
    sprint = instance.snapshot.sprint
    invalidate_report_cache(sprint.project_id, sprint.id)


@receiver(post_save, sender=StoryPointHistory)
def story_point_history_saved(sender, instance, created, **kwargs):
    issue = instance.issue
    invalidate_report_cache(issue.project_id, issue.sprint_id)


@receiver(post_save, sender=IssueStatusHistory)
def status_history_saved(sender, instance, created, **kwargs):
    issue = instance.issue
    invalidate_report_cache(issue.project_id, issue.sprint_id)
