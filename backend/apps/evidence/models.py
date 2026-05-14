from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class EvidenceItem(models.Model):
    class EvidenceType(models.TextChoices):
        CVE_MATCH = "cve_match", "CVE match"
        EPSS_SCORE = "epss_score", "EPSS score"
        KEV_MATCH = "kev_match", "KEV match"
        LOGIN_PATTERN = "login_pattern", "Login pattern"
        FILE_UPLOAD_SCAN = "file_upload_scan", "File upload scan"
        PII_DETECTION = "pii_detection", "PII detection"
        NARRATIVE_CLUSTER = "narrative_cluster", "Narrative cluster"
        SENTIMENT_SHIFT = "sentiment_shift", "Sentiment shift"
        KEYWORD_BURST = "keyword_burst", "Keyword burst"
        MANUAL_NOTE = "manual_note", "Manual note"

    organisation = models.ForeignKey(
        "organisations.Organisation",
        on_delete=models.CASCADE,
        related_name="evidence_items",
    )
    risk_event = models.ForeignKey(
        "risk.RiskEvent",
        on_delete=models.CASCADE,
        related_name="evidence_items",
    )
    evidence_type = models.CharField(
        max_length=40,
        choices=EvidenceType.choices,
        default=EvidenceType.MANUAL_NOTE,
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    source = models.CharField(max_length=255, blank=True)
    raw_reference = models.CharField(max_length=500, blank=True)
    observed_at = models.DateTimeField(blank=True, null=True)
    confidence = models.FloatField(
        blank=True,
        null=True,
        validators=[MinValueValidator(0.0), MaxValueValidator(1.0)],
    )
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return self.title
