import re

from django.core.exceptions import ValidationError
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.utils import timezone

CVE_PATTERN = re.compile(r"^CVE-\d{4}-\d{4,}$")


class Vulnerability(models.Model):
    class Source(models.TextChoices):
        CISA_KEV = "cisa_kev", "CISA KEV"
        MANUAL = "manual", "Manual"
        OSV = "osv", "OSV"
        OTHER = "other", "Other"

    cve_id = models.CharField(max_length=32, unique=True)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    vendor = models.CharField(max_length=255, blank=True)
    product = models.CharField(max_length=255, blank=True)
    date_added_to_kev = models.DateField(blank=True, null=True)
    due_date = models.DateField(blank=True, null=True)
    known_ransomware_campaign_use = models.BooleanField(default=False)
    required_action = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    cwe = models.CharField(max_length=120, blank=True)
    source = models.CharField(max_length=20, choices=Source.choices, default=Source.MANUAL)
    source_url = models.URLField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["cve_id"]
        indexes = [
            models.Index(fields=["cve_id"]),
            models.Index(fields=["vendor"]),
            models.Index(fields=["product"]),
            models.Index(fields=["source"]),
            models.Index(fields=["date_added_to_kev"]),
        ]

    def __str__(self) -> str:
        return self.cve_id

    def save(self, *args, **kwargs):
        self.cve_id = self.normalize_cve_id(self.cve_id)
        return super().save(*args, **kwargs)

    def clean(self) -> None:
        super().clean()
        self.cve_id = self.normalize_cve_id(self.cve_id)
        if not CVE_PATTERN.match(self.cve_id):
            raise ValidationError({"cve_id": "Use a CVE identifier like CVE-2024-1234."})

    @staticmethod
    def normalize_cve_id(value: str) -> str:
        return (value or "").strip().upper()


class VulnerabilityScore(models.Model):
    class CvssSeverity(models.TextChoices):
        NONE = "none", "None"
        LOW = "low", "Low"
        MEDIUM = "medium", "Medium"
        HIGH = "high", "High"
        CRITICAL = "critical", "Critical"
        UNKNOWN = "unknown", "Unknown"

    vulnerability = models.OneToOneField(
        Vulnerability,
        on_delete=models.CASCADE,
        related_name="score",
    )
    epss_score = models.FloatField(
        blank=True,
        null=True,
        validators=[MinValueValidator(0.0), MaxValueValidator(1.0)],
    )
    epss_percentile = models.FloatField(
        blank=True,
        null=True,
        validators=[MinValueValidator(0.0), MaxValueValidator(1.0)],
    )
    cvss_score = models.DecimalField(
        max_digits=3,
        decimal_places=1,
        blank=True,
        null=True,
        validators=[MinValueValidator(0), MaxValueValidator(10)],
    )
    cvss_severity = models.CharField(
        max_length=20,
        choices=CvssSeverity.choices,
        default=CvssSeverity.UNKNOWN,
    )
    kev_known_exploited = models.BooleanField(default=False)
    last_epss_checked_at = models.DateTimeField(blank=True, null=True)
    last_scored_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["vulnerability__cve_id"]

    def __str__(self) -> str:
        return f"Score for {self.vulnerability.cve_id}"


class AssetVulnerabilityMatch(models.Model):
    class MatchMethod(models.TextChoices):
        EXACT_VENDOR_PRODUCT = "exact_vendor_product", "Exact vendor/product"
        DEPENDENCY_FILE = "dependency_file", "Dependency file"
        MANUAL = "manual", "Manual"
        KEYWORD_MATCH = "keyword_match", "Keyword match"
        SBOM_MATCH = "sbom_match", "SBOM match"

    class RiskBand(models.TextChoices):
        LOW = "low", "Low"
        MEDIUM = "medium", "Medium"
        HIGH = "high", "High"
        CRITICAL = "critical", "Critical"

    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        DISMISSED = "dismissed", "Dismissed"
        RESOLVED = "resolved", "Resolved"
        FALSE_POSITIVE = "false_positive", "False positive"

    class RemediationStatus(models.TextChoices):
        UNREVIEWED = "unreviewed", "Unreviewed"
        AFFECTED = "affected", "Affected"
        NOT_AFFECTED = "not_affected", "Not affected"
        PATCHED = "patched", "Patched"
        MITIGATED = "mitigated", "Mitigated"
        ACCEPTED_RISK = "accepted_risk", "Accepted risk"

    organisation = models.ForeignKey(
        "organisations.Organisation",
        on_delete=models.CASCADE,
        related_name="vulnerability_matches",
    )
    asset = models.ForeignKey(
        "assets.Asset",
        on_delete=models.CASCADE,
        related_name="vulnerability_matches",
    )
    vulnerability = models.ForeignKey(
        Vulnerability,
        on_delete=models.CASCADE,
        related_name="asset_matches",
    )
    match_method = models.CharField(
        max_length=40,
        choices=MatchMethod.choices,
        default=MatchMethod.MANUAL,
    )
    match_confidence = models.FloatField(
        default=0.0,
        validators=[MinValueValidator(0.0), MaxValueValidator(1.0)],
    )
    exposure_score = models.PositiveSmallIntegerField(
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
    )
    calculated_risk_score = models.PositiveSmallIntegerField(
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
    )
    risk_band = models.CharField(
        max_length=20,
        choices=RiskBand.choices,
        default=RiskBand.LOW,
    )
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE)
    remediation_status = models.CharField(
        max_length=30,
        choices=RemediationStatus.choices,
        default=RemediationStatus.UNREVIEWED,
    )
    explanation = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    first_seen_at = models.DateTimeField(default=timezone.now)
    last_seen_at = models.DateTimeField(default=timezone.now)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-calculated_risk_score", "asset__name", "vulnerability__cve_id"]
        constraints = [
            models.UniqueConstraint(
                fields=["organisation", "asset", "vulnerability"],
                name="unique_asset_vulnerability_match",
            )
        ]
        indexes = [
            models.Index(fields=["organisation", "risk_band"]),
            models.Index(fields=["organisation", "status"]),
            models.Index(fields=["remediation_status"]),
        ]

    def __str__(self) -> str:
        return f"{self.asset.name} - {self.vulnerability.cve_id}"


class ThreatIngestionRun(models.Model):
    class RunType(models.TextChoices):
        KEV_INGESTION = "kev_ingestion", "KEV ingestion"
        EPSS_ENRICHMENT = "epss_enrichment", "EPSS enrichment"
        ASSET_MATCHING = "asset_matching", "Asset matching"
        RISK_SCORING = "risk_scoring", "Risk scoring"

    class Status(models.TextChoices):
        QUEUED = "queued", "Queued"
        RUNNING = "running", "Running"
        COMPLETED = "completed", "Completed"
        FAILED = "failed", "Failed"
        COMPLETED_WITH_ERRORS = "completed_with_errors", "Completed with errors"

    class Source(models.TextChoices):
        CISA_KEV = "cisa_kev", "CISA KEV"
        FIRST_EPSS = "first_epss", "FIRST EPSS"
        INTERNAL = "internal", "Internal"
        MANUAL = "manual", "Manual"

    organisation = models.ForeignKey(
        "organisations.Organisation",
        on_delete=models.SET_NULL,
        related_name="threat_ingestion_runs",
        blank=True,
        null=True,
    )
    run_type = models.CharField(max_length=30, choices=RunType.choices)
    status = models.CharField(max_length=30, choices=Status.choices, default=Status.QUEUED)
    source = models.CharField(max_length=30, choices=Source.choices, default=Source.INTERNAL)
    started_at = models.DateTimeField(default=timezone.now)
    finished_at = models.DateTimeField(blank=True, null=True)
    records_seen = models.PositiveIntegerField(default=0)
    records_created = models.PositiveIntegerField(default=0)
    records_updated = models.PositiveIntegerField(default=0)
    records_failed = models.PositiveIntegerField(default=0)
    error_message = models.TextField(blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["run_type", "status"]),
            models.Index(fields=["source"]),
            models.Index(fields=["organisation", "run_type"]),
        ]

    def __str__(self) -> str:
        return f"{self.get_run_type_display()} - {self.status}"
