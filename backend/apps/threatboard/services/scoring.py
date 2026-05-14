from dataclasses import dataclass

from django.utils import timezone

from apps.assets.models import Asset
from apps.threatboard.models import AssetVulnerabilityMatch, Vulnerability

ASSET_CRITICALITY_POINTS = {
    Asset.Criticality.LOW: 2,
    Asset.Criticality.MEDIUM: 7,
    Asset.Criticality.HIGH: 12,
    Asset.Criticality.CRITICAL: 15,
}

DATA_SENSITIVITY_POINTS = {
    Asset.DataSensitivity.PUBLIC: 0,
    Asset.DataSensitivity.INTERNAL: 3,
    Asset.DataSensitivity.CONFIDENTIAL: 6,
    Asset.DataSensitivity.SENSITIVE: 8,
    Asset.DataSensitivity.HIGHLY_SENSITIVE: 10,
}


@dataclass(frozen=True)
class ThreatBoardScore:
    score: int
    risk_band: str
    components: dict[str, float]
    explanation: str


def calculate_threatboard_risk_score(
    asset: Asset,
    vulnerability: Vulnerability,
    match_confidence: float,
) -> ThreatBoardScore:
    score_record = getattr(vulnerability, "score", None)
    epss_percentile = getattr(score_record, "epss_percentile", None)
    epss_score = getattr(score_record, "epss_score", None)
    kev_known_exploited = bool(
        getattr(score_record, "kev_known_exploited", False)
        or vulnerability.source == Vulnerability.Source.CISA_KEV
        or vulnerability.date_added_to_kev
    )

    epss_value = epss_percentile if epss_percentile is not None else epss_score
    components = {
        "kev_component": 30 if kev_known_exploited else 0,
        "epss_component": float(epss_value or 0) * 20,
        "asset_criticality_component": ASSET_CRITICALITY_POINTS.get(asset.criticality, 0),
        "internet_exposure_component": 15 if asset.internet_exposed else 0,
        "data_sensitivity_component": DATA_SENSITIVITY_POINTS.get(asset.data_sensitivity, 0),
        "overdue_component": 5 if is_overdue(vulnerability) else 0,
        "match_confidence_component": max(0.0, min(match_confidence, 1.0)) * 5,
    }
    total = max(0, min(round(sum(components.values())), 100))
    components["total"] = total

    risk_band = risk_band_from_score(total)
    explanation = build_score_explanation(asset, vulnerability, components)
    return ThreatBoardScore(
        score=total, risk_band=risk_band, components=components, explanation=explanation
    )


def calculate_exposure_score(asset: Asset) -> int:
    score = ASSET_CRITICALITY_POINTS.get(asset.criticality, 0)
    score += 15 if asset.internet_exposed else 0
    score += DATA_SENSITIVITY_POINTS.get(asset.data_sensitivity, 0)
    return max(0, min(round(score), 100))


def is_overdue(vulnerability: Vulnerability) -> bool:
    return bool(vulnerability.due_date and vulnerability.due_date < timezone.localdate())


def risk_band_from_score(score: int) -> str:
    if score <= 20:
        return AssetVulnerabilityMatch.RiskBand.LOW
    if score <= 45:
        return AssetVulnerabilityMatch.RiskBand.MEDIUM
    if score <= 70:
        return AssetVulnerabilityMatch.RiskBand.HIGH
    return AssetVulnerabilityMatch.RiskBand.CRITICAL


def build_score_explanation(
    asset: Asset,
    vulnerability: Vulnerability,
    score_components: dict[str, float],
) -> str:
    parts = [
        f"{vulnerability.cve_id} is mapped to {asset.name}.",
        (
            f"Risk score {int(score_components['total'])} combines known exploitation "
            "metadata, EPSS likelihood where available, asset criticality, exposure, "
            "data sensitivity, remediation timing, and match confidence."
        ),
    ]
    if score_components["kev_component"]:
        parts.append("The vulnerability is marked as known exploited in KEV-style metadata.")
    if asset.internet_exposed:
        parts.append("The affected asset is internet-exposed, increasing patch priority.")
    if score_components["overdue_component"]:
        parts.append("The remediation due date has passed, so review should be prioritised.")
    parts.append("This is a decision-support signal and requires human verification.")
    return " ".join(parts)
