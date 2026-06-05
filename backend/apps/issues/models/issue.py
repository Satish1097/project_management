from django.conf import settings
from django.db import models

from apps.foundation.models.base import BaseModel
from apps.projects.models import Project
from apps.sprints.models import Sprint
from apps.workflow.models import WorkflowStatus


class Priority(models.TextChoices):
    LOWEST = "lowest", "Lowest"
    LOW = "low", "Low"
    MEDIUM = "medium", "Medium"
    HIGH = "high", "High"
    HIGHEST = "highest", "Highest"


class IssueType(models.TextChoices):
    TASK = "task", "Task"
    STORY = "story", "Story"
    BUG = "bug", "Bug"
    SUBTASK = "subtask", "Subtask"


class Issue(BaseModel):
    project = models.ForeignKey(
        Project,
        on_delete=models.PROTECT,
        related_name="issues",
    )
    number = models.PositiveIntegerField()
    key = models.CharField(max_length=50, unique=True, db_index=True)
    title = models.CharField(max_length=500)
    description = models.TextField(blank=True)
    status = models.ForeignKey(
        WorkflowStatus,
        on_delete=models.PROTECT,
        related_name="issues",
    )
    priority = models.CharField(
        max_length=20,
        choices=Priority.choices,
        default=Priority.MEDIUM,
    )
    issue_type = models.CharField(
        max_length=20,
        choices=IssueType.choices,
        default=IssueType.TASK,
    )
    reporter = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="reported_issues",
    )
    assignee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_issues",
    )
    sprint = models.ForeignKey(
        Sprint,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="issues",
    )
    parent_issue = models.ForeignKey(
        "self",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="subtasks",
    )
    story_points = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        null=True,
        blank=True,
    )
    due_date = models.DateField(null=True, blank=True)
    labels = models.JSONField(default=list)
    position = models.DecimalField(max_digits=12, decimal_places=4, default=0)

    class Meta:
        verbose_name = "issue"
        verbose_name_plural = "issues"
        constraints = [
            models.UniqueConstraint(
                fields=["project", "number"],
                name="issues_issue_project_number_uniq",
            ),
        ]
        indexes = [
            models.Index(fields=["project", "status"]),
            models.Index(fields=["project", "sprint"]),
            models.Index(fields=["project", "assignee"]),
            models.Index(fields=["project", "position"]),
        ]

    def __str__(self):
        return self.key
