from django.conf import settings
from django.db import models

from apps.foundation.models.base import BaseModel

from .project import Project


class ProjectRole(models.TextChoices):
    PROJECT_ADMIN = "project_admin", "Project Admin"
    PROJECT_MANAGER = "project_manager", "Project Manager"
    DEVELOPER = "developer", "Developer"
    QA = "qa", "QA"
    VIEWER = "viewer", "Viewer"


class ProjectMember(BaseModel):
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name="memberships",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="project_memberships",
    )
    role = models.CharField(
        max_length=30,
        choices=ProjectRole.choices,
    )

    class Meta:
        verbose_name = "project member"
        verbose_name_plural = "project members"
        constraints = [
            models.UniqueConstraint(
                fields=["project", "user"],
                name="projects_projectmember_project_user_uniq",
            ),
        ]
        indexes = [
            models.Index(fields=["project", "role"]),
            models.Index(fields=["user"]),
        ]

    def __str__(self):
        return f"{self.user_id} @ {self.project_id} ({self.role})"
