"""Domain exceptions for apps.label services — no DRF/HTTP imports."""


class LabelError(Exception):
    """Base class for label domain errors."""


class LabelNotFoundError(LabelError):
    """Label does not exist."""


class LabelDuplicateError(LabelError):
    """Duplicate label name exists in this project."""
