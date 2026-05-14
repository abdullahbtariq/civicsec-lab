# Generated for CivicSec Lab core backend foundation.

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("organisations", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="Asset",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True, primary_key=True, serialize=False, verbose_name="ID"
                    ),
                ),
                ("name", models.CharField(max_length=255)),
                (
                    "asset_type",
                    models.CharField(
                        choices=[
                            ("web_app", "Web application"),
                            ("database", "Database"),
                            ("repository", "Repository"),
                            ("dataset", "Dataset"),
                            ("cloud_service", "Cloud service"),
                            ("staff_account_system", "Staff account system"),
                            ("social_media_channel", "Social media channel"),
                            ("internal_tool", "Internal tool"),
                            ("other", "Other"),
                        ],
                        default="other",
                        max_length=40,
                    ),
                ),
                ("description", models.TextField(blank=True)),
                ("owner_name", models.CharField(blank=True, max_length=255)),
                (
                    "criticality",
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
                ("internet_exposed", models.BooleanField(default=False)),
                (
                    "data_sensitivity",
                    models.CharField(
                        choices=[
                            ("public", "Public"),
                            ("internal", "Internal"),
                            ("confidential", "Confidential"),
                            ("sensitive", "Sensitive"),
                            ("highly_sensitive", "Highly sensitive"),
                        ],
                        default="internal",
                        max_length=30,
                    ),
                ),
                ("vendor", models.CharField(blank=True, max_length=255)),
                ("product", models.CharField(blank=True, max_length=255)),
                ("version", models.CharField(blank=True, max_length=120)),
                ("tags", models.JSONField(blank=True, default=list)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "created_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="created_assets",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "organisation",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="assets",
                        to="organisations.organisation",
                    ),
                ),
            ],
            options={"ordering": ["name"], "unique_together": {("organisation", "name")}},
        ),
    ]
