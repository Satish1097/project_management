from django.core.management.base import BaseCommand

from apps.contracts.workflow_contract import get_workflow_config, seed_default_workflow
from apps.projects.models import Project


class Command(BaseCommand):
    help = "Seed the frozen default workflow for projects missing workflow configuration."

    def handle(self, *args, **options):
        projects = Project.objects.all().order_by("created_at")
        if not projects.exists():
            self.stdout.write(self.style.WARNING("No projects found."))
            return

        seeded = 0
        skipped = 0

        for project in projects:
            config = get_workflow_config(project.id)
            if config.statuses:
                self.stdout.write(
                    self.style.WARNING(
                        f"Skipping {project.key} ({project.name}) — workflow already seeded."
                    )
                )
                skipped += 1
                continue

            seed_default_workflow(project.id)
            self.stdout.write(
                self.style.SUCCESS(
                    f"Seeded default workflow for {project.key} ({project.name})."
                )
            )
            seeded += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Done. Seeded: {seeded}, skipped: {skipped}, total: {seeded + skipped}."
            )
        )
