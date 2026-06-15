"""Domain exceptions for apps.organizations services (not DRF/HTTP exceptions)."""


class OrganizationsDomainError(Exception):
    """Base class for organizations domain errors."""


class OrganizationNotFoundError(OrganizationsDomainError):
    """Organization does not exist."""


class OrganizationSlugConflictError(OrganizationsDomainError):
    """Organization slug is already in use."""


class OrganizationAccessDeniedError(OrganizationsDomainError):
    """Actor lacks access to the organization."""


class OrganizationMembershipError(OrganizationsDomainError):
    """Organization membership operation failed."""
