"""
LogLens → RiskEvent generation.

Creates or updates RiskEvent objects from LoginAnomaly objects.
Only anomalies above a risk score threshold generate risk events.
"""

from django.utils import timezone

from apps.evidence.models import EvidenceItem
from apps.loglens.models import LoginAnomaly
from apps.risk.models import ActionRecommendation, RiskEvent

RISK_SCORE_THRESHOLD = 40  # anomalies below this do not generate risk events

# Map anomaly severity → risk event severity
SEVERITY_MAP = {
    LoginAnomaly.Severity.LOW: RiskEvent.Severity.LOW,
    LoginAnomaly.Severity.MEDIUM: RiskEvent.Severity.MEDIUM,
    LoginAnomaly.Severity.HIGH: RiskEvent.Severity.HIGH,
    LoginAnomaly.Severity.CRITICAL: RiskEvent.Severity.CRITICAL,
}

EVENT_TYPE_MAP = {
    LoginAnomaly.AnomalyType.FAILED_LOGIN_BURST: "suspicious_login_pattern",
    LoginAnomaly.AnomalyType.SUSPICIOUS_SUCCESS_AFTER_FAILURES: "possible_account_compromise",
    LoginAnomaly.AnomalyType.IMPOSSIBLE_TRAVEL: "impossible_travel_login",
    LoginAnomaly.AnomalyType.NEW_DEVICE: "suspicious_login_pattern",
    LoginAnomaly.AnomalyType.UNUSUAL_TIME: "suspicious_login_pattern",
    LoginAnomaly.AnomalyType.SENSITIVE_ACCESS_AFTER_ANOMALY: "sensitive_access_after_anomaly",
}

RECOMMENDATIONS = {
    "suspicious_login_pattern": [
        (
            "Review recent login history for the account",
            "Examine login events around the alert window for unusual patterns.",
        ),
        (
            "Verify account owner is aware of all sessions",
            "Contact the account owner and confirm all recent logins were legitimate.",
        ),
        (
            "Consider forcing a password reset",
            "If activity cannot be confirmed legitimate, initiate a password reset.",
        ),
        (
            "Enable or verify MFA status",
            "Ensure multi-factor authentication is active for this account.",
        ),
    ],
    "possible_account_compromise": [
        (
            "Revoke active sessions immediately",
            "Force logout of all active sessions for the affected account.",
        ),
        (
            "Force password reset",
            "Require the user to set a new password through a verified channel.",
        ),
        (
            "Review recent file downloads or data access",
            "Check whether any sensitive resources were accessed.",
        ),
        ("Preserve login evidence", "Export and preserve relevant log entries before they expire."),
        (
            "Open an incident if compromise is confirmed",
            "Escalate to IncidentFlow if the account is believed compromised.",
        ),
    ],
    "impossible_travel_login": [
        (
            "Confirm with the account owner",
            "Verify whether both login locations are expected (e.g., VPN use).",
        ),
        (
            "Revoke sessions from unexpected locations",
            "If one location is not recognised, revoke that session.",
        ),
        (
            "Force password reset if unresolved",
            "If the account owner cannot explain both logins, reset credentials.",
        ),
    ],
    "sensitive_access_after_anomaly": [
        (
            "Audit sensitive resource access logs",
            "Review exactly which files or resources were accessed and when.",
        ),
        (
            "Check for data exfiltration indicators",
            "Look for large downloads, shares, or exports around the alert time.",
        ),
        (
            "Restrict access to affected resources",
            "Consider temporarily restricting access to the affected sensitive resources.",
        ),
        (
            "Open an incident",
            "This pattern warrants a formal incident record — escalate to IncidentFlow.",
        ),
    ],
}


def create_or_update_risk_event_for_anomaly(anomaly: LoginAnomaly) -> RiskEvent | None:
    """Create or update a RiskEvent for a LoginAnomaly. Returns None if below threshold."""
    if anomaly.risk_score < RISK_SCORE_THRESHOLD:
        return None

    event_type = EVENT_TYPE_MAP.get(anomaly.anomaly_type, "suspicious_login_pattern")
    severity = SEVERITY_MAP.get(anomaly.severity, RiskEvent.Severity.MEDIUM)

    risk_event, _ = RiskEvent.objects.update_or_create(
        organisation=anomaly.organisation,
        source_module=RiskEvent.SourceModule.LOGLENS,
        event_type=event_type,
        title=anomaly.title,
        defaults={
            "summary": anomaly.description,
            "severity": severity,
            "confidence": anomaly.confidence,
            "status": RiskEvent.Status.NEW,
            "risk_score": anomaly.risk_score,
            "evidence_summary": (
                f"LogLens detected a '{anomaly.get_anomaly_type_display()}' pattern for "
                f"{anomaly.user_identifier}. Confidence: {anomaly.confidence:.0%}. "
                "This is a decision-support signal — human review required."
            ),
            "recommended_action_summary": (
                "Review the linked login events, confirm with the account owner, "
                "and consider revocation or password reset if activity is unexplained."
            ),
            "mapped_frameworks": {
                "nist_csf": ["Detect", "Respond"],
                "mitre_tactic": anomaly.mitre_tactic,
                "mitre_technique": anomaly.mitre_technique,
            },
            "tags": ["loglens", "login-anomaly", anomaly.anomaly_type],
            "first_seen_at": anomaly.start_time,
            "last_seen_at": timezone.now(),
        },
    )

    # Link anomaly back to the risk event
    anomaly.risk_event = risk_event
    anomaly.save(update_fields=["risk_event"])

    _upsert_evidence(risk_event, anomaly)
    _upsert_recommendations(risk_event, event_type)

    return risk_event


def _upsert_evidence(risk_event: RiskEvent, anomaly: LoginAnomaly) -> None:
    EvidenceItem.objects.update_or_create(
        organisation=anomaly.organisation,
        risk_event=risk_event,
        title=f"LogLens anomaly: {anomaly.get_anomaly_type_display()}",
        defaults={
            "evidence_type": EvidenceItem.EvidenceType.LOGIN_PATTERN,
            "description": anomaly.description,
            "source": "LogLens",
            "raw_reference": str(anomaly.id) if anomaly.id else "",
            "observed_at": anomaly.start_time,
            "confidence": anomaly.confidence,
            "metadata": anomaly.evidence_detail,
        },
    )


def _upsert_recommendations(risk_event: RiskEvent, event_type: str) -> None:
    recs = RECOMMENDATIONS.get(event_type, RECOMMENDATIONS["suspicious_login_pattern"])
    priority = (
        ActionRecommendation.Priority.URGENT
        if risk_event.severity in {RiskEvent.Severity.CRITICAL, RiskEvent.Severity.HIGH}
        else ActionRecommendation.Priority.HIGH
    )
    for title, description in recs:
        ActionRecommendation.objects.update_or_create(
            organisation=risk_event.organisation,
            risk_event=risk_event,
            title=title,
            defaults={
                "description": description,
                "priority": priority,
                "status": ActionRecommendation.Status.OPEN,
                "framework_mapping": {"nist_csf": ["Detect", "Respond"]},
            },
        )


def generate_risk_events_for_organisation(organisation) -> dict:
    """Generate risk events for all unlinked anomalies in an organisation."""
    anomalies = LoginAnomaly.objects.filter(
        organisation=organisation,
        risk_event__isnull=True,
        status=LoginAnomaly.Status.NEW,
    )
    created = 0
    skipped = 0
    for anomaly in anomalies:
        result = create_or_update_risk_event_for_anomaly(anomaly)
        if result:
            created += 1
        else:
            skipped += 1
    return {"risk_events_created": created, "anomalies_below_threshold": skipped}
