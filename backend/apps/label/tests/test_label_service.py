import pytest

from apps.label.exceptions import LabelDuplicateError
from apps.label.models import Label
from apps.label.services.label_service import label_service


@pytest.mark.django_db
def test_create_label_prevents_case_insensitive_duplicates(
    project_with_manager,
    project_manager_user,
):
    Label.objects.create(project=project_with_manager, name="Bug", color="#FF0000")

    with pytest.raises(LabelDuplicateError):
        label_service.create_label(
            user=project_manager_user,
            project_id=project_with_manager.id,
            name="bug",
            color="#00FF00",
        )


@pytest.mark.django_db
def test_create_label_normalizes_whitespace(project_with_manager, project_manager_user):
    label = label_service.create_label(
        user=project_manager_user,
        project_id=project_with_manager.id,
        name="  Needs QA  ",
        color="#123ABC",
    )

    assert label.name == "Needs QA"


@pytest.mark.django_db
def test_archive_label_is_idempotent(project_with_manager, project_manager_user):
    label = Label.objects.create(project=project_with_manager, name="Bug", color="#FF0000")

    first = label_service.archive_label(user=project_manager_user, label_id=label.id)
    first_updated_at = first.updated_at
    second = label_service.archive_label(user=project_manager_user, label_id=label.id)

    assert first.is_archived is True
    assert second.is_archived is True
    assert second.updated_at == first_updated_at
