from django.conf import settings
from django.db import migrations, models


def migrate_assignee_to_assignees(apps, schema_editor):
    Issue = apps.get_model("issues", "Issue")
    for issue in Issue.objects.exclude(assignee_id__isnull=True).iterator():
        issue.assignees.add(issue.assignee_id)


class Migration(migrations.Migration):
    dependencies = [
        ("issues", "0007_rename_issues_issu_issue_i_9917eb_idx_issues_issu_issue_i_2d2a93_idx"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name="issue",
            name="assignees",
            field=models.ManyToManyField(
                blank=True,
                related_name="assigned_issues",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.RunPython(migrate_assignee_to_assignees, migrations.RunPython.noop),
        migrations.RemoveIndex(
            model_name="issue",
            name="issues_issu_project_e632b6_idx",
        ),
        migrations.RemoveField(
            model_name="issue",
            name="assignee",
        ),
    ]
