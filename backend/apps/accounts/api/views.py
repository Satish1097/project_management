from drf_spectacular.utils import extend_schema
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenRefreshView

from apps.accounts.api.serializers import (
    ForgotPasswordSerializer,
    LoginSerializer,
    LogoutSerializer,
    ProfileUpdateSerializer,
    RegisterSerializer,
    ResetPasswordSerializer,
)
from apps.accounts.services import (
    login_user,
    logout_user,
    register_user,
    request_password_reset,
    reset_password,
    update_profile,
)
from apps.accounts.selectors import select_me
from apps.contracts.identity_contract import UserDTO
from apps.contracts.organization_contract import get_organizations_for_user
from apps.contracts.project_contract import get_projects_for_organization
from apps.foundation.responses import success_response


def _user_to_data(user: UserDTO) -> dict:
    return {
        "id": str(user.id),
        "email": user.email,
        "display_name": user.display_name,
        "avatar": user.avatar,
        "timezone": user.timezone,
    }


class RegisterView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(request=RegisterSerializer, tags=["auth"])
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = register_user(**serializer.validated_data)
        return success_response(
            data={
                "user": _user_to_data(result["user"]),
                "tokens": result["tokens"],
            },
            status=201,
        )


class LoginView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(request=LoginSerializer, tags=["auth"])
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = login_user(**serializer.validated_data)
        return success_response(
            data={
                "user": _user_to_data(result["user"]),
                "tokens": result["tokens"],
            },
        )


class RefreshTokenView(TokenRefreshView):
    permission_classes = [AllowAny]

    @extend_schema(tags=["auth"])
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        return success_response(data=response.data)


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(request=LogoutSerializer, tags=["auth"])
    def post(self, request):
        serializer = LogoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        logout_user(serializer.validated_data["refresh"])
        return success_response(message="Logged out successfully.")


class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(request=ForgotPasswordSerializer, tags=["auth"])
    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        request_password_reset(serializer.validated_data["email"])
        return success_response(
            message="If an account exists, a reset link has been sent.",
        )


class ResetPasswordView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(request=ResetPasswordSerializer, tags=["auth"])
    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        reset_password(**serializer.validated_data)
        return success_response(message="Password reset successfully.")


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["auth"])
    def get(self, request):
        user = select_me(request.user)
        return success_response(data=_user_to_data(user))

    @extend_schema(request=ProfileUpdateSerializer, tags=["auth"])
    def patch(self, request):
        serializer = ProfileUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        user = update_profile(request.user, **serializer.validated_data)
        return success_response(data=_user_to_data(user))


def _organization_summary_to_data(org) -> dict:
    return {
        "id": str(org.id),
        "name": org.name,
        "slug": org.slug,
        "role": org.role,
        "is_active": org.is_active,
        "project_count": org.project_count,
        "member_count": org.member_count,
    }


def _project_summary_to_data(project) -> dict:
    return {
        "id": str(project.id),
        "key": project.key,
        "slug": project.slug,
        "name": project.name,
        "status": project.status,
        "open_issue_count": project.open_issue_count,
        "active_sprint_id": (
            str(project.active_sprint_id) if project.active_sprint_id else None
        ),
    }


class MeContextView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(tags=["auth"])
    def get(self, request):
        user = select_me(request.user)
        organizations = get_organizations_for_user(request.user.id)
        projects = []
        for organization in organizations:
            projects.extend(
                get_projects_for_organization(organization.id, request.user.id)
            )
        return success_response(
            data={
                "user": _user_to_data(user),
                "organizations": [_organization_summary_to_data(o) for o in organizations],
                "projects": [_project_summary_to_data(p) for p in projects],
            },
        )
