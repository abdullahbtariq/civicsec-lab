"""Keyword burst detection: compare term frequency in first vs second half of posts."""

from __future__ import annotations

from collections import Counter
from typing import TYPE_CHECKING

from apps.misinformation.services.text_processing import clean_text, tokenize

if TYPE_CHECKING:
    from apps.misinformation.models import PublicPost

_BURST_THRESHOLD = 2.0  # recent_count / baseline_count must exceed this
_MIN_BURST_COUNT = 3  # minimum occurrences in recent window
_TOP_N = 20  # max bursts to return


def detect_keyword_bursts(posts: list[PublicPost]) -> list[dict]:
    """
    Split posts into baseline (first half by time) and recent (second half).
    Compare term frequency to surface bursting keywords.

    Returns a list of dicts:
        {
            "keyword": str,
            "baseline_count": int,
            "burst_count": int,
            "burst_score": float,    # recent / baseline ratio
            "start_time": datetime | None,
            "end_time": datetime | None,
        }
    sorted by burst_score descending, capped at _TOP_N.
    """
    if not posts:
        return []

    dated = [p for p in posts if p.timestamp is not None]
    undated = [p for p in posts if p.timestamp is None]

    if len(dated) < 4:
        # Not enough temporal signal — return top-frequency terms as pseudo-bursts
        all_tokens: list[str] = []
        for p in posts:
            all_tokens.extend(tokenize(clean_text(p.text)))
        top = Counter(all_tokens).most_common(_TOP_N)
        return [
            {
                "keyword": kw,
                "baseline_count": 0,
                "burst_count": cnt,
                "burst_score": 1.0,
                "start_time": None,
                "end_time": None,
            }
            for kw, cnt in top
            if cnt >= _MIN_BURST_COUNT
        ]

    dated.sort(key=lambda p: p.timestamp)  # type: ignore[arg-type]
    mid = len(dated) // 2
    baseline_posts = dated[:mid] + undated
    recent_posts = dated[mid:]

    baseline_tokens: list[str] = []
    for p in baseline_posts:
        baseline_tokens.extend(tokenize(clean_text(p.text)))

    recent_tokens: list[str] = []
    for p in recent_posts:
        recent_tokens.extend(tokenize(clean_text(p.text)))

    baseline_counts = Counter(baseline_tokens)
    recent_counts = Counter(recent_tokens)

    results: list[dict] = []
    for kw, recent_cnt in recent_counts.items():
        baseline_cnt = baseline_counts.get(kw, 0)
        score = recent_cnt / max(baseline_cnt, 1)
        if score >= _BURST_THRESHOLD and recent_cnt >= _MIN_BURST_COUNT:
            results.append(
                {
                    "keyword": kw,
                    "baseline_count": baseline_cnt,
                    "burst_count": recent_cnt,
                    "burst_score": round(score, 3),
                    "start_time": recent_posts[0].timestamp,
                    "end_time": recent_posts[-1].timestamp,
                }
            )

    results.sort(key=lambda x: x["burst_score"], reverse=True)
    return results[:_TOP_N]
