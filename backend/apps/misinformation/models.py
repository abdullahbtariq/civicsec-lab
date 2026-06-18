"""Models for the Misinformation Observatory module."""

from django.conf import settings
from django.db import models


class DiscourseDataset(models.Model):
    """A CSV upload of public posts for narrative analysis."""

    class ProcessingStatus(models.TextChoices):
        PENDING = "pending", "Pending"
        PROCESSING = "processing", "Processing"
        COMPLETE = "complete", "Complete"
        FAILED = "failed", "Failed"

    class RetentionPolicy(models.TextChoices):
        SHORT = "30_days", "30 days"
        MEDIUM = "90_days", "90 days"
        LONG = "1_year", "1 year"

    organisation = models.ForeignKey(
        "organisations.Organisation",
        on_delete=models.CASCADE,
        related_name="discourse_datasets",
    )
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="discourse_datasets",
    )
    original_filename = models.CharField(max_length=255)
    row_count = models.PositiveIntegerField(default=0)
    processing_status = models.CharField(
        max_length=20,
        choices=ProcessingStatus.choices,
        default=ProcessingStatus.PENDING,
    )
    description = models.TextField(blank=True)
    error_message = models.TextField(blank=True)
    detected_language = models.CharField(
        max_length=10,
        blank=True,
        default="",
        help_text="ISO 639-1 code of the dominant language detected in this dataset.",
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(null=True, blank=True)
    retention_policy = models.CharField(
        max_length=20,
        choices=RetentionPolicy.choices,
        default=RetentionPolicy.MEDIUM,
    )

    class Meta:
        ordering = ["-uploaded_at"]

    def __str__(self) -> str:
        return f"{self.original_filename} ({self.organisation})"


class PublicPost(models.Model):
    """A single post/message within a DiscourseDataset."""

    dataset = models.ForeignKey(
        DiscourseDataset,
        on_delete=models.CASCADE,
        related_name="posts",
    )
    post_id = models.CharField(max_length=255, blank=True)
    timestamp = models.DateTimeField(null=True, blank=True)
    author_identifier = models.CharField(max_length=255, blank=True)
    platform = models.CharField(max_length=100, blank=True)
    text = models.TextField()
    url = models.CharField(max_length=2000, blank=True)
    engagement_count = models.PositiveIntegerField(default=0)
    reply_to = models.CharField(max_length=255, blank=True)
    shared_url = models.CharField(max_length=2000, blank=True)
    language = models.CharField(max_length=10, blank=True, default="en")
    cleaned_text = models.TextField(blank=True)
    cluster = models.ForeignKey(
        "NarrativeCluster",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="posts",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["timestamp", "id"]

    def __str__(self) -> str:
        return f"Post {self.post_id or self.id} ({self.dataset_id})"


class NarrativeCluster(models.Model):
    """A group of semantically similar posts detected by the NLP pipeline."""

    class ClusterStatus(models.TextChoices):
        UNREVIEWED = "unreviewed", "Unreviewed"
        NEEDS_REVIEW = "needs_review", "Needs review"
        REVIEWED_BENIGN = "reviewed_benign", "Reviewed — benign"
        REVIEWED_CONCERNING = "reviewed_concerning", "Reviewed — concerning"
        ESCALATED = "escalated", "Escalated"

    dataset = models.ForeignKey(
        DiscourseDataset,
        on_delete=models.CASCADE,
        related_name="clusters",
    )
    title = models.CharField(max_length=255)
    summary = models.TextField(blank=True)
    representative_terms = models.JSONField(default=list)
    representative_posts = models.JSONField(default=list)
    cluster_size = models.PositiveIntegerField(default=0)
    start_time = models.DateTimeField(null=True, blank=True)
    end_time = models.DateTimeField(null=True, blank=True)
    sentiment_score = models.FloatField(default=0.0)  # -1.0 to 1.0
    toxicity_signal = models.FloatField(default=0.0)  # 0.0 to 1.0
    growth_rate = models.FloatField(default=0.0)  # fraction of posts in recent window
    confidence = models.FloatField(default=0.5)  # 0.0 to 1.0
    status = models.CharField(
        max_length=30,
        choices=ClusterStatus.choices,
        default=ClusterStatus.UNREVIEWED,
    )
    review_notes = models.TextField(blank=True)
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reviewed_clusters",
    )
    reviewed_at = models.DateTimeField(null=True, blank=True)
    linked_risk_event = models.ForeignKey(
        "risk.RiskEvent",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="narrative_clusters",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-cluster_size", "-created_at"]

    def __str__(self) -> str:
        return f"{self.title} ({self.cluster_size} posts)"


class KeywordBurst(models.Model):
    """A keyword that appeared significantly more frequently in the recent window."""

    dataset = models.ForeignKey(
        DiscourseDataset,
        on_delete=models.CASCADE,
        related_name="keyword_bursts",
    )
    keyword = models.CharField(max_length=255)
    baseline_count = models.PositiveIntegerField(default=0)
    burst_count = models.PositiveIntegerField(default=0)
    burst_score = models.FloatField(default=0.0)
    start_time = models.DateTimeField(null=True, blank=True)
    end_time = models.DateTimeField(null=True, blank=True)
    related_cluster = models.ForeignKey(
        NarrativeCluster,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="keyword_bursts",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-burst_score"]

    def __str__(self) -> str:
        return f"Burst: {self.keyword} ({self.burst_score:.2f}×)"


class EntityMention(models.Model):
    """A recurring entity (hashtag, domain, author) within a dataset."""

    class EntityType(models.TextChoices):
        PERSON = "person", "Person / Author"
        ORGANISATION = "organisation", "Organisation"
        LOCATION = "location", "Location"
        HASHTAG = "hashtag", "Hashtag"
        DOMAIN = "domain", "Domain"
        OTHER = "other", "Other"

    dataset = models.ForeignKey(
        DiscourseDataset,
        on_delete=models.CASCADE,
        related_name="entity_mentions",
    )
    entity_text = models.CharField(max_length=255)
    entity_type = models.CharField(
        max_length=20,
        choices=EntityType.choices,
        default=EntityType.OTHER,
    )
    count = models.PositiveIntegerField(default=0)
    sentiment_average = models.FloatField(default=0.0)
    related_clusters = models.ManyToManyField(
        NarrativeCluster,
        blank=True,
        related_name="entity_mentions",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-count"]

    def __str__(self) -> str:
        return f"{self.entity_type}: {self.entity_text} ({self.count})"
