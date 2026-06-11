from django.conf import settings
from django.db import models
from django.utils import timezone


class PlaybookTemplate(models.Model):
    """A reusable response checklist that can be applied to an incident."""

    organisation = models.ForeignKey(
        "organisations.Organisation",
        on_delete=models.CASCADE,
        related_name="playbook_templates",
        null=True,
        blank=True,
    )
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    incident_type = models.CharField(
        max_length=40,
        blank=True,
        help_text="Leave blank to apply to any incident type.",
    )
    is_builtin = models.BooleanField(
        default=False,
        help_text="True for system-provided templates (organisation is null).",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name


class PlaybookStep(models.Model):
    """An ordered step within a PlaybookTemplate."""

    template = models.ForeignKey(
        PlaybookTemplate,
        on_delete=models.CASCADE,
        related_name="steps",
    )
    order = models.PositiveSmallIntegerField(default=0)
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    estimated_minutes = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order"]

    def __str__(self) -> str:
        return f"{self.template.name} — {self.order}. {self.title}"


class Incident(models.Model):
    class Severity(models.TextChoices):
        LOW = "low", "Low"
        MEDIUM = "medium", "Medium"
        HIGH = "high", "High"
        CRITICAL = "critical", "Critical"

    class Status(models.TextChoices):
        OPEN = "open", "Open"
        INVESTIGATING = "investigating", "Investigating"
        CONTAINED = "contained", "Contained"
        RESOLVED = "resolved", "Resolved"
        CLOSED = "closed", "Closed"
        DISMISSED = "dismissed", "Dismissed"

    class IncidentType(models.TextChoices):
        VULNERABILITY_EXPOSURE = "vulnerability_exposure", "Vulnerability exposure"
        SUSPECTED_ACCOUNT_COMPROMISE = (
            "suspected_account_compromise",
            "Suspected account compromise",
        )
        DATA_PRIVACY_ISSUE = "data_privacy_issue", "Data privacy issue"
        ONLINE_HARM_ESCALATION = "online_harm_escalation", "Online harm escalation"
        MIXED_CIVIC_RISK = "mixed_civic_risk", "Mixed civic risk"
        MANUAL = "manual", "Manual"

    organisation = models.ForeignKey(
        "organisations.Organisation",
        on_delete=models.CASCADE,
        related_name="incidents",
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    severity = models.CharField(
        max_length=20,
        choices=Severity.choices,
        default=Severity.MEDIUM,
    )
    status = models.CharField(max_length=30, choices=Status.choices, default=Status.OPEN)
    incident_type = models.CharField(
        max_length=40,
        choices=IncidentType.choices,
        default=IncidentType.MANUAL,
    )
    opened_at = models.DateTimeField(default=timezone.now)
    closed_at = models.DateTimeField(blank=True, null=True)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="owned_incidents",
        blank=True,
        null=True,
    )
    linked_risk_events = models.ManyToManyField(
        "risk.RiskEvent",
        related_name="incidents",
        blank=True,
    )
    timeline_summary = models.TextField(blank=True)
    lessons_learned = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-opened_at", "-created_at"]

    def __str__(self) -> str:
        return self.title


class IncidentTask(models.Model):
    """An actionable task within an incident response workflow."""

    class TaskStatus(models.TextChoices):
        PENDING = "pending", "Pending"
        IN_PROGRESS = "in_progress", "In progress"
        DONE = "done", "Done"
        SKIPPED = "skipped", "Skipped"

    organisation = models.ForeignKey(
        "organisations.Organisation",
        on_delete=models.CASCADE,
        related_name="incident_tasks",
    )
    incident = models.ForeignKey(
        Incident,
        on_delete=models.CASCADE,
        related_name="tasks",
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    status = models.CharField(
        max_length=20,
        choices=TaskStatus.choices,
        default=TaskStatus.PENDING,
    )
    assignee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="assigned_incident_tasks",
        null=True,
        blank=True,
    )
    due_date = models.DateTimeField(null=True, blank=True)
    order = models.PositiveSmallIntegerField(default=0)
    playbook_step = models.ForeignKey(
        PlaybookStep,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="incident_tasks",
    )
    notes = models.TextField(blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["order", "created_at"]

    def __str__(self) -> str:
        return f"{self.incident.title} — {self.title}"


class IncidentTimelineEntry(models.Model):
    class EntryType(models.TextChoices):
        ALERT_CREATED = "alert_created", "Alert created"
        STATUS_CHANGED = "status_changed", "Status changed"
        NOTE_ADDED = "note_added", "Note added"
        ACTION_COMPLETED = "action_completed", "Action completed"
        EVIDENCE_ADDED = "evidence_added", "Evidence added"
        REPORT_GENERATED = "report_generated", "Report generated"
        MANUAL_UPDATE = "manual_update", "Manual update"

    organisation = models.ForeignKey(
        "organisations.Organisation",
        on_delete=models.CASCADE,
        related_name="incident_timeline_entries",
    )
    incident = models.ForeignKey(
        Incident,
        on_delete=models.CASCADE,
        related_name="timeline_entries",
    )
    timestamp = models.DateTimeField(default=timezone.now)
    entry_type = models.CharField(
        max_length=30,
        choices=EntryType.choices,
        default=EntryType.MANUAL_UPDATE,
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="incident_timeline_entries",
        blank=True,
        null=True,
    )
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-timestamp", "-created_at"]
        verbose_name_plural = "incident timeline entries"

    def __str__(self) -> str:
        return self.title
