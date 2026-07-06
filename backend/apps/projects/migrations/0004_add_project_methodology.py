from django.db import migrations, models


def backfill_methodology_defaults(apps, schema_editor):
    Project = apps.get_model("projects", "Project")
    Project.objects.filter(methodology__isnull=True).update(
        methodology="scrum",
        board_type="scrum",
        default_sprint_weeks=2,
    )


class Migration(migrations.Migration):

    dependencies = [
        ("projects", "0003_project_next_issue_number"),
    ]

    operations = [
        migrations.AddField(
            model_name="project",
            name="methodology",
            field=models.CharField(
                choices=[("scrum", "Scrum"), ("kanban", "Kanban")],
                max_length=20,
                null=True,
            ),
        ),
        migrations.AddField(
            model_name="project",
            name="board_type",
            field=models.CharField(
                choices=[("scrum", "Scrum Board"), ("kanban", "Kanban Board")],
                max_length=20,
                null=True,
            ),
        ),
        migrations.AddField(
            model_name="project",
            name="default_sprint_weeks",
            field=models.PositiveSmallIntegerField(blank=True, null=True),
        ),
        migrations.RunPython(
            backfill_methodology_defaults,
            migrations.RunPython.noop,
        ),
        migrations.AlterField(
            model_name="project",
            name="methodology",
            field=models.CharField(
                choices=[("scrum", "Scrum"), ("kanban", "Kanban")],
                default="scrum",
                max_length=20,
            ),
        ),
        migrations.AlterField(
            model_name="project",
            name="board_type",
            field=models.CharField(
                choices=[("scrum", "Scrum Board"), ("kanban", "Kanban Board")],
                default="scrum",
                max_length=20,
            ),
        ),
        migrations.AlterField(
            model_name="project",
            name="default_sprint_weeks",
            field=models.PositiveSmallIntegerField(blank=True, default=2, null=True),
        ),
    ]
