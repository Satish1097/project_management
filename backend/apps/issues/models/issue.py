from django.conf import settings
from django.db import models

from apps.foundation.models.base import BaseModel
from apps.label.models import Label
from apps.projects.models import Project
from apps.sprints.models import Sprint
from apps.workflow.models import WorkflowStatus


class IssueType(models.TextChoices):
    TASK = "task", "Task"
    BUG = "bug", "Bug"
    STORY = "story", "Story"
    EPIC = "epic", "Epic"
    SUBTASK = "subtask", "Subtask"


class Priority(models.TextChoices):
    LOW = "low", "Low"
    MEDIUM = "medium", "Medium"
    HIGH = "high", "High"
    CRITICAL = "critical", "Critical"


class Issue(BaseModel):
    project = models.ForeignKey(
        Project,
        on_delete=models.PROTECT,
        related_name="issues",
    )
    key = models.CharField(max_length=50)
    title = models.CharField(max_length=500)
    description = models.TextField(blank=True)
    type = models.CharField(
        max_length=20,
        choices=IssueType.choices,
        default=IssueType.TASK,
    )
    priority = models.CharField(
        max_length=20,
        choices=Priority.choices,
        default=Priority.MEDIUM,
    )
    status = models.ForeignKey(
        WorkflowStatus,
        on_delete=models.PROTECT,
        related_name="issues",
    )
    sprint = models.ForeignKey(
        Sprint,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="issues",
    )
    labels = models.ManyToManyField(
        Label,
        blank=True,
        related_name="issues",
    )
    assignees = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        blank=True,
        related_name="assigned_issues",
    )
    reporter = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="reported_issues",
    )
    due_date = models.DateField(null=True, blank=True)
    estimate_hours = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        null=True,
        blank=True,
    )
    story_points = models.IntegerField(null=True, blank=True)
    parent_issue = models.ForeignKey(
        "self",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="subtasks",
    )

    class Meta:
        verbose_name = "issue"
        verbose_name_plural = "issues"
        constraints = [
            models.UniqueConstraint(
                fields=["project", "key"],
                name="issues_issue_project_key_uniq",
            ),
        ]
        indexes = [
            models.Index(fields=["project", "status"]),
            models.Index(fields=["project", "sprint"]),
            models.Index(fields=["project", "priority"]),
        ]

    def get_primary_assignee_id(self):
        prefetched = getattr(self, "_prefetched_objects_cache", {}).get("assignees")
        if prefetched is not None:
            return prefetched[0].pk if prefetched else None
        return self.assignees.values_list("pk", flat=True).first()
