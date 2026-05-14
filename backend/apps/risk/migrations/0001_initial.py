# Generated for CivicSec Lab core backend foundation.

import django.core.validators
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("assets", "0001_initial"),
        ("organisations", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="RiskEvent",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True, primary_key=True, serialize=False, verbose_name="ID"
                    ),
                ),
                (
                    "source_module",
                    models.CharField(
                        choices=[
                            ("threatboard", "ThreatBoard"),
                            ("loglens", "LogLens"),
                            ("privacy_doctor", "DataPrivacy Doctor"),
                            ("misinformation_observatory", "Misinformation Observatory"),
                            ("incidentflow", "IncidentFlow"),
                            ("manual", "Manual"),
                        ],
                        default="manual",
                        max_length=40,
                    ),
                ),
                ("event_type", models.CharField(max_length=120)),
                ("title", models.CharField(max_length=255)),
                ("summary", models.TextField(blank=True)),
                (
                    "severity",
                    models.CharField(
                        choices=[
                            ("info", "Info"),
                            ("low", "Low"),
                            ("medium", "Medium"),
                            ("high", "High"),
                            ("critical", "Critical"),
                        ],
                        default="info",
                        max_length=20,
                    ),
                ),
                (
                    "confidence",
                    models.FloatField(
                        default=0.0,
                        validators=[
                            django.core.validators.MinValueValidator(0.0),
                            django.core.validators.MaxValueValidator(1.0),
                        ],
                    ),
                ),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("new", "New"),
                            ("triaged", "Triaged"),
                            ("investigating", "Investigating"),
                            ("resolved", "Resolved"),
                            ("dismissed", "Dismissed"),
                            ("false_positive", "False positive"),
                        ],
                        default="new",
                        max_length=30,
                    ),
                ),
                (
                    "risk_score",
                    models.PositiveSmallIntegerField(
                        default=0,
                        validators=[
                            django.core.validators.MinValueValidator(0),
                            django.core.validators.MaxValueValidator(100),
                        ],
                    ),
                ),
                ("evidence_summary", models.TextField(blank=True)),
                ("recommended_action_summary", models.TextField(blank=True)),
                ("mapped_frameworks", models.JSONField(blank=True, default=dict)),
                ("tags", models.JSONField(blank=True, default=list)),
                ("first_seen_at", models.DateTimeField(blank=True, null=True)),
                ("last_seen_at", models.DateTimeField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "affected_asset",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="risk_events",
                        to="assets.asset",
                    ),
                ),
                (
                    "affected_user",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="risk_events",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "organisation",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="risk_events",
                        to="organisations.organisation",
                    ),
                ),
            ],
            options={"ordering": ["-created_at", "-risk_score"]},
        ),
        migrations.CreateModel(
            name="ActionRecommendation",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True, primary_key=True, serialize=False, verbose_name="ID"
                    ),
                ),
                ("title", models.CharField(max_length=255)),
                ("description", models.TextField(blank=True)),
                (
                    "priority",
                    models.CharField(
                        choices=[
                            ("low", "Low"),
                            ("medium", "Medium"),
                            ("high", "High"),
                            ("urgent", "Urgent"),
                        ],
                        default="medium",
                        max_length=20,
                    ),
                ),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("open", "Open"),
                            ("in_progress", "In progress"),
                            ("done", "Done"),
                            ("dismissed", "Dismissed"),
                        ],
                        default="open",
                        max_length=20,
                    ),
                ),
                ("due_date", models.DateField(blank=True, null=True)),
                ("framework_mapping", models.JSONField(blank=True, default=dict)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "organisation",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="recommendations",
                        to="organisations.organisation",
                    ),
                ),
                (
                    "owner",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="owned_recommendations",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "risk_event",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="recommendations",
                        to="risk.riskevent",
                    ),
                ),
            ],
            options={"ordering": ["-created_at"]},
        ),
    ]
