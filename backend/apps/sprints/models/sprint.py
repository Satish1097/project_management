from django.db import models

from apps.foundation.models.base import BaseModel
from apps.projects.models import Project


class SprintStatus(models.TextChoices):
    PLANNED = "planned", "Planned"
    ACTIVE = "active", "Active"
    COMPLETED = "completed", "Completed"


class Sprint(BaseModel):
    project = models.ForeignKey(
        Project,
        on_delete=models.PROTECT,
        related_name="sprints",
    )
    name = models.CharField(max_length=255)
    goal = models.TextField(blank=True)
    status = models.CharField(
        max_length=20,
        choices=SprintStatus.choices,
        default=SprintStatus.PLANNED,
    )
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = "sprint"
        verbose_name_plural = "sprints"
        constraints = [
            models.UniqueConstraint(
                fields=["project"],
                condition=models.Q(status="active"),
                name="sprints_sprint_one_active_per_project",
            ),
        ]
        indexes = [
            models.Index(fields=["project", "status"]),
        ]

    def __str__(self):
        return self.name
