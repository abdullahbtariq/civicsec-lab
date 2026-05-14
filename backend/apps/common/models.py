from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class ProcessingJob(models.Model):
    class Status(models.TextChoices):
        QUEUED = "queued", "Queued"
        RUNNING = "running", "Running"
        COMPLETED = "completed", "Completed"
        FAILED = "failed", "Failed"
        CANCELLED = "cancelled", "Cancelled"

    class JobType(models.TextChoices):
        KEV_INGESTION = "kev_ingestion", "KEV ingestion"
        EPSS_ENRICHMENT = "epss_enrichment", "EPSS enrichment"
        DEPENDENCY_SCAN = "dependency_scan", "Dependency scan"
        LOG_DETECTION = "log_detection", "Log detection"
        PRIVACY_SCAN = "privacy_scan", "Privacy scan"
        DISCOURSE_PROCESSING = "discourse_processing", "Discourse processing"
        REPORT_GENERATION = "report_generation", "Report generation"
        DEMO_SEED = "demo_seed", "Demo seed"

    organisation = models.ForeignKey(
        "organisations.Organisation",
        on_delete=models.SET_NULL,
        related_name="processing_jobs",
        blank=True,
        null=True,
    )
    job_type = models.CharField(max_length=40, choices=JobType.choices)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.QUEUED)
    started_at = models.DateTimeField(blank=True, null=True)
    finished_at = models.DateTimeField(blank=True, null=True)
    error_message = models.TextField(blank=True)
    progress = models.PositiveSmallIntegerField(
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
    )
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.job_type} ({self.status})"
