from django.conf import settings
from django.db import models

from apps.foundation.models.base import BaseModel
from apps.organizations.models import Organization


class ProjectStatus(models.TextChoices):
    ACTIVE = "active", "Active"
    ARCHIVED = "archived", "Archived"


class ProjectVisibility(models.TextChoices):
    PRIVATE = "private", "Private"
    ORGANIZATION = "organization", "Organization"


class ProjectMethodology(models.TextChoices):
    SCRUM = "scrum", "Scrum"
    KANBAN = "kanban", "Kanban"


class BoardType(models.TextChoices):
    SCRUM = "scrum", "Scrum Board"
    KANBAN = "kanban", "Kanban Board"


class Project(BaseModel):
    organization = models.ForeignKey(
        Organization,
        on_delete=models.PROTECT,
        related_name="projects",
    )
    key = models.CharField(max_length=10)
    slug = models.SlugField(max_length=255)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    lead_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="led_projects",
    )
    status = models.CharField(
        max_length=20,
        choices=ProjectStatus.choices,
        default=ProjectStatus.ACTIVE,
    )
    visibility = models.CharField(
        max_length=20,
        choices=ProjectVisibility.choices,
        default=ProjectVisibility.ORGANIZATION,
    )
    archived_at = models.DateTimeField(null=True, blank=True)
    next_issue_number = models.PositiveIntegerField(default=0)
    methodology = models.CharField(
        max_length=20,
        choices=ProjectMethodology.choices,
        default=ProjectMethodology.SCRUM,
    )
    board_type = models.CharField(
        max_length=20,
        choices=BoardType.choices,
        default=BoardType.SCRUM,
    )
    default_sprint_weeks = models.PositiveSmallIntegerField(null=True, blank=True, default=2)
    board_config = models.JSONField(default=dict, blank=True)

    class Meta:
        verbose_name = "project"
        verbose_name_plural = "projects"
        constraints = [
            models.UniqueConstraint(
                fields=["organization", "key"],
                name="projects_project_org_key_uniq",
            ),
            models.UniqueConstraint(
                fields=["organization", "slug"],
                name="projects_project_org_slug_uniq",
            ),
        ]

    def __str__(self):
        return f"{self.key} — {self.name}"
