from rest_framework import serializers

from apps.accounts.models import User
from apps.common.serializers import OrganisationScopedSerializer
from apps.incidents.models import Incident, IncidentTimelineEntry
from apps.risk.models import RiskEvent


class IncidentSerializer(OrganisationScopedSerializer):
    owner_id = serializers.PrimaryKeyRelatedField(
        source="owner",
        queryset=User.objects.all(),
        write_only=True,
        required=False,
        allow_null=True,
    )
    owner_email = serializers.EmailField(source="owner.email", read_only=True)
    linked_risk_event_ids = serializers.PrimaryKeyRelatedField(
        source="linked_risk_events",
        queryset=RiskEvent.objects.all(),
        many=True,
        write_only=True,
        required=False,
    )
    linked_risk_events = serializers.PrimaryKeyRelatedField(many=True, read_only=True)

    class Meta:
        model = Incident
        fields = [
            "id",
            "organisation",
            "organisation_id",
            "title",
            "description",
            "severity",
            "status",
            "incident_type",
            "opened_at",
            "closed_at",
            "owner_id",
            "owner_email",
            "linked_risk_event_ids",
            "linked_risk_events",
            "timeline_summary",
            "lessons_learned",
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
            owner = attrs.get("owner")
            linked_risk_events = attrs.get("linked_risk_events", [])

            if owner and owner.organisation_id != user_org_id:
                raise serializers.ValidationError(
                    {"owner_id": "Owner must belong to your organisation."}
                )
            for risk_event in linked_risk_events:
                if risk_event.organisation_id != user_org_id:
                    raise serializers.ValidationError(
                        {"linked_risk_event_ids": "Risk events must belong to your organisation."}
                    )

        return attrs


class IncidentTimelineEntrySerializer(OrganisationScopedSerializer):
    incident = serializers.PrimaryKeyRelatedField(read_only=True)
    incident_id = serializers.PrimaryKeyRelatedField(
        source="incident",
        queryset=Incident.objects.all(),
        write_only=True,
    )
    incident_title = serializers.CharField(source="incident.title", read_only=True)
    actor_id = serializers.PrimaryKeyRelatedField(
        source="actor",
        queryset=User.objects.all(),
        write_only=True,
        required=False,
        allow_null=True,
    )
    actor_email = serializers.EmailField(source="actor.email", read_only=True)

    class Meta:
        model = IncidentTimelineEntry
        fields = [
            "id",
            "organisation",
            "organisation_id",
            "incident",
            "incident_id",
            "incident_title",
            "timestamp",
            "entry_type",
            "title",
            "description",
            "actor_id",
            "actor_email",
            "metadata",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]

    def validate(self, attrs):
        attrs = super().validate(attrs)
        request = self.context.get("request")
        user = getattr(request, "user", None)
        user_org_id = getattr(user, "organisation_id", None)

        if user and user.is_authenticated and not user.is_superuser:
            incident = attrs.get("incident")
            actor = attrs.get("actor")

            if incident and incident.organisation_id != user_org_id:
                raise serializers.ValidationError(
                    {"incident_id": "Incident must belong to your organisation."}
                )
            if actor and actor.organisation_id != user_org_id:
                raise serializers.ValidationError(
                    {"actor_id": "Actor must belong to your organisation."}
                )

        return attrs
