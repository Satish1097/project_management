from django.db import models

from apps.foundation.models.base import BaseModel
from apps.projects.models import Project


class WorkflowStatusCategory(models.TextChoices):
    PENDING = "pending", "Pending"
    ACTIVE = "active", "Active"
    REVIEW = "review", "Review"
    COMPLETE = "complete", "Complete"
    BLOCKED = "blocked", "Blocked"


class WorkflowStatus(BaseModel):
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="workflow_statuses",
    )
    name = models.CharField(max_length=255)
    slug = models.CharField(max_length=50)
    category = models.CharField(
        max_length=20,
        choices=WorkflowStatusCategory.choices,
    )
    position = models.PositiveSmallIntegerField()
    is_default = models.BooleanField(default=False)
    is_terminal = models.BooleanField(default=False)

    class Meta:
        verbose_name = "workflow status"
        verbose_name_plural = "workflow statuses"
        constraints = [
            models.UniqueConstraint(
                fields=["project", "slug"],
                name="workflow_workflowstatus_project_slug_uniq",
            ),
        ]

    def __str__(self):
        return self.name
