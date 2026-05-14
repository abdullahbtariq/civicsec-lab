from rest_framework import serializers

from apps.assets.models import Asset
from apps.common.serializers import OrganisationScopedSerializer
from apps.organisations.serializers import OrganisationSummarySerializer
from apps.threatboard.models import (
    AssetVulnerabilityMatch,
    ThreatIngestionRun,
    Vulnerability,
    VulnerabilityScore,
)


class ThreatBoardAssetSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = Asset
        fields = [
            "id",
            "name",
            "asset_type",
            "criticality",
            "internet_exposed",
            "data_sensitivity",
            "vendor",
            "product",
        ]


class VulnerabilityScoreSerializer(serializers.ModelSerializer):
    cve_id = serializers.CharField(source="vulnerability.cve_id", read_only=True)

    class Meta:
        model = VulnerabilityScore
        fields = [
            "id",
            "vulnerability",
            "cve_id",
            "epss_score",
            "epss_percentile",
            "cvss_score",
            "cvss_severity",
            "kev_known_exploited",
            "last_epss_checked_at",
            "last_scored_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "cve_id", "created_at", "updated_at"]


class VulnerabilitySerializer(serializers.ModelSerializer):
    score = VulnerabilityScoreSerializer(read_only=True)

    class Meta:
        model = Vulnerability
        fields = [
            "id",
            "cve_id",
            "title",
            "description",
            "vendor",
            "product",
            "date_added_to_kev",
            "due_date",
            "known_ransomware_campaign_use",
            "required_action",
            "notes",
            "cwe",
            "source",
            "source_url",
            "score",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class AssetVulnerabilityMatchSerializer(OrganisationScopedSerializer):
    asset = ThreatBoardAssetSummarySerializer(read_only=True)
    vulnerability = VulnerabilitySerializer(read_only=True)
    asset_id = serializers.PrimaryKeyRelatedField(
        source="asset",
        queryset=Asset.objects.all(),
        write_only=True,
        required=False,
    )
    vulnerability_id = serializers.PrimaryKeyRelatedField(
        source="vulnerability",
        queryset=Vulnerability.objects.all(),
        write_only=True,
        required=False,
    )

    class Meta:
        model = AssetVulnerabilityMatch
        fields = [
            "id",
            "organisation",
            "organisation_id",
            "asset",
            "asset_id",
            "vulnerability",
            "vulnerability_id",
            "match_method",
            "match_confidence",
            "exposure_score",
            "calculated_risk_score",
            "risk_band",
            "status",
            "remediation_status",
            "explanation",
            "notes",
            "first_seen_at",
            "last_seen_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "exposure_score",
            "calculated_risk_score",
            "risk_band",
            "first_seen_at",
            "last_seen_at",
            "created_at",
            "updated_at",
        ]

    def validate(self, attrs):
        attrs = super().validate(attrs)
        request = self.context.get("request")
        user = getattr(request, "user", None)
        user_org_id = getattr(user, "organisation_id", None)
        asset = attrs.get("asset")
        vulnerability = attrs.get("vulnerability")

        if self.instance is None and (asset is None or vulnerability is None):
            raise serializers.ValidationError(
                {"asset_id": "Asset and vulnerability are required for manual matches."}
            )

        if user and user.is_authenticated and not user.is_superuser:
            if asset and asset.organisation_id != user_org_id:
                raise serializers.ValidationError(
                    {"asset_id": "Asset must belong to your organisation."}
                )

        return attrs


class ThreatIngestionRunSerializer(serializers.ModelSerializer):
    organisation = OrganisationSummarySerializer(read_only=True)

    class Meta:
        model = ThreatIngestionRun
        fields = [
            "id",
            "organisation",
            "run_type",
            "status",
            "source",
            "started_at",
            "finished_at",
            "records_seen",
            "records_created",
            "records_updated",
            "records_failed",
            "error_message",
            "metadata",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields
