from rest_framework import serializers

from apps.assets.models import Asset
from apps.common.serializers import OrganisationScopedSerializer


class AssetSerializer(OrganisationScopedSerializer):
    created_by_email = serializers.EmailField(source="created_by.email", read_only=True)

    class Meta:
        model = Asset
        fields = [
            "id",
            "organisation",
            "organisation_id",
            "name",
            "asset_type",
            "description",
            "owner_name",
            "criticality",
            "internet_exposed",
            "data_sensitivity",
            "vendor",
            "product",
            "version",
            "tags",
            "created_by",
            "created_by_email",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_by", "created_by_email", "created_at", "updated_at"]
        validators = []

    def validate(self, attrs):
        attrs = super().validate(attrs)
        request = self.context.get("request")
        user = getattr(request, "user", None)
        organisation = attrs.get("organisation")

        if user and user.is_authenticated and not user.is_superuser:
            organisation = user.organisation

        if not organisation and self.instance:
            organisation = self.instance.organisation

        name = attrs.get("name") or getattr(self.instance, "name", None)
        if organisation and name:
            duplicate_assets = Asset.objects.filter(organisation=organisation, name=name)
            if self.instance:
                duplicate_assets = duplicate_assets.exclude(pk=self.instance.pk)
            if duplicate_assets.exists():
                raise serializers.ValidationError(
                    {"name": "An asset with this name already exists in this organisation."}
                )

        return attrs
