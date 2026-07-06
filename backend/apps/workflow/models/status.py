from django.db import models

from apps.foundation.models.base import BaseModel
from apps.projects.models import Project


class WorkflowStatusCategory(models.TextChoices):
    TODO = "todo", "Todo"
    IN_PROGRESS = "in_progress", "In Progress"
    DONE = "done", "Done"


class WorkflowStatus(BaseModel):
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name="workflow_statuses",
    )
    name = models.CharField(max_length=255)
    category = models.CharField(
        max_length=20,
        choices=WorkflowStatusCategory.choices,
    )
    color = models.CharField(max_length=32)
    order = models.PositiveIntegerField()
    is_default = models.BooleanField(default=False)

    class Meta:
        verbose_name = "workflow status"
        verbose_name_plural = "workflow statuses"
        indexes = [
            models.Index(fields=["project", "order"], name="wf_st_proj_order_idx"),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["project", "name"],
                name="wf_st_proj_name_uniq",
            ),
            models.UniqueConstraint(
                fields=["project"],
                condition=models.Q(is_default=True),
                name="wf_st_proj_def_uniq",
            ),
        ]
