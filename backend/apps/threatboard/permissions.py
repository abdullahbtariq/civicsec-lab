from rest_framework.permissions import BasePermission

from apps.accounts.models import User


class CanTriggerThreatboardRun(BasePermission):
    """Allow analysts and admins to trigger defensive ThreatBoard jobs."""

    allowed_roles = {User.Role.ADMIN, User.Role.ANALYST}

    def has_permission(self, request, view) -> bool:
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if user.is_superuser:
            return True
        return getattr(user, "role", "") in self.allowed_roles
