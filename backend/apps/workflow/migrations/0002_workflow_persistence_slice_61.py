import django.db.models.deletion
import uuid
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("projects", "0003_project_next_issue_number"),
        ("workflow", "0001_initial"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="WorkflowScheme",
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
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("is_deleted", models.BooleanField(db_index=True, default=False)),
                ("deleted_at", models.DateTimeField(blank=True, null=True)),
                ("name", models.CharField(max_length=255)),
                (
                    "created_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="%(app_label)s_%(class)s_created",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "project",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="workflow_schemes",
                        to="projects.project",
                    ),
                ),
                (
                    "updated_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="%(app_label)s_%(class)s_updated",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "verbose_name": "workflow scheme",
                "verbose_name_plural": "workflow schemes",
            },
        ),
        migrations.RemoveConstraint(
            model_name="workflowstatus",
            name="workflow_workflowstatus_project_slug_uniq",
        ),
        migrations.RemoveConstraint(
            model_name="workflowtransition",
            name="workflow_workflowtransition_project_from_to_uniq",
        ),
        migrations.RemoveField(
            model_name="workflowstatus",
            name="is_terminal",
        ),
        migrations.RemoveField(
            model_name="workflowstatus",
            name="slug",
        ),
        migrations.RemoveField(
            model_name="workflowtransition",
            name="requires_approval",
        ),
        migrations.RenameField(
            model_name="workflowstatus",
            old_name="position",
            new_name="order",
        ),
        migrations.AddField(
            model_name="workflowstatus",
            name="color",
            field=models.CharField(default="#64748B", max_length=32),
            preserve_default=False,
        ),
        migrations.AlterField(
            model_name="workflowstatus",
            name="category",
            field=models.CharField(
                choices=[
                    ("todo", "Todo"),
                    ("in_progress", "In Progress"),
                    ("done", "Done"),
                ],
                max_length=20,
            ),
        ),
        migrations.AlterField(
            model_name="workflowstatus",
            name="order",
            field=models.PositiveIntegerField(),
        ),
        migrations.AlterField(
            model_name="workflowstatus",
            name="project",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="workflow_statuses",
                to="projects.project",
            ),
        ),
        migrations.AlterField(
            model_name="workflowtransition",
            name="project",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="workflow_transitions",
                to="projects.project",
            ),
        ),
        migrations.AddIndex(
            model_name="workflowstatus",
            index=models.Index(
                fields=["project", "order"],
                name="workflow_status_project_order_idx",
            ),
        ),
        migrations.AddConstraint(
            model_name="workflowscheme",
            constraint=models.UniqueConstraint(
                fields=("project",),
                name="workflow_scheme_project_uniq",
            ),
        ),
        migrations.AddConstraint(
            model_name="workflowstatus",
            constraint=models.UniqueConstraint(
                fields=("project", "name"),
                name="workflow_status_project_name_uniq",
            ),
        ),
        migrations.AddConstraint(
            model_name="workflowstatus",
            constraint=models.UniqueConstraint(
                condition=models.Q(is_default=True),
                fields=("project",),
                name="workflow_status_project_default_uniq",
            ),
        ),
        migrations.AddConstraint(
            model_name="workflowtransition",
            constraint=models.UniqueConstraint(
                fields=("project", "from_status", "to_status"),
                name="workflow_transition_project_from_to_uniq",
            ),
        ),
    ]
