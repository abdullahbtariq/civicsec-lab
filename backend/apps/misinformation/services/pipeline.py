"""Main NLP pipeline orchestrator for Misinformation Observatory."""

from __future__ import annotations

import logging
from collections import Counter

from django.utils import timezone

from apps.misinformation.models import (
    DiscourseDataset,
    EntityMention,
    KeywordBurst,
    NarrativeCluster,
    PublicPost,
)
from apps.misinformation.services.clustering import cluster_posts
from apps.misinformation.services.keyword_burst import detect_keyword_bursts
from apps.misinformation.services.language import prepare_for_sentiment
from apps.misinformation.services.risk_events import (
    generate_risk_events_for_bursts,
    generate_risk_events_for_clusters,
)
from apps.misinformation.services.sentiment import score_sentiment, score_toxicity
from apps.misinformation.services.text_processing import (
    clean_text,
    extract_domain,
    extract_hashtags,
    extract_mentions,
)

logger = logging.getLogger(__name__)

_HOSTILE_THRESHOLD = -0.3
_TOXICITY_THRESHOLD = 0.3
_GROWTH_THRESHOLD = 0.3
_MIN_CLUSTER_SIZE_FOR_REVIEW = 5


def process_dataset(dataset_id: int) -> None:
    """Entry point. Loads a DiscourseDataset by id and runs the full NLP pipeline."""
    try:
        dataset = DiscourseDataset.objects.get(pk=dataset_id)
    except DiscourseDataset.DoesNotExist:
        logger.error("DiscourseDataset %s not found", dataset_id)
        return

    dataset.processing_status = DiscourseDataset.ProcessingStatus.PROCESSING
    dataset.save(update_fields=["processing_status"])

    try:
        _run_pipeline(dataset)
        dataset.processing_status = DiscourseDataset.ProcessingStatus.COMPLETE
        dataset.processed_at = timezone.now()
        dataset.error_message = ""
        dataset.save(update_fields=["processing_status", "processed_at", "error_message"])
    except Exception as exc:
        logger.exception("Pipeline failed for dataset %s", dataset_id)
        dataset.processing_status = DiscourseDataset.ProcessingStatus.FAILED
        dataset.error_message = str(exc)[:1000]
        dataset.save(update_fields=["processing_status", "error_message"])
        raise


def _run_pipeline(dataset: DiscourseDataset) -> None:
    posts = list(PublicPost.objects.filter(dataset=dataset).order_by("timestamp", "id"))
    if not posts:
        return

    # 1. Clean text in bulk
    for post in posts:
        post.cleaned_text = clean_text(post.text)
    PublicPost.objects.bulk_update(posts, ["cleaned_text"])

    texts = [p.cleaned_text or p.text for p in posts]

    # 2. Language detection + translation
    # Detects the dominant language from a sample; translates non-English posts
    # to English so VADER scores remain accurate across languages.
    texts_for_scoring, detected_lang = prepare_for_sentiment(texts)
    if detected_lang and detected_lang != dataset.detected_language:
        dataset.detected_language = detected_lang
        dataset.save(update_fields=["detected_language"])

    # 3. Cluster (on cleaned original text — preserves native-language TF-IDF signal)
    cluster_data = cluster_posts(texts)

    # 4. Build NarrativeCluster records (scoring on translated English text)
    created_clusters = _build_clusters(dataset, posts, cluster_data, texts_for_scoring)

    # 5. Keyword bursts
    burst_data = detect_keyword_bursts(posts)
    if burst_data:
        KeywordBurst.objects.bulk_create(
            [
                KeywordBurst(
                    dataset=dataset,
                    keyword=bd["keyword"],
                    baseline_count=bd["baseline_count"],
                    burst_count=bd["burst_count"],
                    burst_score=round(bd["burst_score"], 3),
                    start_time=bd["start_time"],
                    end_time=bd["end_time"],
                )
                for bd in burst_data
            ]
        )

    # 6. Entity mentions
    _extract_entities(dataset, posts)

    # 7. RiskEvents
    generate_risk_events_for_clusters(dataset, created_clusters)
    generate_risk_events_for_bursts(dataset, burst_data)


def _build_clusters(
    dataset: DiscourseDataset,
    posts: list[PublicPost],
    cluster_data: list[dict],
    scoring_texts: list[str] | None = None,
) -> list[NarrativeCluster]:
    """
    Build NarrativeCluster records from cluster data.

    ``scoring_texts`` should be the translated-to-English version of each post
    (parallel to ``posts``). Falls back to the raw post text if not provided.
    """
    total_posts = len(posts)
    # Parallel list of English text for VADER scoring; fall back to raw if missing.
    en_texts = scoring_texts if scoring_texts and len(scoring_texts) == total_posts else None
    cluster_objs: list[NarrativeCluster] = []

    for cd in cluster_data:
        indices = cd["indices"]
        cluster_post_list = [posts[i] for i in indices if i < total_posts]
        if not cluster_post_list:
            continue

        # Use translated English text for VADER; fall back to raw post text.
        cluster_texts = (
            [en_texts[i] for i in indices if i < total_posts]
            if en_texts
            else [p.text for p in cluster_post_list]
        )
        sentiment_scores = [score_sentiment(t) for t in cluster_texts]
        toxicity_scores = [score_toxicity(t) for t in cluster_texts]
        avg_sentiment = sum(sentiment_scores) / len(sentiment_scores)
        avg_toxicity = sum(toxicity_scores) / len(toxicity_scores)

        timestamps = sorted(p.timestamp for p in cluster_post_list if p.timestamp is not None)
        start_time = timestamps[0] if timestamps else None
        end_time = timestamps[-1] if timestamps else None

        n = len(cluster_post_list)
        mid_idx = len(timestamps) // 2
        if mid_idx < len(timestamps) and timestamps:
            mid_ts = timestamps[mid_idx]
            second_half = sum(1 for p in cluster_post_list if p.timestamp and p.timestamp >= mid_ts)
            growth_rate = second_half / n
        else:
            growth_rate = 0.5

        rep_posts = [
            {
                "text": p.text[:300],
                "url": p.url or p.shared_url or "",
                "platform": p.platform or "",
                "author": p.author_identifier or "",
                "post_id": p.post_id or "",
                "timestamp": p.timestamp.isoformat() if p.timestamp else "",
                "engagement_count": p.engagement_count,
            }
            for p in cluster_post_list[:5]
        ]
        top_terms = cd.get("top_terms", [])

        status = NarrativeCluster.ClusterStatus.UNREVIEWED
        if n >= _MIN_CLUSTER_SIZE_FOR_REVIEW and (
            avg_sentiment <= _HOSTILE_THRESHOLD
            or avg_toxicity >= _TOXICITY_THRESHOLD
            or growth_rate >= _GROWTH_THRESHOLD
        ):
            status = NarrativeCluster.ClusterStatus.NEEDS_REVIEW

        title = _make_title(top_terms, cd["label"])
        summary = _make_summary(top_terms, n, avg_sentiment)
        confidence = round(min(0.95, 0.4 + n / max(total_posts, 1) + 0.1), 3)

        cluster_objs.append(
            NarrativeCluster(
                dataset=dataset,
                title=title,
                summary=summary,
                representative_terms=top_terms[:10],
                representative_posts=rep_posts,
                cluster_size=n,
                start_time=start_time,
                end_time=end_time,
                sentiment_score=round(avg_sentiment, 3),
                toxicity_signal=round(avg_toxicity, 3),
                growth_rate=round(growth_rate, 3),
                confidence=confidence,
                status=status,
            )
        )

    NarrativeCluster.objects.bulk_create(cluster_objs)

    # Assign cluster FK to every post so the cluster detail page can load them.
    # Build a map: post pk → cluster object (cluster_objs are now saved with PKs).
    post_pk_to_cluster: dict[int, NarrativeCluster] = {}
    for cd, cluster_obj in zip(cluster_data, cluster_objs, strict=False):
        for i in cd["indices"]:
            if i < total_posts:
                post_pk_to_cluster[posts[i].pk] = cluster_obj

    posts_to_update = []
    for post in posts:
        cluster_obj = post_pk_to_cluster.get(post.pk)
        if post.cluster_id != (cluster_obj.pk if cluster_obj else None):
            post.cluster = cluster_obj
            posts_to_update.append(post)
    if posts_to_update:
        PublicPost.objects.bulk_update(posts_to_update, ["cluster"])

    return cluster_objs


def _make_title(terms: list[str], label: int) -> str:
    if terms:
        label_words = [t.replace("_", " ") for t in terms[:3]]
        return "Narrative cluster: " + ", ".join(label_words)
    return f"Narrative cluster {label + 1}"


def _make_summary(terms: list[str], size: int, sentiment: float) -> str:
    term_str = ", ".join(terms[:5]) if terms else "various terms"
    if sentiment <= -0.3:
        tone = "hostile"
    elif sentiment <= -0.1:
        tone = "negative"
    elif sentiment >= 0.2:
        tone = "positive"
    else:
        tone = "neutral"
    return f"Cluster of {size} posts with {tone} framing. " f"Representative terms: {term_str}."


def _extract_entities(dataset: DiscourseDataset, posts: list[PublicPost]) -> None:
    hashtag_counter: Counter = Counter()
    mention_counter: Counter = Counter()
    domain_counter: Counter = Counter()

    for post in posts:
        for ht in extract_hashtags(post.text):
            hashtag_counter[f"#{ht}"] += 1
        for mn in extract_mentions(post.text):
            mention_counter[f"@{mn}"] += 1
        domain = extract_domain(post.shared_url or post.url)
        if domain:
            domain_counter[domain] += 1

    entity_objs: list[EntityMention] = []
    for text, count in hashtag_counter.most_common(30):
        entity_objs.append(
            EntityMention(
                dataset=dataset,
                entity_text=text,
                entity_type=EntityMention.EntityType.HASHTAG,
                count=count,
            )
        )
    for text, count in mention_counter.most_common(20):
        entity_objs.append(
            EntityMention(
                dataset=dataset,
                entity_text=text,
                entity_type=EntityMention.EntityType.PERSON,
                count=count,
            )
        )
    for text, count in domain_counter.most_common(20):
        entity_objs.append(
            EntityMention(
                dataset=dataset,
                entity_text=text,
                entity_type=EntityMention.EntityType.DOMAIN,
                count=count,
            )
        )

    if entity_objs:
        EntityMention.objects.bulk_create(entity_objs)
