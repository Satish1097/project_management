import uuid

from django.db import models

from apps.projects.models import Project


class SprintStatus(models.TextChoices):
    PLANNED = "planned", "Planned"
    ACTIVE = "active", "Active"
    PAUSED = "paused", "Paused"
    COMPLETED = "completed", "Completed"
    CANCELLED = "cancelled", "Cancelled"


class Sprint(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(
        Project,
        on_delete=models.PROTECT,
        related_name="sprints",
    )
    name = models.CharField(max_length=100)
    goal = models.TextField(null=True, blank=True)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    status = models.CharField(
        max_length=20,
        choices=SprintStatus.choices,
        default=SprintStatus.PLANNED,
    )
    capacity_points = models.IntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

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
