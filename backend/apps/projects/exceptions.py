"""Domain exceptions for apps.projects services (not DRF/HTTP exceptions)."""


class ProjectsDomainError(Exception):
    """Base class for projects domain errors."""


class ProjectNotFoundError(ProjectsDomainError):
    """Project does not exist."""


class ProjectKeyConflictError(ProjectsDomainError):
    """Project key is already in use within the organization."""


class ProjectSlugConflictError(ProjectsDomainError):
    """Project slug is already in use within the organization."""


class ProjectAccessDeniedError(ProjectsDomainError):
    """Actor lacks access to the project."""


class ProjectMembershipError(ProjectsDomainError):
    """Project membership operation failed."""


class ProjectArchivedError(ProjectsDomainError):
    """Project is archived and read-only."""
