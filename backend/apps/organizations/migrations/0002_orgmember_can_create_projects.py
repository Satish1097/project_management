from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("organizations", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="organizationmember",
            name="can_create_projects",
            field=models.BooleanField(default=False),
        ),
    ]
