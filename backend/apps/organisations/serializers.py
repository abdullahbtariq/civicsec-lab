from rest_framework import serializers

from apps.organisations.models import Organisation


class OrganisationSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = Organisation
        fields = ["id", "name", "slug"]


class OrganisationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organisation
        fields = [
            "id",
            "name",
            "slug",
            "description",
            "sector",
            "country",
            "risk_profile",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
