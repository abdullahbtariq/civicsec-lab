"""RiskEvent generation for concerning Observatory signals."""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING

from apps.risk.models import RiskEvent

if TYPE_CHECKING:
    from apps.misinformation.models import DiscourseDataset, NarrativeCluster

logger = logging.getLogger(__name__)

_HOSTILE_THRESHOLD = -0.3
_HIGH_BURST_SCORE = 3.0
_MIN_BURST_COUNT = 10


def generate_risk_events_for_clusters(
    dataset: DiscourseDataset,
    clusters: list[NarrativeCluster],
) -> None:
    """Create RiskEvents for clusters flagged as NEEDS_REVIEW."""
    from apps.misinformation.models import NarrativeCluster as NC

    org = dataset.organisation

    for cluster in clusters:
        if cluster.status != NC.ClusterStatus.NEEDS_REVIEW:
            continue

        if cluster.sentiment_score <= _HOSTILE_THRESHOLD:
            event_type = "hostile_sentiment_spike"
            title = f"Hostile framing indicator in narrative cluster: {cluster.title}"
            summary = (
                f"A narrative cluster of {cluster.cluster_size} posts was detected with "
                f"hostile framing indicators (sentiment score: {cluster.sentiment_score:.2f}). "
                f"This is a signal requiring analyst review — not a confirmed determination "
                f"of misinformation or harmful intent."
            )
            severity = "high"
        else:
            event_type = "emerging_narrative_cluster"
            title = f"Narrative cluster flagged for review: {cluster.title}"
            summary = (
                f"A narrative cluster of {cluster.cluster_size} posts requires analyst review. "
                f"Growth rate: {cluster.growth_rate:.0%}. "
                f"This is a pattern-based signal, not a classification of content."
            )
            severity = "medium"

        term_str = ", ".join(cluster.representative_terms[:5])
        risk_event = RiskEvent.objects.create(
            organisation=org,
            source_module="misinformation_observatory",
            event_type=event_type,
            title=title,
            summary=summary,
            severity=severity,
            confidence=cluster.confidence,
            status="open",
            evidence_summary=(
                f"Top terms: {term_str}. "
                f"Posts in cluster: {cluster.cluster_size}. "
                f"Sentiment score: {cluster.sentiment_score:.2f}. "
                f"Toxicity signal: {cluster.toxicity_signal:.2f}."
            ),
            recommended_action_summary=(
                "Analyst should review the cluster and representative posts before drawing "
                "any conclusions. Do not label content as misinformation without human confirmation."
            ),
        )
        cluster.linked_risk_event = risk_event
        cluster.save(update_fields=["linked_risk_event"])
        logger.info(
            "Created RiskEvent %s for cluster %s (dataset %s)",
            risk_event.id,
            cluster.id,
            dataset.id,
        )


def generate_risk_events_for_bursts(
    dataset: DiscourseDataset,
    burst_data: list[dict],
) -> None:
    """Create RiskEvents for significant keyword bursts (top 3 only)."""
    org = dataset.organisation

    for bd in burst_data[:3]:
        if bd["burst_score"] < _HIGH_BURST_SCORE or bd["burst_count"] < _MIN_BURST_COUNT:
            continue

        RiskEvent.objects.create(
            organisation=org,
            source_module="misinformation_observatory",
            event_type="keyword_burst_detected",
            title=f'Keyword burst detected: "{bd["keyword"]}"',
            summary=(
                f'The term "{bd["keyword"]}" appeared {bd["burst_count"]} times '
                f"in the recent window (baseline: {bd['baseline_count']}). "
                f"Burst score: {bd['burst_score']:.1f}×. Analyst review recommended."
            ),
            severity="medium",
            confidence=0.7,
            status="open",
            evidence_summary=(
                f"Baseline: {bd['baseline_count']}. "
                f"Recent: {bd['burst_count']}. "
                f"Score: {bd['burst_score']:.2f}."
            ),
            recommended_action_summary=(
                "Check associated narrative clusters for context before escalating."
            ),
        )
        logger.info(
            "Created keyword burst RiskEvent for '%s' (dataset %s)", bd["keyword"], dataset.id
        )
