from django.db import migrations


class Migration(migrations.Migration):
    """
    Enable Parallel Sprints (Jira-style).

    Removes the partial unique constraint that limited each project to a
    single ACTIVE sprint. Multiple sprints may now be ACTIVE at the same
    time. No historical sprint or issue data is modified.
    """

    dependencies = [
        ("sprints", "0002_sprint_persistence_only"),
    ]

    operations = [
        migrations.RemoveConstraint(
            model_name="sprint",
            name="sprints_sprint_one_active_per_project",
        ),
    ]
