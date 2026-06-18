import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("organisations", "0001_initial"),
        ("risk", "0001_initial"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="DiscourseDataset",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True, primary_key=True, serialize=False, verbose_name="ID"
                    ),
                ),
                ("original_filename", models.CharField(max_length=255)),
                ("row_count", models.PositiveIntegerField(default=0)),
                (
                    "processing_status",
                    models.CharField(
                        choices=[
                            ("pending", "Pending"),
                            ("processing", "Processing"),
                            ("complete", "Complete"),
                            ("failed", "Failed"),
                        ],
                        default="pending",
                        max_length=20,
                    ),
                ),
                ("description", models.TextField(blank=True)),
                ("error_message", models.TextField(blank=True)),
                ("uploaded_at", models.DateTimeField(auto_now_add=True)),
                ("processed_at", models.DateTimeField(blank=True, null=True)),
                (
                    "retention_policy",
                    models.CharField(
                        choices=[
                            ("30_days", "30 days"),
                            ("90_days", "90 days"),
                            ("1_year", "1 year"),
                        ],
                        default="90_days",
                        max_length=20,
                    ),
                ),
                (
                    "organisation",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="discourse_datasets",
                        to="organisations.organisation",
                    ),
                ),
                (
                    "uploaded_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="discourse_datasets",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={"ordering": ["-uploaded_at"]},
        ),
        migrations.CreateModel(
            name="NarrativeCluster",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True, primary_key=True, serialize=False, verbose_name="ID"
                    ),
                ),
                ("title", models.CharField(max_length=255)),
                ("summary", models.TextField(blank=True)),
                ("representative_terms", models.JSONField(default=list)),
                ("representative_posts", models.JSONField(default=list)),
                ("cluster_size", models.PositiveIntegerField(default=0)),
                ("start_time", models.DateTimeField(blank=True, null=True)),
                ("end_time", models.DateTimeField(blank=True, null=True)),
                ("sentiment_score", models.FloatField(default=0.0)),
                ("toxicity_signal", models.FloatField(default=0.0)),
                ("growth_rate", models.FloatField(default=0.0)),
                ("confidence", models.FloatField(default=0.5)),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("unreviewed", "Unreviewed"),
                            ("needs_review", "Needs review"),
                            ("reviewed_benign", "Reviewed — benign"),
                            ("reviewed_concerning", "Reviewed — concerning"),
                            ("escalated", "Escalated"),
                        ],
                        default="unreviewed",
                        max_length=30,
                    ),
                ),
                ("review_notes", models.TextField(blank=True)),
                ("reviewed_at", models.DateTimeField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "dataset",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="clusters",
                        to="misinformation.discoursedataset",
                    ),
                ),
                (
                    "linked_risk_event",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="narrative_clusters",
                        to="risk.riskevent",
                    ),
                ),
                (
                    "reviewed_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="reviewed_clusters",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={"ordering": ["-cluster_size", "-created_at"]},
        ),
        migrations.CreateModel(
            name="PublicPost",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True, primary_key=True, serialize=False, verbose_name="ID"
                    ),
                ),
                ("post_id", models.CharField(blank=True, max_length=255)),
                ("timestamp", models.DateTimeField(blank=True, null=True)),
                ("author_identifier", models.CharField(blank=True, max_length=255)),
                ("platform", models.CharField(blank=True, max_length=100)),
                ("text", models.TextField()),
                ("url", models.CharField(blank=True, max_length=2000)),
                ("engagement_count", models.PositiveIntegerField(default=0)),
                ("reply_to", models.CharField(blank=True, max_length=255)),
                ("shared_url", models.CharField(blank=True, max_length=2000)),
                ("language", models.CharField(blank=True, default="en", max_length=10)),
                ("cleaned_text", models.TextField(blank=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "dataset",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="posts",
                        to="misinformation.discoursedataset",
                    ),
                ),
            ],
            options={"ordering": ["timestamp", "id"]},
        ),
        migrations.CreateModel(
            name="KeywordBurst",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True, primary_key=True, serialize=False, verbose_name="ID"
                    ),
                ),
                ("keyword", models.CharField(max_length=255)),
                ("baseline_count", models.PositiveIntegerField(default=0)),
                ("burst_count", models.PositiveIntegerField(default=0)),
                ("burst_score", models.FloatField(default=0.0)),
                ("start_time", models.DateTimeField(blank=True, null=True)),
                ("end_time", models.DateTimeField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "dataset",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="keyword_bursts",
                        to="misinformation.discoursedataset",
                    ),
                ),
                (
                    "related_cluster",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="keyword_bursts",
                        to="misinformation.narrativecluster",
                    ),
                ),
            ],
            options={"ordering": ["-burst_score"]},
        ),
        migrations.CreateModel(
            name="EntityMention",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True, primary_key=True, serialize=False, verbose_name="ID"
                    ),
                ),
                ("entity_text", models.CharField(max_length=255)),
                (
                    "entity_type",
                    models.CharField(
                        choices=[
                            ("person", "Person / Author"),
                            ("organisation", "Organisation"),
                            ("location", "Location"),
                            ("hashtag", "Hashtag"),
                            ("domain", "Domain"),
                            ("other", "Other"),
                        ],
                        default="other",
                        max_length=20,
                    ),
                ),
                ("count", models.PositiveIntegerField(default=0)),
                ("sentiment_average", models.FloatField(default=0.0)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "dataset",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="entity_mentions",
                        to="misinformation.discoursedataset",
                    ),
                ),
                (
                    "related_clusters",
                    models.ManyToManyField(
                        blank=True,
                        related_name="entity_mentions",
                        to="misinformation.narrativecluster",
                    ),
                ),
            ],
            options={"ordering": ["-count"]},
        ),
    ]
