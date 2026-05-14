from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class RiskEvent(models.Model):
    class SourceModule(models.TextChoices):
        THREATBOARD = "threatboard", "ThreatBoard"
        LOGLENS = "loglens", "LogLens"
        PRIVACY_DOCTOR = "privacy_doctor", "DataPrivacy Doctor"
        MISINFORMATION_OBSERVATORY = (
            "misinformation_observatory",
            "Misinformation Observatory",
        )
        INCIDENTFLOW = "incidentflow", "IncidentFlow"
        MANUAL = "manual", "Manual"

    class Severity(models.TextChoices):
        INFO = "info", "Info"
        LOW = "low", "Low"
        MEDIUM = "medium", "Medium"
        HIGH = "high", "High"
        CRITICAL = "critical", "Critical"

    class Status(models.TextChoices):
        NEW = "new", "New"
        TRIAGED = "triaged", "Triaged"
        INVESTIGATING = "investigating", "Investigating"
        RESOLVED = "resolved", "Resolved"
        DISMISSED = "dismissed", "Dismissed"
        FALSE_POSITIVE = "false_positive", "False positive"

    SEVERITY_RANKS = {
        Severity.INFO: 0,
        Severity.LOW: 1,
        Severity.MEDIUM: 2,
        Severity.HIGH: 3,
        Severity.CRITICAL: 4,
    }
    OPEN_STATUSES = {Status.NEW, Status.TRIAGED, Status.INVESTIGATING}

    organisation = models.ForeignKey(
        "organisations.Organisation",
        on_delete=models.CASCADE,
        related_name="risk_events",
    )
    source_module = models.CharField(
        max_length=40,
        choices=SourceModule.choices,
        default=SourceModule.MANUAL,
    )
    event_type = models.CharField(max_length=120)
    title = models.CharField(max_length=255)
    summary = models.TextField(blank=True)
    severity = models.CharField(
        max_length=20,
        choices=Severity.choices,
        default=Severity.INFO,
    )
    confidence = models.FloatField(
        default=0.0,
        validators=[MinValueValidator(0.0), MaxValueValidator(1.0)],
    )
    status = models.CharField(max_length=30, choices=Status.choices, default=Status.NEW)
    affected_asset = models.ForeignKey(
        "assets.Asset",
        on_delete=models.SET_NULL,
        related_name="risk_events",
        blank=True,
        null=True,
    )
    affected_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="risk_events",
        blank=True,
        null=True,
    )
    risk_score = models.PositiveSmallIntegerField(
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
    )
    evidence_summary = models.TextField(blank=True)
    recommended_action_summary = models.TextField(blank=True)
    mapped_frameworks = models.JSONField(default=dict, blank=True)
    tags = models.JSONField(default=list, blank=True)
    first_seen_at = models.DateTimeField(blank=True, null=True)
    last_seen_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at", "-risk_score"]

    def __str__(self) -> str:
        return self.title

    @property
    def severity_rank(self) -> int:
        return self.SEVERITY_RANKS.get(self.severity, 0)

    @property
    def confidence_band(self) -> str:
        if self.confidence < 0.4:
            return "low"
        if self.confidence < 0.7:
            return "medium"
        if self.confidence < 0.9:
            return "high"
        return "very_high"

    @property
    def is_open(self) -> bool:
        return self.status in self.OPEN_STATUSES


class ActionRecommendation(models.Model):
    class Priority(models.TextChoices):
        LOW = "low", "Low"
        MEDIUM = "medium", "Medium"
        HIGH = "high", "High"
        URGENT = "urgent", "Urgent"

    class Status(models.TextChoices):
        OPEN = "open", "Open"
        IN_PROGRESS = "in_progress", "In progress"
        DONE = "done", "Done"
        DISMISSED = "dismissed", "Dismissed"

    organisation = models.ForeignKey(
        "organisations.Organisation",
        on_delete=models.CASCADE,
        related_name="recommendations",
    )
    risk_event = models.ForeignKey(
        RiskEvent,
        on_delete=models.CASCADE,
        related_name="recommendations",
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    priority = models.CharField(
        max_length=20,
        choices=Priority.choices,
        default=Priority.MEDIUM,
    )
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.OPEN)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="owned_recommendations",
        blank=True,
        null=True,
    )
    due_date = models.DateField(blank=True, null=True)
    framework_mapping = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return self.title
