"""
Label business logic — create, update, archive.

All authorization flows through PermissionService; no inline role checks.
"""
from uuid import UUID

from apps.label.exceptions import (
    LabelDuplicateError,
    LabelError,
    LabelNotFoundError,
)
from apps.label.models import Label
from apps.label.selectors import get_label_by_id
from apps.permissions.services import permission_service


def _normalize_name(name: str) -> str:
    return name.strip()


def _label_name_exists(
    project_id: UUID,
    name: str,
    *,
    exclude_id: UUID | None = None,
) -> bool:
    qs = Label.objects.filter(project_id=project_id, name__iexact=name)
    if exclude_id is not None:
        qs = qs.exclude(pk=exclude_id)
    return qs.exists()


def _get_label_or_raise(label_id: UUID) -> Label:
    label = get_label_by_id(label_id)
    if label is None:
        raise LabelNotFoundError(f"Label '{label_id}' not found.")
    return label


class LabelService:
    def create_label(self, user, project_id: UUID, name: str, color: str) -> Label:
        if not permission_service.can_manage_labels(user.id, project_id):
            raise LabelError("Permission denied: cannot manage labels in this project.")

        normalized_name = _normalize_name(name)
        if _label_name_exists(project_id, normalized_name):
            raise LabelDuplicateError(
                f"Label '{normalized_name}' already exists in this project."
            )

        return Label.objects.create(
            project_id=project_id,
            name=normalized_name,
            color=color,
        )

    def update_label(
        self,
        user,
        label_id: UUID,
        name: str | None = None,
        color: str | None = None,
    ) -> Label:
        label = _get_label_or_raise(label_id)

        if not permission_service.can_manage_labels(user.id, label.project_id):
            raise LabelError("Permission denied: cannot manage labels in this project.")

        update_fields: list[str] = []

        if name is not None:
            normalized_name = _normalize_name(name)
            if _label_name_exists(
                label.project_id,
                normalized_name,
                exclude_id=label_id,
            ):
                raise LabelDuplicateError(
                    f"Label '{normalized_name}' already exists in this project."
                )
            label.name = normalized_name
            update_fields.append("name")

        if color is not None:
            label.color = color
            update_fields.append("color")

        if update_fields:
            update_fields.append("updated_at")
            label.save(update_fields=update_fields)

        return label

    def archive_label(self, user, label_id: UUID) -> Label:
        label = _get_label_or_raise(label_id)

        if not permission_service.can_manage_labels(user.id, label.project_id):
            raise LabelError("Permission denied: cannot manage labels in this project.")

        if not label.is_archived:
            label.is_archived = True
            label.save(update_fields=["is_archived", "updated_at"])

        return label


label_service = LabelService()
