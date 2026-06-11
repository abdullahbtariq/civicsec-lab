"""DataPrivacy Doctor — RiskEvent generation for high-risk datasets."""

from django.utils import timezone

from apps.evidence.models import EvidenceItem
from apps.privacy_doctor.models import UploadedDataset
from apps.risk.models import ActionRecommendation, RiskEvent

RISK_SCORE_THRESHOLD = 30  # datasets below this score do not generate a RiskEvent

SEVERITY_MAP = {
    "severe": RiskEvent.Severity.CRITICAL,
    "high": RiskEvent.Severity.HIGH,
    "moderate": RiskEvent.Severity.MEDIUM,
    "low": RiskEvent.Severity.LOW,
}

EVENT_TYPE_BY_RISK_BAND = {
    "severe": "high_risk_dataset_upload",
    "high": "direct_identifier_detected",
    "moderate": "sensitive_dataset_detected",
    "low": "sensitive_dataset_detected",
}

RECOMMENDATIONS = {
    "direct_identifier_detected": [
        (
            "Remove direct identifier columns",
            "Remove or irreversibly pseudonymise all direct identifier columns before sharing this dataset externally.",
        ),
        (
            "Apply data minimisation",
            "Review whether collecting this level of personal detail is strictly necessary for the stated purpose.",
        ),
    ],
    "sensitive_dataset_detected": [
        (
            "Confirm legal basis",
            "Confirm the legal basis for processing any sensitive or special-category data in this dataset.",
        ),
        (
            "Restrict dataset access",
            "Restrict access to this dataset to authorised personnel only until a full privacy review is complete.",
        ),
    ],
    "high_risk_dataset_upload": [
        (
            "Do not share externally",
            "This dataset has a severe privacy risk score. Do not distribute externally until all identified risks are addressed.",
        ),
        (
            "Engage data protection officer",
            "Notify your data protection officer or privacy lead before any further processing or sharing of this dataset.",
        ),
        (
            "Apply k-anonymity",
            "Consider applying k-anonymity (k=5) or differential privacy techniques before any analytical use of this data.",
        ),
    ],
}


def generate_risk_event_for_dataset(dataset: UploadedDataset) -> dict:
    """
    Create a RiskEvent for a scanned dataset if its privacy risk score exceeds the threshold.
    Returns a summary dict.
    """
    if dataset.privacy_risk_score < RISK_SCORE_THRESHOLD:
        return {"risk_event_created": False, "reason": "below threshold"}

    if dataset.risk_event_id:
        return {"risk_event_created": False, "reason": "already linked"}

    severity = SEVERITY_MAP.get(dataset.risk_band, RiskEvent.Severity.MEDIUM)
    event_type = EVENT_TYPE_BY_RISK_BAND.get(dataset.risk_band, "sensitive_dataset_detected")

    findings_qs = dataset.findings.order_by("-severity")
    finding_types = list(findings_qs.values_list("finding_type", flat=True))
    finding_summaries = list(findings_qs.values_list("title", flat=True)[:5])

    risk_event = RiskEvent.objects.create(
        organisation=dataset.organisation,
        source_module=RiskEvent.SourceModule.PRIVACY_DOCTOR,
        event_type=event_type,
        title=f"Privacy risk detected: {dataset.original_filename}",
        summary=(
            f"DataPrivacy Doctor scanned '{dataset.original_filename}' "
            f"({dataset.row_count:,} rows, {dataset.column_count} columns) "
            f"and assigned a privacy risk score of {dataset.privacy_risk_score}/100 "
            f"({dataset.get_risk_band_display()}). "
            f"{len(finding_types)} finding(s) detected. "
            "Human review is required before external sharing."
        ),
        severity=severity,
        confidence=0.80,
        status=RiskEvent.Status.NEW,
        risk_score=dataset.privacy_risk_score,
        evidence_summary=(
            f"Automated column profiling of {dataset.column_count} columns identified "
            f"{dataset.column_profiles.filter(privacy_category='direct_identifier').count()} direct identifier(s), "
            f"{dataset.column_profiles.filter(privacy_category='quasi_identifier').count()} quasi-identifier(s), and "
            f"{dataset.column_profiles.filter(privacy_category='sensitive_attribute').count()} sensitive attribute(s)."
        ),
        recommended_action_summary=(
            "Review all identified privacy findings. Remove or pseudonymise direct identifiers. "
            "Apply data minimisation before any external sharing. Consult your data protection officer."
        ),
        mapped_frameworks={
            "nist_csf": ["Govern", "Identify", "Protect"],
            "gdpr_principles": ["data_minimisation", "purpose_limitation", "storage_limitation"],
        },
        tags=["privacy-doctor", "dataset-scan", dataset.risk_band],
        first_seen_at=dataset.uploaded_at,
        last_seen_at=timezone.now(),
    )

    # Evidence item
    EvidenceItem.objects.create(
        organisation=dataset.organisation,
        risk_event=risk_event,
        evidence_type=EvidenceItem.EvidenceType.PII_DETECTION,
        title=f"Privacy scan — {dataset.original_filename}",
        description=(
            f"Automated scan of {dataset.row_count:,} rows × {dataset.column_count} columns. "
            f"Risk score: {dataset.privacy_risk_score}/100 ({dataset.risk_band}). "
            f"Findings: {'; '.join(finding_summaries[:3])}."
        ),
        source="DataPrivacy Doctor automated scan",
        metadata={
            "dataset_id": dataset.id,
            "filename": dataset.original_filename,
            "row_count": dataset.row_count,
            "column_count": dataset.column_count,
            "privacy_risk_score": dataset.privacy_risk_score,
            "risk_band": dataset.risk_band,
            "finding_types": finding_types,
        },
        confidence=0.80,
        observed_at=dataset.processed_at or timezone.now(),
    )

    # Action recommendations
    recs_to_create = []
    for title, description in RECOMMENDATIONS.get(event_type, []):
        recs_to_create.append(
            ActionRecommendation(
                organisation=dataset.organisation,
                risk_event=risk_event,
                title=title,
                description=description,
                priority=ActionRecommendation.Priority.HIGH,
            )
        )
    if recs_to_create:
        ActionRecommendation.objects.bulk_create(recs_to_create)

    # Link back to dataset
    dataset.risk_event = risk_event
    dataset.save(update_fields=["risk_event"])

    return {"risk_event_created": True, "risk_event_id": risk_event.id}
