from rest_framework.permissions import SAFE_METHODS, BasePermission


def user_role(user) -> str:
    return getattr(user, "role", "")


class IsOrganisationScopedRole(BasePermission):
    """Allow reads for org members, writes for configured roles, deletes for admins."""

    default_write_roles = {"admin", "analyst"}
    default_delete_roles = {"admin"}

    def has_permission(self, request, view) -> bool:
        user = request.user
        if not user or not user.is_authenticated:
            return False
        if user.is_superuser:
            return True
        if request.method in SAFE_METHODS:
            return True
        if request.method == "DELETE":
            return user_role(user) in getattr(view, "delete_roles", self.default_delete_roles)
        return user_role(user) in getattr(view, "write_roles", self.default_write_roles)

    def has_object_permission(self, request, view, obj) -> bool:
        user = request.user
        if user.is_superuser:
            return True

        object_organisation = getattr(obj, "organisation", None)
        if object_organisation is None and obj.__class__.__name__ == "Organisation":
            object_organisation = obj

        if object_organisation is not None and object_organisation.id != user.organisation_id:
            return False

        return self.has_permission(request, view)
