from rest_framework.exceptions import PermissionDenied

from apps.common.viewsets import OrganisationScopedModelViewSet
from apps.organisations.models import Organisation
from apps.organisations.serializers import OrganisationSerializer


class OrganisationViewSet(OrganisationScopedModelViewSet):
    queryset = Organisation.objects.all()
    serializer_class = OrganisationSerializer
    write_roles = {"admin"}
    delete_roles = {"admin"}

    def perform_create(self, serializer):
        if not self.request.user.is_superuser:
            raise PermissionDenied("Only superusers can create organisations.")
        serializer.save()

    def perform_destroy(self, instance):
        if not self.request.user.is_superuser:
            raise PermissionDenied("Only superusers can delete organisations.")
        super().perform_destroy(instance)
