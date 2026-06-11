from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.utils import timezone


class LoginEvent(models.Model):
    """A single login-related event parsed from a log file or synthetic generator."""

    class EventType(models.TextChoices):
        LOGIN_SUCCESS = "login_success", "Login success"
        LOGIN_FAILED = "login_failed", "Login failed"
        LOGOUT = "logout", "Logout"
        PASSWORD_RESET = "password_reset", "Password reset"
        FILE_DOWNLOAD = "file_download", "File download"
        SETTINGS_CHANGE = "settings_change", "Settings change"
        MFA_CHALLENGE = "mfa_challenge", "MFA challenge"
        MFA_FAILED = "mfa_failed", "MFA failed"

    organisation = models.ForeignKey(
        "organisations.Organisation",
        on_delete=models.CASCADE,
        related_name="login_events",
    )
    # We use a string identifier so uploaded logs don't need to reference platform users.
    user_identifier = models.CharField(max_length=255)
    timestamp = models.DateTimeField()
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    country = models.CharField(max_length=100, blank=True)
    city = models.CharField(max_length=100, blank=True)
    device_id = models.CharField(max_length=255, blank=True)
    user_agent = models.TextField(blank=True)
    event_type = models.CharField(
        max_length=30,
        choices=EventType.choices,
        default=EventType.LOGIN_SUCCESS,
    )
    success = models.BooleanField(default=True)
    resource_accessed = models.CharField(max_length=255, blank=True)
    raw_metadata = models.JSONField(default=dict, blank=True)
    upload_batch = models.CharField(
        max_length=64,
        blank=True,
        help_text="Identifier for the CSV upload batch this event came from.",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-timestamp"]
        indexes = [
            models.Index(fields=["organisation", "user_identifier", "timestamp"]),
            models.Index(fields=["organisation", "event_type", "timestamp"]),
            models.Index(fields=["organisation", "success", "timestamp"]),
            models.Index(fields=["upload_batch"]),
        ]

    def __str__(self) -> str:
        return f"{self.user_identifier} — {self.event_type} @ {self.timestamp}"


class LoginAnomaly(models.Model):
    """
    An anomalous pattern detected in login events.

    This object is a decision-support signal. It does not confirm a security incident.
    Human review is required before escalation.
    """

    class AnomalyType(models.TextChoices):
        FAILED_LOGIN_BURST = "failed_login_burst", "Failed login burst"
        SUSPICIOUS_SUCCESS_AFTER_FAILURES = (
            "suspicious_success_after_failures",
            "Suspicious success after failures",
        )
        IMPOSSIBLE_TRAVEL = "impossible_travel", "Impossible travel"
        NEW_DEVICE = "new_device", "New device"
        UNUSUAL_TIME = "unusual_time", "Unusual time"
        SENSITIVE_ACCESS_AFTER_ANOMALY = (
            "sensitive_access_after_anomaly",
            "Sensitive access after anomaly",
        )

    class Severity(models.TextChoices):
        LOW = "low", "Low"
        MEDIUM = "medium", "Medium"
        HIGH = "high", "High"
        CRITICAL = "critical", "Critical"

    class Status(models.TextChoices):
        NEW = "new", "New"
        REVIEWED = "reviewed", "Reviewed"
        ESCALATED = "escalated", "Escalated"
        DISMISSED = "dismissed", "Dismissed"
        FALSE_POSITIVE = "false_positive", "False positive"

    organisation = models.ForeignKey(
        "organisations.Organisation",
        on_delete=models.CASCADE,
        related_name="login_anomalies",
    )
    user_identifier = models.CharField(max_length=255)
    anomaly_type = models.CharField(max_length=50, choices=AnomalyType.choices)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    severity = models.CharField(
        max_length=20,
        choices=Severity.choices,
        default=Severity.MEDIUM,
    )
    confidence = models.FloatField(
        default=0.5,
        validators=[MinValueValidator(0.0), MaxValueValidator(1.0)],
    )
    risk_score = models.PositiveSmallIntegerField(
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
    )
    start_time = models.DateTimeField()
    end_time = models.DateTimeField(default=timezone.now)
    linked_events = models.ManyToManyField(
        LoginEvent,
        related_name="anomalies",
        blank=True,
    )
    # MITRE ATT&CK-style pattern labels — used as cautious framing, not confirmed technique.
    mitre_tactic = models.CharField(max_length=120, blank=True)
    mitre_technique = models.CharField(max_length=120, blank=True)
    evidence_detail = models.JSONField(default=dict, blank=True)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.NEW,
    )
    risk_event = models.ForeignKey(
        "risk.RiskEvent",
        on_delete=models.SET_NULL,
        related_name="login_anomalies",
        blank=True,
        null=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at", "-risk_score"]
        indexes = [
            models.Index(fields=["organisation", "anomaly_type", "status"]),
            models.Index(fields=["organisation", "severity"]),
            models.Index(fields=["user_identifier"]),
        ]

    def __str__(self) -> str:
        return f"{self.anomaly_type} — {self.user_identifier} ({self.severity})"
