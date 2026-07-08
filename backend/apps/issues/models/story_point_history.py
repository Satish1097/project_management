from django.conf import settings
from django.db import models

from apps.foundation.models.base import BaseModel
from .issue import Issue


class StoryPointHistory(BaseModel):
    """
    Immutable record of every story-point change on an issue.

    Records are append-only analytics facts. Direct deletion is prevented;
    records are only removed via CASCADE when the parent Issue is deleted.
    """

    issue = models.ForeignKey(
        Issue,
        on_delete=models.CASCADE,
        related_name="story_point_histories",
    )
    previous_story_points = models.IntegerField(null=True, blank=True)
    new_story_points = models.IntegerField(null=True, blank=True)
    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="story_point_changes",
    )

    class Meta:
        verbose_name = "story point history"
        verbose_name_plural = "story point histories"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["issue", "created_at"]),
        ]

    # ------------------------------------------------------------------
    # Immutability guards — history records must never be deleted through
    # application code. Only CASCADE deletes (when the parent Issue is
    # removed) are permitted at the database level.
    # ------------------------------------------------------------------

    def delete(self, *args, **kwargs):
        raise TypeError(
            "StoryPointHistory records are immutable analytics facts and cannot be deleted."
        )

    def soft_delete(self, user=None):
        raise TypeError(
            "StoryPointHistory records are immutable analytics facts and cannot be deleted."
        )

    def restore(self, user=None):
        raise TypeError(
            "StoryPointHistory records cannot be restored — they are never soft-deleted."
        )
