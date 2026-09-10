from rest_framework.permissions import SAFE_METHODS, BasePermission


class IsAdminOrManager(BasePermission):
    """Write access limited to admins and managers; staff keep read access."""

    message = "Only administrators and managers may modify this resource."

    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated):
            return False
        if request.method in SAFE_METHODS:
            return True
        return user.is_superuser or user.role in {"admin", "manager"}


class IsAdmin(BasePermission):
    """Reserved for sensitive resources such as user administration."""

    message = "Only administrators may perform this action."

    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated):
            return False
        if request.method in SAFE_METHODS:
            return True
        return user.is_superuser or user.role == "admin"
