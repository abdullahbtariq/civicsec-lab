from datetime import date
from typing import Any

import requests
from django.utils import timezone

from apps.threatboard.models import (
    CVE_PATTERN,
    ThreatIngestionRun,
    Vulnerability,
    VulnerabilityScore,
)

CISA_KEV_CATALOG_URL = (
    "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json"
)
REQUEST_TIMEOUT_SECONDS = 30


class ThreatBoardServiceError(Exception):
    """Raised when a ThreatBoard ingestion service cannot complete safely."""


def fetch_kev_catalog() -> dict[str, Any]:
    try:
        response = requests.get(CISA_KEV_CATALOG_URL, timeout=REQUEST_TIMEOUT_SECONDS)
        response.raise_for_status()
        payload = response.json()
    except requests.RequestException as exc:
        raise ThreatBoardServiceError(f"Could not fetch CISA KEV catalog: {exc}") from exc
    except ValueError as exc:
        raise ThreatBoardServiceError("CISA KEV catalog response was not valid JSON.") from exc

    if not isinstance(payload, dict):
        raise ThreatBoardServiceError("CISA KEV catalog response must be a JSON object.")
    return payload


def parse_kev_items(payload: dict[str, Any]) -> list[dict[str, Any]]:
    vulnerabilities = payload.get("vulnerabilities")
    if not isinstance(vulnerabilities, list):
        raise ThreatBoardServiceError("CISA KEV payload must include a vulnerabilities list.")

    parsed_items = []
    for item in vulnerabilities:
        if not isinstance(item, dict):
            continue
        try:
            parsed_items.append(_map_kev_item(item))
        except (KeyError, ValueError, TypeError):
            continue
    return parsed_items


def upsert_kev_vulnerabilities(
    items: list[dict[str, Any]],
    *,
    run: ThreatIngestionRun | None = None,
) -> dict[str, int]:
    summary = {"seen": len(items), "created": 0, "updated": 0, "failed": 0}

    for item in items:
        try:
            mapped = _map_kev_item(item) if "cveID" in item else item
            vulnerability, created = Vulnerability.objects.update_or_create(
                cve_id=Vulnerability.normalize_cve_id(mapped["cve_id"]),
                defaults={
                    "title": mapped["title"],
                    "description": mapped["description"],
                    "vendor": mapped["vendor"],
                    "product": mapped["product"],
                    "date_added_to_kev": mapped["date_added_to_kev"],
                    "due_date": mapped["due_date"],
                    "known_ransomware_campaign_use": mapped["known_ransomware_campaign_use"],
                    "required_action": mapped["required_action"],
                    "notes": mapped["notes"],
                    "source": Vulnerability.Source.CISA_KEV,
                    "source_url": CISA_KEV_CATALOG_URL,
                },
            )
            score, _ = VulnerabilityScore.objects.get_or_create(vulnerability=vulnerability)
            score.kev_known_exploited = True
            score.save(update_fields=["kev_known_exploited", "updated_at"])
        except (KeyError, ValueError, TypeError):
            summary["failed"] += 1
            continue

        if created:
            summary["created"] += 1
        else:
            summary["updated"] += 1

    if run:
        run.records_seen = summary["seen"]
        run.records_created = summary["created"]
        run.records_updated = summary["updated"]
        run.records_failed = summary["failed"]
        run.metadata = {**run.metadata, "source_url": CISA_KEV_CATALOG_URL}
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


def _map_kev_item(item: dict[str, Any]) -> dict[str, Any]:
    cve_id = Vulnerability.normalize_cve_id(str(item["cveID"]))
    if not CVE_PATTERN.match(cve_id):
        raise ValueError("Missing CVE ID")

    return {
        "cve_id": cve_id,
        "vendor": str(item.get("vendorProject", "")).strip(),
        "product": str(item.get("product", "")).strip(),
        "title": str(item.get("vulnerabilityName", cve_id)).strip() or cve_id,
        "description": str(item.get("shortDescription", "")).strip(),
        "date_added_to_kev": _parse_date(item.get("dateAdded")),
        "due_date": _parse_date(item.get("dueDate")),
        "known_ransomware_campaign_use": _parse_ransomware_use(
            item.get("knownRansomwareCampaignUse")
        ),
        "required_action": str(item.get("requiredAction", "")).strip(),
        "notes": str(item.get("notes", "")).strip(),
    }


def _parse_date(value: Any) -> date | None:
    if not value:
        return None
    if isinstance(value, date):
        return value
    return date.fromisoformat(str(value).strip())


def _parse_ransomware_use(value: Any) -> bool:
    if isinstance(value, bool):
        return value
    return str(value or "").strip().lower() in {"known", "yes", "true", "1"}


def start_run() -> ThreatIngestionRun:
    return ThreatIngestionRun.objects.create(
        run_type=ThreatIngestionRun.RunType.KEV_INGESTION,
        status=ThreatIngestionRun.Status.RUNNING,
        source=ThreatIngestionRun.Source.CISA_KEV,
        started_at=timezone.now(),
    )
