from celery import shared_task


@shared_task
def send_password_reset_email(email: str, reset_url: str) -> None:
    """Stub — real email sending deferred to a later slice."""
