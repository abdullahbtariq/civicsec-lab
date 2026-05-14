# Generated for CivicSec Lab core backend foundation.

import django.core.validators
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        ("organisations", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="ProcessingJob",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True, primary_key=True, serialize=False, verbose_name="ID"
                    ),
                ),
                (
                    "job_type",
                    models.CharField(
                        choices=[
                            ("kev_ingestion", "KEV ingestion"),
                            ("epss_enrichment", "EPSS enrichment"),
                            ("dependency_scan", "Dependency scan"),
                            ("log_detection", "Log detection"),
                            ("privacy_scan", "Privacy scan"),
                            ("discourse_processing", "Discourse processing"),
                            ("report_generation", "Report generation"),
                            ("demo_seed", "Demo seed"),
                        ],
                        max_length=40,
                    ),
                ),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("queued", "Queued"),
                            ("running", "Running"),
                            ("completed", "Completed"),
                            ("failed", "Failed"),
                            ("cancelled", "Cancelled"),
                        ],
                        default="queued",
                        max_length=20,
                    ),
                ),
                ("started_at", models.DateTimeField(blank=True, null=True)),
                ("finished_at", models.DateTimeField(blank=True, null=True)),
                ("error_message", models.TextField(blank=True)),
                (
                    "progress",
                    models.PositiveSmallIntegerField(
                        default=0,
                        validators=[
                            django.core.validators.MinValueValidator(0),
                            django.core.validators.MaxValueValidator(100),
                        ],
                    ),
                ),
                ("metadata", models.JSONField(blank=True, default=dict)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "organisation",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="processing_jobs",
                        to="organisations.organisation",
                    ),
                ),
            ],
            options={"ordering": ["-created_at"]},
        ),
    ]
