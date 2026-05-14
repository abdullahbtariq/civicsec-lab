from django.utils import timezone

from apps.evidence.models import EvidenceItem
from apps.risk.models import ActionRecommendation, RiskEvent
from apps.threatboard.models import AssetVulnerabilityMatch
from apps.threatboard.services.scoring import is_overdue

RESOLVED_REMEDIATION_STATUSES = {
    AssetVulnerabilityMatch.RemediationStatus.NOT_AFFECTED,
    AssetVulnerabilityMatch.RemediationStatus.PATCHED,
    AssetVulnerabilityMatch.RemediationStatus.MITIGATED,
    AssetVulnerabilityMatch.RemediationStatus.ACCEPTED_RISK,
}


def create_or_update_risk_event_for_match(match: AssetVulnerabilityMatch) -> RiskEvent | None:
    if not _should_generate_risk_event(match):
        return None

    vulnerability = match.vulnerability
    asset = match.asset
    event_type = _event_type_for_match(match)
    title = f"{vulnerability.cve_id} may affect {asset.name}"
    severity = (
        RiskEvent.Severity.CRITICAL
        if match.risk_band == AssetVulnerabilityMatch.RiskBand.CRITICAL
        else RiskEvent.Severity.HIGH
    )
    evidence_source = _evidence_source(match)
    tags = _tags_for_match(match)

    risk_event, _ = RiskEvent.objects.update_or_create(
        organisation=match.organisation,
        source_module=RiskEvent.SourceModule.THREATBOARD,
        event_type=event_type,
        affected_asset=asset,
        title=title,
        defaults={
            "summary": (
                f"ThreatBoard matched {vulnerability.cve_id} to {asset.name}. "
                "This indicates a potentially affected asset and requires verification."
            ),
            "severity": severity,
            "confidence": match.match_confidence,
            "status": RiskEvent.Status.NEW,
            "risk_score": match.calculated_risk_score,
            "evidence_summary": (
                f"{vulnerability.cve_id} matched via {match.get_match_method_display()} "
                f"with risk score {match.calculated_risk_score}."
            ),
            "recommended_action_summary": (
                "Confirm whether the asset is affected, review vendor guidance, and apply "
                "a patch or mitigation where appropriate."
            ),
            "mapped_frameworks": {
                "nist_csf": ["Identify", "Protect", "Respond"],
                "source": [evidence_source],
            },
            "tags": tags,
            "first_seen_at": match.first_seen_at,
            "last_seen_at": timezone.now(),
        },
    )
    _upsert_evidence(risk_event, match, evidence_source)
    _upsert_recommendations(risk_event, match)
    return risk_event


def _should_generate_risk_event(match: AssetVulnerabilityMatch) -> bool:
    if match.status != AssetVulnerabilityMatch.Status.ACTIVE:
        return False

    unresolved = match.remediation_status not in RESOLVED_REMEDIATION_STATUSES
    if not unresolved:
        return False

    score = getattr(match.vulnerability, "score", None)
    is_kev = bool(
        getattr(score, "kev_known_exploited", False) or match.vulnerability.date_added_to_kev
    )
    is_high_band = match.risk_band in {
        AssetVulnerabilityMatch.RiskBand.HIGH,
        AssetVulnerabilityMatch.RiskBand.CRITICAL,
    }
    is_exposed_high_score = match.asset.internet_exposed and match.calculated_risk_score >= 46
    return bool(is_high_band or is_kev or is_exposed_high_score or is_overdue(match.vulnerability))


def _event_type_for_match(match: AssetVulnerabilityMatch) -> str:
    score = getattr(match.vulnerability, "score", None)
    is_kev = bool(
        getattr(score, "kev_known_exploited", False) or match.vulnerability.date_added_to_kev
    )
    epss_percentile = getattr(score, "epss_percentile", None)
    epss_score = getattr(score, "epss_score", None)

    if is_kev:
        return "known_exploited_vulnerability_match"
    if epss_percentile is not None and epss_percentile >= 0.7:
        return "high_exploit_probability_vulnerability"
    if epss_score is not None and epss_score >= 0.7:
        return "high_exploit_probability_vulnerability"
    if match.asset.internet_exposed and match.calculated_risk_score >= 46:
        return "vulnerable_internet_facing_asset"
    if is_overdue(match.vulnerability):
        return "overdue_vulnerability_remediation"
    return "high_exploit_probability_vulnerability"


def _upsert_evidence(
    risk_event: RiskEvent,
    match: AssetVulnerabilityMatch,
    evidence_source: str,
) -> None:
    score = getattr(match.vulnerability, "score", None)
    if getattr(score, "kev_known_exploited", False):
        evidence_type = EvidenceItem.EvidenceType.KEV_MATCH
    elif getattr(score, "epss_score", None) is not None:
        evidence_type = EvidenceItem.EvidenceType.EPSS_SCORE
    else:
        evidence_type = EvidenceItem.EvidenceType.CVE_MATCH

    EvidenceItem.objects.update_or_create(
        organisation=match.organisation,
        risk_event=risk_event,
        title=f"{match.vulnerability.cve_id} ThreatBoard match",
        defaults={
            "evidence_type": evidence_type,
            "description": (
                f"{match.vulnerability.cve_id} was matched to {match.asset.name}. "
                f"Match confidence is {match.match_confidence:.2f}; human verification is required."
            ),
            "source": evidence_source,
            "raw_reference": match.vulnerability.cve_id,
            "observed_at": timezone.now(),
            "confidence": match.match_confidence,
            "metadata": {
                "asset_vulnerability_match_id": match.id,
                "risk_band": match.risk_band,
                "calculated_risk_score": match.calculated_risk_score,
            },
        },
    )


def _upsert_recommendations(risk_event: RiskEvent, match: AssetVulnerabilityMatch) -> None:
    priority = (
        ActionRecommendation.Priority.URGENT
        if match.risk_band == AssetVulnerabilityMatch.RiskBand.CRITICAL
        else ActionRecommendation.Priority.HIGH
    )
    recommendation_titles = [
        "Confirm whether the asset is affected",
        "Apply vendor patch or mitigation",
        "Review logs for suspicious activity",
        "Record remediation status",
        "Update asset inventory",
    ]

    descriptions = {
        "Confirm whether the asset is affected": (
            "Validate the product, version, and deployment context before taking action."
        ),
        "Apply vendor patch or mitigation": (
            "Review official vendor guidance and apply an appropriate patch or mitigation."
        ),
        "Review logs for suspicious activity": (
            "Check relevant logs for unusual activity related to this potentially affected asset."
        ),
        "Record remediation status": (
            "Track whether the asset is affected, patched, mitigated, or accepted as risk."
        ),
        "Update asset inventory": (
            "Keep vendor, product, version, exposure, and owner details current."
        ),
    }

    for title in recommendation_titles:
        ActionRecommendation.objects.update_or_create(
            organisation=match.organisation,
            risk_event=risk_event,
            title=title,
            defaults={
                "description": descriptions[title],
                "priority": priority,
                "status": ActionRecommendation.Status.OPEN,
                "framework_mapping": {"nist_csf": ["Identify", "Protect", "Respond"]},
            },
        )


def _evidence_source(match: AssetVulnerabilityMatch) -> str:
    score = getattr(match.vulnerability, "score", None)
    if getattr(score, "kev_known_exploited", False):
        return "CISA KEV"
    if getattr(score, "epss_score", None) is not None:
        return "FIRST EPSS"
    return "ThreatBoard"


def _tags_for_match(match: AssetVulnerabilityMatch) -> list[str]:
    tags = ["threatboard", "vulnerability", f"cve:{match.vulnerability.cve_id}"]
    score = getattr(match.vulnerability, "score", None)
    if getattr(score, "kev_known_exploited", False):
        tags.append("known-exploited")
    if match.asset.internet_exposed:
        tags.append("internet-exposed")
    return tags
