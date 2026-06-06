"""Domain exceptions for apps.sprints services — no DRF/HTTP imports."""


class SprintError(Exception):
    """Base class for sprint domain errors."""


class SprintNotFoundError(SprintError):
    """Sprint does not exist."""


class SprintAlreadyActiveError(SprintError):
    """Another sprint is already active in this project."""


class SprintCompletionError(SprintError):
    """Sprint cannot be completed — invalid state or rules violated."""


class ArchivedProjectSprintError(SprintError):
    """Write rejected — the project is archived."""
