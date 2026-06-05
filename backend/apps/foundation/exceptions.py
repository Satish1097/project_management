"""
Global DRF exception handler — normalizes all errors to the standard shape.
"""
import logging

from django.core.exceptions import PermissionDenied
from django.http import Http404
from rest_framework import status
from rest_framework.exceptions import APIException, ValidationError
from rest_framework.views import exception_handler as drf_exception_handler

from apps.foundation.responses import error_response

logger = logging.getLogger("django.request")


def _normalize_errors(detail):
    """Convert DRF/django error detail into a flat dict suitable for clients."""
    if isinstance(detail, dict):
        return {key: _stringify(value) for key, value in detail.items()}
    if isinstance(detail, list):
        return {"non_field_errors": [_stringify(item) for item in detail]}
    return {"non_field_errors": [_stringify(detail)]}


def _stringify(value):
    if isinstance(value, list):
        return [_stringify(v) for v in value]
    return str(value)


def _handle_accounts_domain_error(exc):
    from apps.accounts.exceptions import (
        AccountAlreadyExistsError,
        AccountsDomainError,
        AuthenticationError,
        ExpiredInvitationError,
        InvalidInvitationError,
        InvalidProfileFieldError,
        InvalidRefreshTokenError,
        InvalidResetTokenError,
        InvitationAlreadyUsedError,
    )

    if not isinstance(exc, AccountsDomainError):
        return None

    status_map = {
        InvalidInvitationError: status.HTTP_400_BAD_REQUEST,
        ExpiredInvitationError: status.HTTP_400_BAD_REQUEST,
        InvitationAlreadyUsedError: status.HTTP_400_BAD_REQUEST,
        AccountAlreadyExistsError: status.HTTP_409_CONFLICT,
        AuthenticationError: status.HTTP_401_UNAUTHORIZED,
        InvalidResetTokenError: status.HTTP_400_BAD_REQUEST,
        InvalidRefreshTokenError: status.HTTP_400_BAD_REQUEST,
        InvalidProfileFieldError: status.HTTP_400_BAD_REQUEST,
    }
    status_code = status_map.get(type(exc), status.HTTP_400_BAD_REQUEST)
    return error_response(
        message=str(exc),
        errors={"detail": str(exc)},
        status=status_code,
    )


def _handle_organizations_domain_error(exc):
    from apps.organizations.exceptions import (
        OrganizationAccessDeniedError,
        OrganizationMembershipError,
        OrganizationNotFoundError,
        OrganizationsDomainError,
        OrganizationSlugConflictError,
    )

    if not isinstance(exc, OrganizationsDomainError):
        return None

    status_map = {
        OrganizationNotFoundError: status.HTTP_404_NOT_FOUND,
        OrganizationAccessDeniedError: status.HTTP_403_FORBIDDEN,
        OrganizationSlugConflictError: status.HTTP_409_CONFLICT,
        OrganizationMembershipError: status.HTTP_409_CONFLICT,
    }
    status_code = status_map.get(type(exc), status.HTTP_400_BAD_REQUEST)
    return error_response(
        message=str(exc),
        errors={"detail": str(exc)},
        status=status_code,
    )


def _handle_projects_domain_error(exc):
    from apps.projects.exceptions import (
        ProjectAccessDeniedError,
        ProjectArchivedError,
        ProjectKeyConflictError,
        ProjectMembershipError,
        ProjectNotFoundError,
        ProjectsDomainError,
        ProjectSlugConflictError,
    )

    if not isinstance(exc, ProjectsDomainError):
        return None

    status_map = {
        ProjectNotFoundError: status.HTTP_404_NOT_FOUND,
        ProjectAccessDeniedError: status.HTTP_403_FORBIDDEN,
        ProjectArchivedError: status.HTTP_400_BAD_REQUEST,
        ProjectKeyConflictError: status.HTTP_409_CONFLICT,
        ProjectSlugConflictError: status.HTTP_409_CONFLICT,
        ProjectMembershipError: status.HTTP_409_CONFLICT,
    }
    status_code = status_map.get(type(exc), status.HTTP_400_BAD_REQUEST)
    return error_response(
        message=str(exc),
        errors={"detail": str(exc)},
        status=status_code,
    )


def custom_exception_handler(exc, context):
    for handler in (
        _handle_accounts_domain_error,
        _handle_organizations_domain_error,
        _handle_projects_domain_error,
    ):
        domain_response = handler(exc)
        if domain_response is not None:
            logger.warning(
                "API error %s: %s",
                domain_response.status_code,
                str(exc),
            )
            return domain_response

    response = drf_exception_handler(exc, context)

    if response is not None:
        message = _extract_message(exc, response.status_code)
        errors = _normalize_errors(response.data)
        logger.warning(
            "API error %s: %s",
            response.status_code,
            message,
            exc_info=exc if response.status_code >= 500 else None,
        )
        return error_response(message=message, errors=errors, status=response.status_code)

    # Unhandled exceptions (not caught by DRF)
    if isinstance(exc, Http404):
        return error_response(
            message="Resource not found.",
            errors={"detail": "Not found."},
            status=status.HTTP_404_NOT_FOUND,
        )

    if isinstance(exc, PermissionDenied):
        return error_response(
            message="Permission denied.",
            errors={"detail": "You do not have permission to perform this action."},
            status=status.HTTP_403_FORBIDDEN,
        )

    if isinstance(exc, APIException):
        return error_response(
            message=str(exc.detail),
            errors=_normalize_errors(exc.detail),
            status=exc.status_code,
        )

    logger.exception("Unhandled exception in %s", context.get("view"))
    return error_response(
        message="An unexpected error occurred.",
        errors={"detail": "Internal server error."},
        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )


def _extract_message(exc, status_code):
    if isinstance(exc, ValidationError):
        return "Validation failed."
    if status_code == status.HTTP_404_NOT_FOUND:
        return "Resource not found."
    if status_code == status.HTTP_403_FORBIDDEN:
        return "Permission denied."
    if status_code == status.HTTP_401_UNAUTHORIZED:
        return "Authentication required."
    if hasattr(exc, "detail"):
        detail = exc.detail
        if isinstance(detail, str):
            return detail
        if isinstance(detail, list) and detail:
            return str(detail[0])
        if isinstance(detail, dict):
            first = next(iter(detail.values()), None)
            if first:
                return str(first[0] if isinstance(first, list) else first)
    return "Request failed."
