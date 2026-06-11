from rest_framework import serializers

from apps.loglens.models import LoginAnomaly, LoginEvent


class LoginEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = LoginEvent
        fields = [
            "id",
            "organisation",
            "user_identifier",
            "timestamp",
            "ip_address",
            "country",
            "city",
            "device_id",
            "user_agent",
            "event_type",
            "success",
            "resource_accessed",
            "upload_batch",
            "created_at",
        ]
        read_only_fields = fields


class LoginAnomalySerializer(serializers.ModelSerializer):
    anomaly_type_display = serializers.CharField(source="get_anomaly_type_display", read_only=True)
    severity_display = serializers.CharField(source="get_severity_display", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    confidence_band = serializers.SerializerMethodField()
    linked_event_count = serializers.SerializerMethodField()

    class Meta:
        model = LoginAnomaly
        fields = [
            "id",
            "organisation",
            "user_identifier",
            "anomaly_type",
            "anomaly_type_display",
            "title",
            "description",
            "severity",
            "severity_display",
            "confidence",
            "confidence_band",
            "risk_score",
            "start_time",
            "end_time",
            "mitre_tactic",
            "mitre_technique",
            "evidence_detail",
            "status",
            "status_display",
            "risk_event",
            "linked_event_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "organisation",
            "anomaly_type_display",
            "severity_display",
            "status_display",
            "confidence_band",
            "linked_event_count",
            "created_at",
            "updated_at",
        ]

    def get_confidence_band(self, obj) -> str:
        c = obj.confidence
        if c < 0.4:
            return "low"
        if c < 0.7:
            return "medium"
        if c < 0.9:
            return "high"
        return "very_high"

    def get_linked_event_count(self, obj) -> int:
        return obj.linked_events.count()


class LoginAnomalyStatusUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = LoginAnomaly
        fields = ["status"]
