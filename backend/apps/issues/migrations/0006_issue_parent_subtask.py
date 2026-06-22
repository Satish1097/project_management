# Generated manually for subtask parent linkage restore

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("issues", "0005_phase_10_slice_10_11_issue_attachment"),
    ]

    operations = [
        migrations.AddField(
            model_name="issue",
            name="parent_issue",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="subtasks",
                to="issues.issue",
            ),
        ),
        migrations.AlterField(
            model_name="issue",
            name="type",
            field=models.CharField(
                choices=[
                    ("task", "Task"),
                    ("bug", "Bug"),
                    ("story", "Story"),
                    ("epic", "Epic"),
                    ("subtask", "Subtask"),
                ],
                default="task",
                max_length=20,
            ),
        ),
    ]
