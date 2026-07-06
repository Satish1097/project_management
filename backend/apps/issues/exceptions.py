"""Domain exceptions for apps.issues services — no DRF/HTTP imports."""


class IssueError(Exception):
    """Base class for issue domain errors."""


class IssueNotFoundError(IssueError):
    """Issue does not exist."""


class IssueTransitionError(IssueError):
    """Transition failed — invalid path or insufficient permission."""


class IssueAssignmentError(IssueError):
    """Assignment failed — invalid assignee or permission denied."""


class IssueValidationError(IssueError):
    """Validation failed for issue create or update."""


class ArchivedProjectIssueError(IssueError):
    """Write rejected — the project is archived."""
