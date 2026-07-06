import os
from uuid import UUID

from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode

from apps.accounts.exceptions import InvalidResetTokenError
from apps.accounts.models import User
from apps.accounts.selectors import select_user_by_email
from apps.accounts.tasks import send_password_reset_email

_token_generator = PasswordResetTokenGenerator()


def _frontend_url() -> str:
    return os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip("/")


def request_password_reset(email: str) -> None:
    user = select_user_by_email(email)
    if user is not None:
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = _token_generator.make_token(user)
        reset_url = f"{_frontend_url()}/reset-password?uid={uid}&token={token}"
        send_password_reset_email.delay(user.email, reset_url)


def reset_password(uid: str, token: str, password: str) -> None:
    user = _get_user_from_uid(uid)
    if user is None or not _token_generator.check_token(user, token):
        raise InvalidResetTokenError("Invalid or expired password reset link.")

    user.set_password(password)
    user.save(update_fields=["password"])


def _get_user_from_uid(uid: str) -> User | None:
    try:
        user_id = force_str(urlsafe_base64_decode(uid))
        return User.objects.get(pk=UUID(user_id))
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        return None
