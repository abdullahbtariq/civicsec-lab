# Generated for CivicSec Lab core backend foundation.

import django.db.models.deletion
import django.utils.timezone
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("organisations", "0001_initial"),
        ("risk", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="Incident",
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
                    "severity",
                    models.CharField(
                        choices=[
                            ("low", "Low"),
                            ("medium", "Medium"),
                            ("high", "High"),
                            ("critical", "Critical"),
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
                            ("investigating", "Investigating"),
                            ("contained", "Contained"),
                            ("resolved", "Resolved"),
                            ("closed", "Closed"),
                            ("dismissed", "Dismissed"),
                        ],
                        default="open",
                        max_length=30,
                    ),
                ),
                (
                    "incident_type",
                    models.CharField(
                        choices=[
                            ("vulnerability_exposure", "Vulnerability exposure"),
                            ("suspected_account_compromise", "Suspected account compromise"),
                            ("data_privacy_issue", "Data privacy issue"),
                            ("online_harm_escalation", "Online harm escalation"),
                            ("mixed_civic_risk", "Mixed civic risk"),
                            ("manual", "Manual"),
                        ],
                        default="manual",
                        max_length=40,
                    ),
                ),
                ("opened_at", models.DateTimeField(default=django.utils.timezone.now)),
                ("closed_at", models.DateTimeField(blank=True, null=True)),
                ("timeline_summary", models.TextField(blank=True)),
                ("lessons_learned", models.TextField(blank=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "linked_risk_events",
                    models.ManyToManyField(
                        blank=True, related_name="incidents", to="risk.riskevent"
                    ),
                ),
                (
                    "organisation",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="incidents",
                        to="organisations.organisation",
                    ),
                ),
                (
                    "owner",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="owned_incidents",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={"ordering": ["-opened_at", "-created_at"]},
        ),
        migrations.CreateModel(
            name="IncidentTimelineEntry",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True, primary_key=True, serialize=False, verbose_name="ID"
                    ),
                ),
                ("timestamp", models.DateTimeField(default=django.utils.timezone.now)),
                (
                    "entry_type",
                    models.CharField(
                        choices=[
                            ("alert_created", "Alert created"),
                            ("status_changed", "Status changed"),
                            ("note_added", "Note added"),
                            ("action_completed", "Action completed"),
                            ("evidence_added", "Evidence added"),
                            ("report_generated", "Report generated"),
                            ("manual_update", "Manual update"),
                        ],
                        default="manual_update",
                        max_length=30,
                    ),
                ),
                ("title", models.CharField(max_length=255)),
                ("description", models.TextField(blank=True)),
                ("metadata", models.JSONField(blank=True, default=dict)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "actor",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="incident_timeline_entries",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "incident",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="timeline_entries",
                        to="incidents.incident",
                    ),
                ),
                (
                    "organisation",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="incident_timeline_entries",
                        to="organisations.organisation",
                    ),
                ),
            ],
            options={
                "verbose_name_plural": "incident timeline entries",
                "ordering": ["-timestamp", "-created_at"],
            },
        ),
    ]
