from django.db import models

from apps.foundation.models.base import BaseModel
from apps.projects.models import Project

from .status import WorkflowStatus


class WorkflowTransition(BaseModel):
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name="workflow_transitions",
    )
    from_status = models.ForeignKey(
        WorkflowStatus,
        on_delete=models.CASCADE,
        related_name="outgoing_transitions",
    )
    to_status = models.ForeignKey(
        WorkflowStatus,
        on_delete=models.CASCADE,
        related_name="incoming_transitions",
    )
    name = models.CharField(max_length=255)

    class Meta:
        verbose_name = "workflow transition"
        verbose_name_plural = "workflow transitions"
        constraints = [
            models.UniqueConstraint(
                fields=["project", "from_status", "to_status"],
                name="wf_tr_proj_from_to_uniq",
            ),
        ]
