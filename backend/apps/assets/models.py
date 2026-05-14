from django.conf import settings
from django.db import models


class Asset(models.Model):
    class AssetType(models.TextChoices):
        WEB_APP = "web_app", "Web application"
        DATABASE = "database", "Database"
        REPOSITORY = "repository", "Repository"
        DATASET = "dataset", "Dataset"
        CLOUD_SERVICE = "cloud_service", "Cloud service"
        STAFF_ACCOUNT_SYSTEM = "staff_account_system", "Staff account system"
        SOCIAL_MEDIA_CHANNEL = "social_media_channel", "Social media channel"
        INTERNAL_TOOL = "internal_tool", "Internal tool"
        OTHER = "other", "Other"

    class Criticality(models.TextChoices):
        LOW = "low", "Low"
        MEDIUM = "medium", "Medium"
        HIGH = "high", "High"
        CRITICAL = "critical", "Critical"

    class DataSensitivity(models.TextChoices):
        PUBLIC = "public", "Public"
        INTERNAL = "internal", "Internal"
        CONFIDENTIAL = "confidential", "Confidential"
        SENSITIVE = "sensitive", "Sensitive"
        HIGHLY_SENSITIVE = "highly_sensitive", "Highly sensitive"

    organisation = models.ForeignKey(
        "organisations.Organisation",
        on_delete=models.CASCADE,
        related_name="assets",
    )
    name = models.CharField(max_length=255)
    asset_type = models.CharField(
        max_length=40,
        choices=AssetType.choices,
        default=AssetType.OTHER,
    )
    description = models.TextField(blank=True)
    owner_name = models.CharField(max_length=255, blank=True)
    criticality = models.CharField(
        max_length=20,
        choices=Criticality.choices,
        default=Criticality.MEDIUM,
    )
    internet_exposed = models.BooleanField(default=False)
    data_sensitivity = models.CharField(
        max_length=30,
        choices=DataSensitivity.choices,
        default=DataSensitivity.INTERNAL,
    )
    vendor = models.CharField(max_length=255, blank=True)
    product = models.CharField(max_length=255, blank=True)
    version = models.CharField(max_length=120, blank=True)
    tags = models.JSONField(default=list, blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="created_assets",
        blank=True,
        null=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]
        unique_together = [("organisation", "name")]

    def __str__(self) -> str:
        return self.name
