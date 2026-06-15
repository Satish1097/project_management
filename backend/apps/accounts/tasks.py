from celery import shared_task


@shared_task
def send_password_reset_email(email: str, reset_url: str) -> None:
    """Stub — real email sending deferred to a later slice."""


@shared_task
def send_project_invite_email(
    email: str,
    signup_url: str,
    project_name: str,
    organization_name: str,
) -> None:
    """Stub — sends signup link for a new user invited to a project."""


@shared_task
def send_project_added_notification_email(
    email: str,
    project_name: str,
    organization_name: str,
) -> None:
    """Stub — notifies an existing user they were added to a project."""
