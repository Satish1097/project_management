from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("projects", "0002_add_archived_at"),
    ]

    operations = [
        migrations.AddField(
            model_name="project",
            name="next_issue_number",
            field=models.PositiveIntegerField(default=0),
        ),
    ]
