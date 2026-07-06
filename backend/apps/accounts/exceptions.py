"""Domain exceptions for apps.accounts services (not DRF/HTTP exceptions)."""


class AccountsDomainError(Exception):
    """Base class for accounts domain errors."""


class InvalidInvitationError(AccountsDomainError):
    """Invitation token does not match any record."""


class ExpiredInvitationError(AccountsDomainError):
    """Invitation has passed its expiry time."""


class InvitationAlreadyUsedError(AccountsDomainError):
    """Invitation has already been consumed."""


class PendingInvitationExistsError(AccountsDomainError):
    """A pending invitation already exists for the same target."""


class AccountAlreadyExistsError(AccountsDomainError):
    """An account already exists for the invitation email."""


class AuthenticationError(AccountsDomainError):
    """Email/password authentication failed."""


class InvalidResetTokenError(AccountsDomainError):
    """Password reset uid/token pair is invalid or expired."""


class InvalidRefreshTokenError(AccountsDomainError):
    """Refresh token is invalid or cannot be blacklisted."""


class InvalidProfileFieldError(AccountsDomainError):
    """Profile update includes a disallowed field."""
