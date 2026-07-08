from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("projects", "0005_add_board_config"),
    ]

    operations = [
        migrations.AlterField(
            model_name="project",
            name="visibility",
            field=models.CharField(
                choices=[("private", "Private"), ("organization", "Organization")],
                default="private",
                max_length=20,
            ),
        ),
    ]
