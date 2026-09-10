"""Authentication endpoints, mounted at /api/auth/."""

from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView, TokenVerifyView

from .views import ChangePasswordView, LoginView, LogoutView, MeView, SetupView

urlpatterns = [
    path("login/", LoginView.as_view(), name="auth-login"),
    path("logout/", LogoutView.as_view(), name="auth-logout"),
    path("setup/", SetupView.as_view(), name="auth-setup"),
    path("me/", MeView.as_view(), name="auth-me"),
    path("refresh/", TokenRefreshView.as_view(), name="auth-refresh"),
    path("verify/", TokenVerifyView.as_view(), name="auth-verify"),
    path("change-password/", ChangePasswordView.as_view(), name="auth-change-password"),
]
