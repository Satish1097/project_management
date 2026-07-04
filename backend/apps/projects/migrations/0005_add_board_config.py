from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("projects", "0004_add_project_methodology"),
    ]

    operations = [
        migrations.AddField(
            model_name="project",
            name="board_config",
            field=models.JSONField(blank=True, default=dict),
        ),
    ]
