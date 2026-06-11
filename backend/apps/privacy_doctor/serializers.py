"""DataPrivacy Doctor serializers."""

from rest_framework import serializers

from apps.privacy_doctor.models import DatasetColumnProfile, PrivacyFinding, UploadedDataset


class DatasetColumnProfileSerializer(serializers.ModelSerializer):
    inferred_type_display = serializers.CharField(
        source="get_inferred_type_display", read_only=True
    )
    privacy_category_display = serializers.CharField(
        source="get_privacy_category_display", read_only=True
    )

    class Meta:
        model = DatasetColumnProfile
        fields = [
            "id",
            "column_name",
            "inferred_type",
            "inferred_type_display",
            "privacy_category",
            "privacy_category_display",
            "uniqueness_ratio",
            "missingness_ratio",
            "sample_values_masked",
            "risk_score",
            "recommended_transformation",
            "notes",
        ]
        read_only_fields = fields


class PrivacyFindingSerializer(serializers.ModelSerializer):
    finding_type_display = serializers.CharField(source="get_finding_type_display", read_only=True)
    severity_display = serializers.CharField(source="get_severity_display", read_only=True)

    class Meta:
        model = PrivacyFinding
        fields = [
            "id",
            "finding_type",
            "finding_type_display",
            "title",
            "description",
            "severity",
            "severity_display",
            "confidence",
            "affected_columns",
            "evidence",
            "recommendation",
            "created_at",
        ]
        read_only_fields = fields


class UploadedDatasetSerializer(serializers.ModelSerializer):
    processing_status_display = serializers.CharField(
        source="get_processing_status_display", read_only=True
    )
    risk_band_display = serializers.CharField(source="get_risk_band_display", read_only=True)
    finding_count = serializers.SerializerMethodField()
    direct_identifier_count = serializers.SerializerMethodField()
    quasi_identifier_count = serializers.SerializerMethodField()
    sensitive_attribute_count = serializers.SerializerMethodField()

    class Meta:
        model = UploadedDataset
        fields = [
            "id",
            "original_filename",
            "file_size",
            "row_count",
            "column_count",
            "processing_status",
            "processing_status_display",
            "retention_policy",
            "original_file_deleted",
            "privacy_risk_score",
            "risk_band",
            "risk_band_display",
            "risk_event",
            "finding_count",
            "direct_identifier_count",
            "quasi_identifier_count",
            "sensitive_attribute_count",
            "uploaded_at",
            "processed_at",
        ]
        read_only_fields = fields

    def get_finding_count(self, obj):
        return obj.findings.count()

    def get_direct_identifier_count(self, obj):
        return obj.column_profiles.filter(privacy_category="direct_identifier").count()

    def get_quasi_identifier_count(self, obj):
        return obj.column_profiles.filter(privacy_category="quasi_identifier").count()

    def get_sensitive_attribute_count(self, obj):
        return obj.column_profiles.filter(privacy_category="sensitive_attribute").count()
