"""CSV ingestion: parse uploaded file and create PublicPost records."""

from __future__ import annotations

import csv
import io
import logging
from datetime import UTC, datetime

from apps.misinformation.models import DiscourseDataset, PublicPost

logger = logging.getLogger(__name__)

# Columns we attempt to read; all optional except ``text``
_KNOWN_COLS = {
    "post_id",
    "timestamp",
    "author_id",
    "author_identifier",
    "platform",
    "text",
    "url",
    "engagement_count",
    "reply_to",
    "shared_url",
}

_MAX_ROWS = 5_000


def ingest_csv(dataset: DiscourseDataset, file_bytes: bytes) -> int:
    """
    Parse a CSV, create PublicPost records linked to ``dataset``.
    Returns the number of rows successfully ingested.
    """
    text_io = io.TextIOWrapper(io.BytesIO(file_bytes), encoding="utf-8", errors="replace")
    reader = csv.DictReader(text_io)

    posts: list[PublicPost] = []
    for i, row in enumerate(reader):
        if i >= _MAX_ROWS:
            logger.warning("Dataset %s: truncated at %d rows", dataset.id, _MAX_ROWS)
            break

        text = (row.get("text") or "").strip()
        if not text:
            continue

        timestamp = _parse_ts(row.get("timestamp") or "")
        try:
            engagement = int(row.get("engagement_count") or 0)
        except (ValueError, TypeError):
            engagement = 0

        posts.append(
            PublicPost(
                dataset=dataset,
                post_id=(row.get("post_id") or "")[:255],
                timestamp=timestamp,
                author_identifier=(row.get("author_id") or row.get("author_identifier") or "")[
                    :255
                ],
                platform=(row.get("platform") or "")[:100],
                text=text,
                url=(row.get("url") or "")[:2000],
                engagement_count=max(0, engagement),
                reply_to=(row.get("reply_to") or "")[:255],
                shared_url=(row.get("shared_url") or "")[:2000],
            )
        )

    if posts:
        PublicPost.objects.bulk_create(posts, batch_size=500)

    count = len(posts)
    dataset.row_count = count
    dataset.save(update_fields=["row_count"])
    return count


def _parse_ts(value: str) -> datetime | None:
    if not value:
        return None
    formats = [
        "%Y-%m-%dT%H:%M:%SZ",
        "%Y-%m-%dT%H:%M:%S",
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%dT%H:%M:%S%z",
        "%Y-%m-%d",
    ]
    for fmt in formats:
        try:
            dt = datetime.strptime(value.strip(), fmt)
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=UTC)
            return dt
        except ValueError:
            continue
    return None
