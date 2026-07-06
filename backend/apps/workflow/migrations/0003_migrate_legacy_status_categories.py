from django.db import migrations


def migrate_legacy_categories(apps, schema_editor):
  WorkflowStatus = apps.get_model("workflow", "WorkflowStatus")
  from apps.workflow.slug_utils import normalize_category

  for status in WorkflowStatus.objects.all().only("id", "name", "category"):
    normalized = normalize_category(name=status.name, category=status.category)
    if status.category != normalized:
      WorkflowStatus.objects.filter(pk=status.pk).update(category=normalized)


class Migration(migrations.Migration):
  dependencies = [
    ("workflow", "0002_workflow_persistence_slice_61"),
  ]

  operations = [
    migrations.RunPython(migrate_legacy_categories, migrations.RunPython.noop),
  ]
