import uuid

import django.core.validators
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("projects", "0003_project_next_issue_number"),
    ]

    operations = [
        migrations.CreateModel(
            name="Label",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                ("name", models.CharField(max_length=50)),
                (
                    "color",
                    models.CharField(
                        max_length=7,
                        validators=[
                            django.core.validators.RegexValidator(
                                message="Color must be a hex string in #RRGGBB format.",
                                regex="^#[0-9A-Fa-f]{6}$",
                            )
                        ],
                    ),
                ),
                ("is_archived", models.BooleanField(default=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "project",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="labels",
                        to="projects.project",
                    ),
                ),
            ],
            options={
                "verbose_name": "label",
                "verbose_name_plural": "labels",
                "indexes": [
                    models.Index(
                        fields=["project", "is_archived"],
                        name="label_label_project_4a8f2d_idx",
                    )
                ],
                "constraints": [
                    models.UniqueConstraint(
                        fields=("project", "name"),
                        name="label_label_project_name_uniq",
                    )
                ],
            },
        ),
    ]
