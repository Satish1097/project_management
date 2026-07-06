from django.db import models

from apps.foundation.models.base import BaseModel
from apps.projects.models import Project


class WorkflowScheme(BaseModel):
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name="workflow_schemes",
    )
    name = models.CharField(max_length=255)

    class Meta:
        verbose_name = "workflow scheme"
        verbose_name_plural = "workflow schemes"
        constraints = [
            models.UniqueConstraint(
                fields=["project"],
                name="workflow_scheme_project_uniq",
            ),
        ]
