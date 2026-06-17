from django.contrib.auth import get_user_model

from apps.issues.models import IssueActivity


def _serialize_activity_value(value) -> str | None:
    if value is None:
        return None
    return str(value)


def get_user_display_value(user_id) -> str | None:
    if user_id is None:
        return None

    user_model = get_user_model()
    user = user_model.objects.filter(pk=user_id).first()
    if user is None:
        return str(user_id)

    display_name = (getattr(user, "display_name", "") or "").strip()
    if display_name:
        return display_name

    get_full_name = getattr(user, "get_full_name", None)
    if callable(get_full_name):
        full_name = (get_full_name() or "").strip()
        if full_name:
            return full_name

    email = (getattr(user, "email", "") or "").strip()
    if email:
        return email

    return str(user.id)


def create_issue_activity(
    *,
    issue_id,
    actor,
    event_type: str,
    old_value=None,
    new_value=None,
) -> IssueActivity:
    actor_id = getattr(actor, "id", None) if actor is not None else None
    return IssueActivity.objects.create(
        issue_id=issue_id,
        actor_id=actor_id,
        event_type=event_type,
        old_value=_serialize_activity_value(old_value),
        new_value=_serialize_activity_value(new_value),
    )
