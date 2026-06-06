"""Domain exceptions for apps.workflow services (not DRF/HTTP exceptions)."""


class WorkflowError(Exception):
    """Base class for workflow domain errors."""


class WorkflowStatusNotFoundError(WorkflowError):
    """Workflow status does not exist for the project."""


class InvalidWorkflowTransitionError(WorkflowError):
    """Transition is not defined in the project workflow."""


class ForbiddenWorkflowTransitionError(WorkflowError):
    """Actor lacks permission for the requested transition."""
