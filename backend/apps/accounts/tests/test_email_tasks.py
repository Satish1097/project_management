import pytest
from django.core import mail

from apps.accounts.tasks import (
    send_password_reset_email,
    send_project_added_notification_email,
    send_project_invite_email,
)


@pytest.fixture(autouse=True)
def locmem_email_backend(settings):
    settings.EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"
    settings.DEFAULT_FROM_EMAIL = "noreply@example.com"


def test_send_project_invite_email_sends_signup_link():
    send_project_invite_email(
        "newuser@example.com",
        "http://localhost:5173/signup?invite_token=abc123",
        "Apollo",
        "Acme",
    )

    assert len(mail.outbox) == 1
    message = mail.outbox[0]
    assert message.to == ["newuser@example.com"]
    assert message.from_email == "noreply@example.com"
    assert message.subject == "You're invited to join Apollo"
    assert "http://localhost:5173/signup?invite_token=abc123" in message.body


def test_send_project_added_notification_email_sends_notification():
    send_project_added_notification_email("member@example.com", "Apollo", "Acme")

    assert len(mail.outbox) == 1
    message = mail.outbox[0]
    assert message.to == ["member@example.com"]
    assert message.subject == "You were added to Apollo"


def test_send_password_reset_email_sends_reset_link():
    send_password_reset_email(
        "user@example.com",
        "http://localhost:5173/reset-password?uid=abc&token=def",
    )

    assert len(mail.outbox) == 1
    message = mail.outbox[0]
    assert message.to == ["user@example.com"]
    assert "http://localhost:5173/reset-password?uid=abc&token=def" in message.body
