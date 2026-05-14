from rest_framework import serializers

from apps.common.serializers import OrganisationScopedSerializer
from apps.evidence.models import EvidenceItem
from apps.risk.models import RiskEvent


class EvidenceItemSerializer(OrganisationScopedSerializer):
    risk_event_id = serializers.PrimaryKeyRelatedField(
        source="risk_event",
        queryset=RiskEvent.objects.all(),
        write_only=True,
    )
    risk_event_title = serializers.CharField(source="risk_event.title", read_only=True)

    class Meta:
        model = EvidenceItem
        fields = [
            "id",
            "organisation",
            "organisation_id",
            "risk_event_id",
            "risk_event_title",
            "evidence_type",
            "title",
            "description",
            "source",
            "raw_reference",
            "observed_at",
            "confidence",
            "metadata",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]

    def validate(self, attrs):
        attrs = super().validate(attrs)
        request = self.context.get("request")
        user = getattr(request, "user", None)
        risk_event = attrs.get("risk_event")

        if (
            user
            and user.is_authenticated
            and not user.is_superuser
            and risk_event
            and risk_event.organisation_id != user.organisation_id
        ):
            raise serializers.ValidationError(
                {"risk_event_id": "Risk event must belong to your organisation."}
            )

        return attrs
