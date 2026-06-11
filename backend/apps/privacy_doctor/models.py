"""DataPrivacy Doctor models."""

from django.db import models

from apps.organisations.models import Organisation
from apps.risk.models import RiskEvent


class UploadedDataset(models.Model):
    class ProcessingStatus(models.TextChoices):
        PENDING = "pending", "Pending"
        PROCESSING = "processing", "Processing"
        COMPLETE = "complete", "Complete"
        FAILED = "failed", "Failed"

    class RetentionPolicy(models.TextChoices):
        DELETE_AFTER_PROCESSING = "delete_after_processing", "Delete after processing"
        RETAIN_FOR_DEMO = "retain_for_demo", "Retain for demo"
        MANUAL_DELETE = "manual_delete", "Manual delete"

    class RiskBand(models.TextChoices):
        LOW = "low", "Low (0–20)"
        MODERATE = "moderate", "Moderate (21–45)"
        HIGH = "high", "High (46–70)"
        SEVERE = "severe", "Severe (71–100)"

    organisation = models.ForeignKey(
        Organisation, on_delete=models.CASCADE, related_name="privacy_datasets"
    )
    uploaded_by = models.ForeignKey(
        "accounts.User",
        null=True,
        on_delete=models.SET_NULL,
        related_name="uploaded_datasets",
    )
    original_filename = models.CharField(max_length=255)
    stored_file_path = models.CharField(max_length=500, blank=True)
    file_size = models.PositiveBigIntegerField(default=0)
    row_count = models.PositiveIntegerField(default=0)
    column_count = models.PositiveIntegerField(default=0)
    processing_status = models.CharField(
        max_length=20,
        choices=ProcessingStatus.choices,
        default=ProcessingStatus.PENDING,
    )
    retention_policy = models.CharField(
        max_length=30,
        choices=RetentionPolicy.choices,
        default=RetentionPolicy.DELETE_AFTER_PROCESSING,
    )
    original_file_deleted = models.BooleanField(default=False)
    privacy_risk_score = models.PositiveSmallIntegerField(default=0)
    risk_band = models.CharField(max_length=10, choices=RiskBand.choices, blank=True)
    risk_event = models.ForeignKey(
        RiskEvent, null=True, blank=True, on_delete=models.SET_NULL, related_name="privacy_datasets"
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-uploaded_at"]
        indexes = [
            models.Index(fields=["organisation", "processing_status"]),
            models.Index(fields=["organisation", "uploaded_at"]),
        ]

    def __str__(self):
        return f"{self.original_filename} ({self.organisation})"


class DatasetColumnProfile(models.Model):
    class InferredType(models.TextChoices):
        TEXT = "text", "Text"
        NUMERIC = "numeric", "Numeric"
        DATE = "date", "Date"
        EMAIL = "email", "Email"
        PHONE = "phone", "Phone"
        NAME = "name", "Name"
        ADDRESS = "address", "Address"
        IDENTIFIER = "identifier", "Identifier"
        CATEGORY = "category", "Category"
        FREE_TEXT = "free_text", "Free text"
        UNKNOWN = "unknown", "Unknown"

    class PrivacyCategory(models.TextChoices):
        DIRECT_IDENTIFIER = "direct_identifier", "Direct identifier"
        QUASI_IDENTIFIER = "quasi_identifier", "Quasi-identifier"
        SENSITIVE_ATTRIBUTE = "sensitive_attribute", "Sensitive attribute"
        FREE_TEXT_RISK = "free_text_risk", "Free-text risk"
        LOW_RISK = "low_risk", "Low risk"
        UNKNOWN = "unknown", "Unknown"

    dataset = models.ForeignKey(
        UploadedDataset, on_delete=models.CASCADE, related_name="column_profiles"
    )
    column_name = models.CharField(max_length=255)
    inferred_type = models.CharField(
        max_length=20, choices=InferredType.choices, default=InferredType.UNKNOWN
    )
    privacy_category = models.CharField(
        max_length=25, choices=PrivacyCategory.choices, default=PrivacyCategory.UNKNOWN
    )
    uniqueness_ratio = models.FloatField(default=0.0)
    missingness_ratio = models.FloatField(default=0.0)
    sample_values_masked = models.JSONField(default=list)
    risk_score = models.PositiveSmallIntegerField(default=0)
    recommended_transformation = models.CharField(max_length=100, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ["-risk_score", "column_name"]
        unique_together = [("dataset", "column_name")]

    def __str__(self):
        return f"{self.column_name} [{self.privacy_category}]"


class PrivacyFinding(models.Model):
    class FindingType(models.TextChoices):
        DIRECT_IDENTIFIER_DETECTED = "direct_identifier_detected", "Direct identifier detected"
        QUASI_IDENTIFIER_COMBINATION = (
            "quasi_identifier_combination",
            "Quasi-identifier combination",
        )
        HIGH_UNIQUENESS_COLUMN = "high_uniqueness_column", "High uniqueness column"
        SENSITIVE_ATTRIBUTE_DETECTED = (
            "sensitive_attribute_detected",
            "Sensitive attribute detected",
        )
        RISKY_FREE_TEXT = "risky_free_text", "Risky free text"
        SMALL_GROUP_REIDENTIFICATION_RISK = (
            "small_group_reidentification_risk",
            "Small-group re-identification risk",
        )
        EXCESSIVE_DATA_COLLECTION = "excessive_data_collection", "Excessive data collection"

    class Severity(models.TextChoices):
        LOW = "low", "Low"
        MEDIUM = "medium", "Medium"
        HIGH = "high", "High"
        CRITICAL = "critical", "Critical"

    dataset = models.ForeignKey(UploadedDataset, on_delete=models.CASCADE, related_name="findings")
    finding_type = models.CharField(max_length=40, choices=FindingType.choices)
    title = models.CharField(max_length=255)
    description = models.TextField()
    severity = models.CharField(max_length=10, choices=Severity.choices, default=Severity.MEDIUM)
    confidence = models.FloatField(default=0.8)
    affected_columns = models.JSONField(default=list)
    evidence = models.JSONField(default=dict)
    recommendation = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-severity", "finding_type"]
        indexes = [
            models.Index(fields=["dataset", "severity"]),
            models.Index(fields=["dataset", "finding_type"]),
        ]

    def __str__(self):
        return f"{self.title} [{self.severity}]"
