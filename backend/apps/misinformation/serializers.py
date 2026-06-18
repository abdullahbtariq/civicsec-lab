from rest_framework import serializers

from apps.misinformation.models import (
    DiscourseDataset,
    EntityMention,
    KeywordBurst,
    NarrativeCluster,
    PublicPost,
)


class DiscourseDatasetSerializer(serializers.ModelSerializer):
    processing_status_display = serializers.CharField(
        source="get_processing_status_display", read_only=True
    )
    cluster_count = serializers.SerializerMethodField()
    burst_count = serializers.SerializerMethodField()
    needs_review_count = serializers.SerializerMethodField()

    class Meta:
        model = DiscourseDataset
        fields = [
            "id",
            "original_filename",
            "row_count",
            "processing_status",
            "processing_status_display",
            "description",
            "error_message",
            "retention_policy",
            "uploaded_at",
            "processed_at",
            "detected_language",
            "cluster_count",
            "burst_count",
            "needs_review_count",
        ]
        read_only_fields = [
            "id",
            "row_count",
            "processing_status",
            "error_message",
            "uploaded_at",
            "processed_at",
            "detected_language",
        ]

    def get_cluster_count(self, obj):
        return obj.clusters.count()

    def get_burst_count(self, obj):
        return obj.keyword_bursts.count()

    def get_needs_review_count(self, obj):
        return obj.clusters.filter(status=NarrativeCluster.ClusterStatus.NEEDS_REVIEW).count()


class NarrativeClusterListSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    linked_risk_event_id = serializers.IntegerField(
        source="linked_risk_event.id", read_only=True, default=None
    )

    class Meta:
        model = NarrativeCluster
        fields = [
            "id",
            "dataset",
            "title",
            "cluster_size",
            "sentiment_score",
            "toxicity_signal",
            "growth_rate",
            "confidence",
            "status",
            "status_display",
            "start_time",
            "end_time",
            "representative_terms",
            "linked_risk_event_id",
            "created_at",
        ]


class NarrativeClusterDetailSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    linked_risk_event_id = serializers.IntegerField(
        source="linked_risk_event.id", read_only=True, default=None
    )

    class Meta:
        model = NarrativeCluster
        fields = [
            "id",
            "dataset",
            "title",
            "summary",
            "representative_terms",
            "representative_posts",
            "cluster_size",
            "start_time",
            "end_time",
            "sentiment_score",
            "toxicity_signal",
            "growth_rate",
            "confidence",
            "status",
            "status_display",
            "review_notes",
            "reviewed_at",
            "linked_risk_event_id",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "dataset",
            "title",
            "summary",
            "representative_terms",
            "representative_posts",
            "cluster_size",
            "start_time",
            "end_time",
            "sentiment_score",
            "toxicity_signal",
            "growth_rate",
            "confidence",
            "reviewed_at",
            "linked_risk_event_id",
            "created_at",
            "updated_at",
        ]


class KeywordBurstSerializer(serializers.ModelSerializer):
    class Meta:
        model = KeywordBurst
        fields = [
            "id",
            "keyword",
            "baseline_count",
            "burst_count",
            "burst_score",
            "start_time",
            "end_time",
            "related_cluster",
            "created_at",
        ]


class EntityMentionSerializer(serializers.ModelSerializer):
    entity_type_display = serializers.CharField(source="get_entity_type_display", read_only=True)

    class Meta:
        model = EntityMention
        fields = [
            "id",
            "entity_text",
            "entity_type",
            "entity_type_display",
            "count",
            "sentiment_average",
            "created_at",
        ]


class PublicPostSerializer(serializers.ModelSerializer):
    class Meta:
        model = PublicPost
        fields = [
            "id",
            "post_id",
            "timestamp",
            "author_identifier",
            "platform",
            "text",
            "url",
            "shared_url",
            "reply_to",
            "language",
            "engagement_count",
            "created_at",
        ]
