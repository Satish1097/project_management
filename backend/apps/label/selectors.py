"""
Read-only label lookups for apps.label.

Selectors must not mutate data or contain business logic.
"""
from uuid import UUID

from django.db.models import QuerySet

from apps.label.models import Label


def get_project_labels(project_id: UUID) -> QuerySet[Label]:
    return Label.objects.filter(project_id=project_id).order_by("name")


def get_active_labels(project_id: UUID) -> QuerySet[Label]:
    return (
        Label.objects.filter(project_id=project_id, is_archived=False)
        .order_by("name")
    )


def get_label_by_id(label_id: UUID) -> Label | None:
    try:
        return Label.objects.select_related("project").get(pk=label_id)
    except Label.DoesNotExist:
        return None
