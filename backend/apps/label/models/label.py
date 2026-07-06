import uuid

from django.core.validators import RegexValidator
from django.db import models

from apps.projects.models import Project

HEX_COLOR_VALIDATOR = RegexValidator(
    regex=r"^#[0-9A-Fa-f]{6}$",
    message="Color must be a hex string in #RRGGBB format.",
)


class Label(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name="labels",
    )
    name = models.CharField(max_length=50)
    color = models.CharField(max_length=7, validators=[HEX_COLOR_VALIDATOR])
    is_archived = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "label"
        verbose_name_plural = "labels"
        constraints = [
            models.UniqueConstraint(
                fields=["project", "name"],
                name="label_label_project_name_uniq",
            ),
        ]
        indexes = [
            models.Index(fields=["project", "is_archived"]),
        ]

    def __str__(self):
        return self.name
