from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("sprints", "0001_initial"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="sprint",
            name="completed_at",
        ),
        migrations.RemoveField(
            model_name="sprint",
            name="created_by",
        ),
        migrations.RemoveField(
            model_name="sprint",
            name="deleted_at",
        ),
        migrations.RemoveField(
            model_name="sprint",
            name="is_deleted",
        ),
        migrations.RemoveField(
            model_name="sprint",
            name="started_at",
        ),
        migrations.RemoveField(
            model_name="sprint",
            name="updated_by",
        ),
        migrations.AddField(
            model_name="sprint",
            name="capacity_points",
            field=models.IntegerField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name="sprint",
            name="created_at",
            field=models.DateTimeField(auto_now_add=True),
        ),
        migrations.AlterField(
            model_name="sprint",
            name="goal",
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name="sprint",
            name="name",
            field=models.CharField(max_length=100),
        ),
        migrations.AlterField(
            model_name="sprint",
            name="status",
            field=models.CharField(
                choices=[
                    ("planned", "Planned"),
                    ("active", "Active"),
                    ("paused", "Paused"),
                    ("completed", "Completed"),
                    ("cancelled", "Cancelled"),
                ],
                default="planned",
                max_length=20,
            ),
        ),
    ]
