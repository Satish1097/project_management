from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from apps.organizations.models import Organization
from apps.organizations.services import create_organization

DEFAULT_SLUG = "internal"
DEFAULT_NAME = "Internal Organization"


class Command(BaseCommand):
    help = "Bootstrap the default internal organization for deployment."

    def handle(self, *args, **options):
        if Organization.objects.exists():
            self.stdout.write(
                self.style.WARNING("Organization already exists. Skipping bootstrap.")
            )
            return

        User = get_user_model()
        superuser = User.objects.filter(is_superuser=True).order_by("date_joined").first()
        if superuser is None:
            self.stderr.write(
                self.style.ERROR(
                    "No superuser found. Create one with `python manage.py createsuperuser` first."
                )
            )
            return

        create_organization(
            name=DEFAULT_NAME,
            slug=DEFAULT_SLUG,
            owner_user_id=superuser.id,
            creator=superuser,
        )
        self.stdout.write(
            self.style.SUCCESS(
                f"Default organization '{DEFAULT_SLUG}' created successfully."
            )
        )
