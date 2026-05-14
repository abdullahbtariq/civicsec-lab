# Generated for CivicSec Lab core backend foundation.

import django.core.validators
import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        ("organisations", "0001_initial"),
        ("risk", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="EvidenceItem",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True, primary_key=True, serialize=False, verbose_name="ID"
                    ),
                ),
                (
                    "evidence_type",
                    models.CharField(
                        choices=[
                            ("cve_match", "CVE match"),
                            ("epss_score", "EPSS score"),
                            ("kev_match", "KEV match"),
                            ("login_pattern", "Login pattern"),
                            ("file_upload_scan", "File upload scan"),
                            ("pii_detection", "PII detection"),
                            ("narrative_cluster", "Narrative cluster"),
                            ("sentiment_shift", "Sentiment shift"),
                            ("keyword_burst", "Keyword burst"),
                            ("manual_note", "Manual note"),
                        ],
                        default="manual_note",
                        max_length=40,
                    ),
                ),
                ("title", models.CharField(max_length=255)),
                ("description", models.TextField(blank=True)),
                ("source", models.CharField(blank=True, max_length=255)),
                ("raw_reference", models.CharField(blank=True, max_length=500)),
                ("observed_at", models.DateTimeField(blank=True, null=True)),
                (
                    "confidence",
                    models.FloatField(
                        blank=True,
                        null=True,
                        validators=[
                            django.core.validators.MinValueValidator(0.0),
                            django.core.validators.MaxValueValidator(1.0),
                        ],
                    ),
                ),
                ("metadata", models.JSONField(blank=True, default=dict)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "organisation",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="evidence_items",
                        to="organisations.organisation",
                    ),
                ),
                (
                    "risk_event",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="evidence_items",
                        to="risk.riskevent",
                    ),
                ),
            ],
            options={"ordering": ["-created_at"]},
        ),
    ]
