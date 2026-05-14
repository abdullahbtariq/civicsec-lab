from django.db import models


class Organisation(models.Model):
    class RiskProfile(models.TextChoices):
        LOW = "low", "Low"
        MEDIUM = "medium", "Medium"
        HIGH = "high", "High"
        ELEVATED = "elevated", "Elevated"

    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True)
    description = models.TextField(blank=True)
    sector = models.CharField(max_length=120, blank=True)
    country = models.CharField(max_length=120, blank=True)
    risk_profile = models.CharField(
        max_length=20,
        choices=RiskProfile.choices,
        default=RiskProfile.MEDIUM,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name
