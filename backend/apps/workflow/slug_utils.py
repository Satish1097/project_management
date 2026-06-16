from django.utils.text import slugify

from apps.workflow.constants import DEFAULT_STATUSES

_LEGACY_CATEGORY_TO_SLUG = {
    "pending": "todo",
    "active": "in_progress",
    "review": "in_review",
    "complete": "done",
    "blocked": "blocked",
}

_NAME_TO_SLUG = {status["name"].lower(): status["slug"] for status in DEFAULT_STATUSES}
_NAME_TO_SLUG["todo"] = "todo"

_CANONICAL_CATEGORIES = frozenset({"todo", "in_progress", "done"})


def status_slug(*, name: str, category: str) -> str:
    normalized_name = name.strip().lower()
    if normalized_name in _NAME_TO_SLUG:
        return _NAME_TO_SLUG[normalized_name]

    normalized_category = category.strip().lower()
    if normalized_category in _LEGACY_CATEGORY_TO_SLUG:
        return _LEGACY_CATEGORY_TO_SLUG[normalized_category]
    if normalized_category in _CANONICAL_CATEGORIES:
        return normalized_category

    base = normalized_category or normalized_name
    return slugify(base).replace("-", "_")


def normalize_category(*, name: str, category: str) -> str:
    slug = status_slug(name=name, category=category)
    if slug == "done":
        return "done"
    if slug in {"in_progress", "in_review"}:
        return "in_progress"
    return "todo"
