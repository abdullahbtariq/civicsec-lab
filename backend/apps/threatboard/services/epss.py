from collections.abc import Iterable
from typing import Any

import requests
from django.utils import timezone

from apps.threatboard.models import ThreatIngestionRun, Vulnerability, VulnerabilityScore
from apps.threatboard.services.kev import ThreatBoardServiceError

FIRST_EPSS_API_URL = "https://api.first.org/data/v1/epss"
REQUEST_TIMEOUT_SECONDS = 30
DEFAULT_BATCH_SIZE = 100


def fetch_epss_scores(cve_ids: list[str]) -> dict[str, dict[str, float]]:
    scores: dict[str, dict[str, float]] = {}
    normalized_cves = [Vulnerability.normalize_cve_id(cve_id) for cve_id in cve_ids if cve_id]

    for batch in _chunks(normalized_cves, DEFAULT_BATCH_SIZE):
        if not batch:
            continue
        try:
            response = requests.get(
                FIRST_EPSS_API_URL,
                params={"cve": ",".join(batch)},
                timeout=REQUEST_TIMEOUT_SECONDS,
            )
            response.raise_for_status()
            payload = response.json()
        except requests.RequestException as exc:
            raise ThreatBoardServiceError(f"Could not fetch FIRST EPSS scores: {exc}") from exc
        except ValueError as exc:
            raise ThreatBoardServiceError("FIRST EPSS response was not valid JSON.") from exc

        scores.update(parse_epss_response(payload))

    return scores


def parse_epss_response(payload: dict[str, Any]) -> dict[str, dict[str, float]]:
    data = payload.get("data", [])
    if not isinstance(data, list):
        raise ThreatBoardServiceError("FIRST EPSS payload must include a data list.")

    scores = {}
    for item in data:
        if not isinstance(item, dict) or not item.get("cve"):
            continue
        try:
            cve_id = Vulnerability.normalize_cve_id(str(item["cve"]))
            scores[cve_id] = {
                "epss_score": float(item["epss"]),
                "epss_percentile": float(item["percentile"]),
            }
        except (KeyError, TypeError, ValueError):
            continue

    return scores


def enrich_vulnerabilities_with_epss(
    cve_ids: list[str] | None = None,
    *,
    run: ThreatIngestionRun | None = None,
) -> dict[str, int]:
    queryset = Vulnerability.objects.all()
    if cve_ids:
        normalized_cves = [Vulnerability.normalize_cve_id(cve_id) for cve_id in cve_ids]
        queryset = queryset.filter(cve_id__in=normalized_cves)

    selected_cves = list(queryset.values_list("cve_id", flat=True))
    scores = fetch_epss_scores(selected_cves) if selected_cves else {}
    summary = {
        "seen": len(selected_cves),
        "created": 0,
        "updated": 0,
        "failed": max(len(selected_cves) - len(scores), 0),
    }
    checked_at = timezone.now()

    for vulnerability in queryset:
        score_data = scores.get(vulnerability.cve_id)
        if not score_data:
            continue

        score, created = VulnerabilityScore.objects.get_or_create(vulnerability=vulnerability)
        score.epss_score = score_data["epss_score"]
        score.epss_percentile = score_data["epss_percentile"]
        score.last_epss_checked_at = checked_at
        score.save(
            update_fields=[
                "epss_score",
                "epss_percentile",
                "last_epss_checked_at",
                "updated_at",
            ]
        )
        if created:
            summary["created"] += 1
        else:
            summary["updated"] += 1

    if run:
        run.records_seen = summary["seen"]
        run.records_created = summary["created"]
        run.records_updated = summary["updated"]
        run.records_failed = summary["failed"]
        run.metadata = {**run.metadata, "requested_cve_count": len(selected_cves)}
        run.save(
            update_fields=[
                "records_seen",
                "records_created",
                "records_updated",
                "records_failed",
                "metadata",
                "updated_at",
            ]
        )

    return summary


def _chunks(values: Iterable[str], size: int) -> Iterable[list[str]]:
    bucket = []
    for value in values:
        bucket.append(value)
        if len(bucket) == size:
            yield bucket
            bucket = []
    if bucket:
        yield bucket
