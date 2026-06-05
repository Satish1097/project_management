from django.urls import path

from apps.accounts.api.views import (
    ForgotPasswordView,
    LoginView,
    LogoutView,
    MeContextView,
    MeView,
    RefreshTokenView,
    RegisterView,
    ResetPasswordView,
)

urlpatterns = [
    path("auth/register", RegisterView.as_view(), name="auth-register"),
    path("auth/login", LoginView.as_view(), name="auth-login"),
    path("auth/refresh", RefreshTokenView.as_view(), name="auth-refresh"),
    path("auth/logout", LogoutView.as_view(), name="auth-logout"),
    path("auth/password/forgot", ForgotPasswordView.as_view(), name="auth-password-forgot"),
    path("auth/password/reset", ResetPasswordView.as_view(), name="auth-password-reset"),
    path("me", MeView.as_view(), name="me"),
    path("me/context", MeContextView.as_view(), name="me-context"),
]
