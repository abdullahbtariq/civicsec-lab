from django.core.exceptions import FieldDoesNotExist
from rest_framework import serializers, viewsets

from apps.common.permissions import IsOrganisationScopedRole


class OrganisationScopedModelViewSet(viewsets.ModelViewSet):
    permission_classes = [IsOrganisationScopedRole]

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user

        if not user or not user.is_authenticated:
            return queryset.none()
        if user.is_superuser:
            return queryset

        if not user.organisation_id:
            return queryset.none()

        model = queryset.model
        if model.__name__ == "Organisation":
            return queryset.filter(id=user.organisation_id)

        try:
            model._meta.get_field("organisation")
        except FieldDoesNotExist:
            return queryset.none()

        return queryset.filter(organisation_id=user.organisation_id)

    def perform_create(self, serializer):
        user = self.request.user
        save_kwargs = {}
        model = serializer.Meta.model

        try:
            model._meta.get_field("organisation")
            has_organisation_field = True
        except FieldDoesNotExist:
            has_organisation_field = False

        if has_organisation_field:
            if not user.is_superuser:
                if not user.organisation_id:
                    raise serializers.ValidationError(
                        {"organisation": "Your account is not assigned to an organisation."}
                    )
                save_kwargs["organisation"] = user.organisation

        try:
            model._meta.get_field("created_by")
            has_created_by_field = True
        except FieldDoesNotExist:
            has_created_by_field = False

        if has_created_by_field and not serializer.validated_data.get("created_by"):
            save_kwargs["created_by"] = user

        serializer.save(**save_kwargs)
