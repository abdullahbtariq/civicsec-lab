from django.db.models import QuerySet
from django.utils import timezone

from apps.assets.models import Asset
from apps.organisations.models import Organisation
from apps.threatboard.models import AssetVulnerabilityMatch, ThreatIngestionRun, Vulnerability
from apps.threatboard.services.scoring import (
    calculate_exposure_score,
    calculate_threatboard_risk_score,
)


def match_vulnerabilities_to_assets(
    organisation: Organisation | None = None,
    *,
    run: ThreatIngestionRun | None = None,
    create_risk_events: bool = False,
) -> dict[str, int]:
    assets = Asset.objects.select_related("organisation").all()
    if organisation:
        assets = assets.filter(organisation=organisation)

    summary = {
        "assets_seen": assets.count(),
        "matches_created": 0,
        "matches_updated": 0,
        "risk_events_created_or_updated": 0,
    }

    for asset in assets:
        for match, created in match_single_asset(asset):
            if created:
                summary["matches_created"] += 1
            else:
                summary["matches_updated"] += 1

            if create_risk_events:
                from apps.threatboard.services.risk_events import (
                    create_or_update_risk_event_for_match,
                )

                risk_event = create_or_update_risk_event_for_match(match)
                if risk_event:
                    summary["risk_events_created_or_updated"] += 1

    if run:
        run.records_seen = summary["assets_seen"]
        run.records_created = summary["matches_created"]
        run.records_updated = summary["matches_updated"]
        run.records_failed = 0
        run.metadata = {
            **run.metadata,
            "risk_events_created_or_updated": summary["risk_events_created_or_updated"],
        }
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


def match_single_asset(asset: Asset) -> list[tuple[AssetVulnerabilityMatch, bool]]:
    results = []
    vulnerabilities = Vulnerability.objects.select_related("score").all()

    for vulnerability in vulnerabilities:
        candidate = _candidate_match(asset, vulnerability)
        if not candidate:
            continue

        match_method, confidence = candidate
        results.append(_upsert_match(asset, vulnerability, match_method, confidence))

    return results


def _upsert_match(
    asset: Asset,
    vulnerability: Vulnerability,
    match_method: str,
    confidence: float,
) -> tuple[AssetVulnerabilityMatch, bool]:
    now = timezone.now()
    threat_score = calculate_threatboard_risk_score(asset, vulnerability, confidence)
    exposure_score = calculate_exposure_score(asset)

    match, created = AssetVulnerabilityMatch.objects.update_or_create(
        organisation=asset.organisation,
        asset=asset,
        vulnerability=vulnerability,
        defaults={
            "match_method": match_method,
            "match_confidence": confidence,
            "exposure_score": exposure_score,
            "calculated_risk_score": threat_score.score,
            "risk_band": threat_score.risk_band,
            "explanation": threat_score.explanation,
            "last_seen_at": now,
        },
    )
    if created:
        match.first_seen_at = now
        match.save(update_fields=["first_seen_at"])

    score = getattr(vulnerability, "score", None)
    if score:
        score.last_scored_at = now
        score.save(update_fields=["last_scored_at", "updated_at"])

    return match, created


def _candidate_match(asset: Asset, vulnerability: Vulnerability) -> tuple[str, float] | None:
    asset_vendor = _normalize(asset.vendor)
    asset_product = _normalize(asset.product)
    vulnerability_vendor = _normalize(vulnerability.vendor)
    vulnerability_product = _normalize(vulnerability.product)

    if (
        asset_vendor
        and asset_product
        and asset_vendor == vulnerability_vendor
        and asset_product == vulnerability_product
    ):
        return AssetVulnerabilityMatch.MatchMethod.EXACT_VENDOR_PRODUCT, 0.95

    if _has_conservative_keyword_match(asset, vulnerability):
        return AssetVulnerabilityMatch.MatchMethod.KEYWORD_MATCH, 0.55

    return None


def _has_conservative_keyword_match(asset: Asset, vulnerability: Vulnerability) -> bool:
    asset_terms = _significant_terms([asset.vendor, asset.product])
    vulnerability_terms = _significant_terms([vulnerability.vendor, vulnerability.product])
    asset_text = _normalize(" ".join([asset.vendor, asset.product]))
    vulnerability_text = _normalize(
        " ".join(
            [
                vulnerability.vendor,
                vulnerability.product,
                vulnerability.title,
                vulnerability.description,
            ]
        )
    )

    return any(term in vulnerability_text for term in asset_terms) or any(
        term in asset_text for term in vulnerability_terms
    )


def _significant_terms(values: list[str]) -> list[str]:
    return [term for term in (_normalize(value) for value in values) if len(term) >= 4]


def _normalize(value: str) -> str:
    return " ".join((value or "").strip().lower().split())


def scoped_asset_matches_for_user(queryset: QuerySet, user):
    if not user or not user.is_authenticated:
        return queryset.none()
    if user.is_superuser:
        return queryset
    if not user.organisation_id:
        return queryset.none()
    return queryset.filter(organisation_id=user.organisation_id)
