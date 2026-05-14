from rest_framework import serializers

from apps.accounts.models import User
from apps.assets.models import Asset
from apps.common.serializers import OrganisationScopedSerializer
from apps.risk.models import ActionRecommendation, RiskEvent


class RiskEventSerializer(OrganisationScopedSerializer):
    affected_asset_id = serializers.PrimaryKeyRelatedField(
        source="affected_asset",
        queryset=Asset.objects.all(),
        write_only=True,
        required=False,
        allow_null=True,
    )
    affected_user_id = serializers.PrimaryKeyRelatedField(
        source="affected_user",
        queryset=User.objects.all(),
        write_only=True,
        required=False,
        allow_null=True,
    )
    affected_asset_name = serializers.CharField(source="affected_asset.name", read_only=True)
    affected_user_email = serializers.EmailField(source="affected_user.email", read_only=True)
    severity_rank = serializers.IntegerField(read_only=True)
    confidence_band = serializers.CharField(read_only=True)
    is_open = serializers.BooleanField(read_only=True)

    class Meta:
        model = RiskEvent
        fields = [
            "id",
            "organisation",
            "organisation_id",
            "source_module",
            "event_type",
            "title",
            "summary",
            "severity",
            "confidence",
            "confidence_band",
            "status",
            "affected_asset_id",
            "affected_asset_name",
            "affected_user_id",
            "affected_user_email",
            "risk_score",
            "severity_rank",
            "is_open",
            "evidence_summary",
            "recommended_action_summary",
            "mapped_frameworks",
            "tags",
            "first_seen_at",
            "last_seen_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "confidence_band",
            "severity_rank",
            "is_open",
            "created_at",
            "updated_at",
        ]

    def validate(self, attrs):
        attrs = super().validate(attrs)
        request = self.context.get("request")
        user = getattr(request, "user", None)
        user_org_id = getattr(user, "organisation_id", None)

        if user and user.is_authenticated and not user.is_superuser:
            affected_asset = attrs.get("affected_asset")
            affected_user = attrs.get("affected_user")

            if affected_asset and affected_asset.organisation_id != user_org_id:
                raise serializers.ValidationError(
                    {"affected_asset_id": "Asset must belong to your organisation."}
                )
            if affected_user and affected_user.organisation_id != user_org_id:
                raise serializers.ValidationError(
                    {"affected_user_id": "User must belong to your organisation."}
                )

        return attrs


class ActionRecommendationSerializer(OrganisationScopedSerializer):
    risk_event_id = serializers.PrimaryKeyRelatedField(
        source="risk_event",
        queryset=RiskEvent.objects.all(),
        write_only=True,
    )
    risk_event_title = serializers.CharField(source="risk_event.title", read_only=True)
    owner_id = serializers.PrimaryKeyRelatedField(
        source="owner",
        queryset=User.objects.all(),
        write_only=True,
        required=False,
        allow_null=True,
    )
    owner_email = serializers.EmailField(source="owner.email", read_only=True)

    class Meta:
        model = ActionRecommendation
        fields = [
            "id",
            "organisation",
            "organisation_id",
            "risk_event_id",
            "risk_event_title",
            "title",
            "description",
            "priority",
            "status",
            "owner_id",
            "owner_email",
            "due_date",
            "framework_mapping",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate(self, attrs):
        attrs = super().validate(attrs)
        request = self.context.get("request")
        user = getattr(request, "user", None)
        user_org_id = getattr(user, "organisation_id", None)

        if user and user.is_authenticated and not user.is_superuser:
            risk_event = attrs.get("risk_event")
            owner = attrs.get("owner")

            if risk_event and risk_event.organisation_id != user_org_id:
                raise serializers.ValidationError(
                    {"risk_event_id": "Risk event must belong to your organisation."}
                )
            if owner and owner.organisation_id != user_org_id:
                raise serializers.ValidationError(
                    {"owner_id": "Owner must belong to your organisation."}
                )

        return attrs
