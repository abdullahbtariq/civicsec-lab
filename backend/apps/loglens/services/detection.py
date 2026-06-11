"""
LogLens detection rules.

Each rule scans LoginEvent objects for an organisation and produces
LoginAnomaly objects where patterns are found.

All outputs are decision-support signals — they require human review.
Language is kept probabilistic: "pattern suggests", "possible indicator",
"requires review". No rule claims a confirmed attack.
"""

from collections import defaultdict
from datetime import timedelta

from django.db import transaction

from apps.loglens.models import LoginAnomaly, LoginEvent

# ---------------------------------------------------------------------------
# Thresholds (named constants so tests can reason about them)
# ---------------------------------------------------------------------------

FAILED_BURST_COUNT = 5  # failed logins to trigger burst rule
FAILED_BURST_WINDOW_MINUTES = 10  # time window for burst detection
IMPOSSIBLE_TRAVEL_HOURS = 2  # country change within this window = suspicious
UNUSUAL_HOUR_START = 7  # logins before this hour are flagged
UNUSUAL_HOUR_END = 22  # logins at or after this hour are flagged
SENSITIVE_RESOURCE_KEYWORDS = [
    "election",
    "volunteer",
    "database",
    "research",
    "dataset",
    "sensitive",
    "internal",
    "confidential",
]


def _is_sensitive_resource(resource: str) -> bool:
    r = resource.lower()
    return any(k in r for k in SENSITIVE_RESOURCE_KEYWORDS)


def _risk_score(severity: str, confidence: float) -> int:
    """Convert severity + confidence to a 0-100 risk score."""
    base = {"low": 20, "medium": 45, "high": 70, "critical": 90}
    return min(100, int(base.get(severity, 20) * confidence))


# ---------------------------------------------------------------------------
# Rule 1 — Failed login burst
# ---------------------------------------------------------------------------


def detect_failed_login_bursts(
    organisation,
    events: list[LoginEvent],
) -> list[LoginAnomaly]:
    """5+ failed logins for the same user within 10 minutes."""
    anomalies = []
    failed = [
        e for e in events if not e.success and e.event_type == LoginEvent.EventType.LOGIN_FAILED
    ]
    by_user: dict[str, list[LoginEvent]] = defaultdict(list)
    for e in failed:
        by_user[e.user_identifier].append(e)

    for user, user_events in by_user.items():
        user_events.sort(key=lambda e: e.timestamp)
        # Sliding window
        for i, anchor in enumerate(user_events):
            window = [
                e
                for e in user_events[i:]
                if e.timestamp <= anchor.timestamp + timedelta(minutes=FAILED_BURST_WINDOW_MINUTES)
            ]
            if len(window) < FAILED_BURST_COUNT:
                continue

            # Check if a success followed shortly after the burst
            success_after = [
                e
                for e in events
                if e.user_identifier == user
                and e.success
                and e.timestamp > anchor.timestamp
                and e.timestamp <= anchor.timestamp + timedelta(minutes=30)
            ]
            has_success_after = len(success_after) > 0
            has_sensitive_success = any(
                _is_sensitive_resource(e.resource_accessed) for e in success_after
            )

            if has_sensitive_success:
                severity = LoginAnomaly.Severity.CRITICAL
                confidence = 0.85
                desc = (
                    f"{len(window)} failed login attempts for {user} within "
                    f"{FAILED_BURST_WINDOW_MINUTES} minutes, followed by a successful login "
                    "that accessed a sensitive resource. This pattern is a possible indicator "
                    "of credential-based access — human review is recommended."
                )
                mitre_tactic = "Credential Access / possible Initial Access"
                mitre_technique = "Brute Force pattern (T1110-style signal) — requires verification"
            elif has_success_after:
                severity = LoginAnomaly.Severity.HIGH
                confidence = 0.75
                desc = (
                    f"{len(window)} failed login attempts for {user} within "
                    f"{FAILED_BURST_WINDOW_MINUTES} minutes, followed by a successful login. "
                    "This pattern may suggest a credential guessing attempt — requires review."
                )
                mitre_tactic = "Credential Access"
                mitre_technique = "Brute Force pattern (T1110-style signal) — requires verification"
            else:
                severity = LoginAnomaly.Severity.MEDIUM
                confidence = 0.65
                desc = (
                    f"{len(window)} failed login attempts for {user} within "
                    f"{FAILED_BURST_WINDOW_MINUTES} minutes. No subsequent success detected. "
                    "This may indicate a failed credential attack or locked account — review recommended."
                )
                mitre_tactic = "Credential Access"
                mitre_technique = "Brute Force pattern (T1110-style signal) — requires verification"

            score = _risk_score(severity, confidence)

            anomaly = LoginAnomaly(
                organisation=organisation,
                user_identifier=user,
                anomaly_type=LoginAnomaly.AnomalyType.FAILED_LOGIN_BURST,
                title=f"Possible failed login burst — {user}",
                description=desc,
                severity=severity,
                confidence=confidence,
                risk_score=score,
                start_time=window[0].timestamp,
                end_time=window[-1].timestamp,
                mitre_tactic=mitre_tactic,
                mitre_technique=mitre_technique,
                evidence_detail={
                    "failed_count": len(window),
                    "window_minutes": FAILED_BURST_WINDOW_MINUTES,
                    "success_after": has_success_after,
                    "sensitive_access": has_sensitive_success,
                    "distinct_ips": list({e.ip_address for e in window if e.ip_address}),
                    "distinct_countries": list({e.country for e in window if e.country}),
                },
            )
            anomalies.append((anomaly, window + success_after))
            break  # one anomaly per user per run

    return anomalies


# ---------------------------------------------------------------------------
# Rule 2 — Suspicious success after failures (cross-IP)
# ---------------------------------------------------------------------------


def detect_suspicious_success_after_failures(
    organisation,
    events: list[LoginEvent],
) -> list[LoginAnomaly]:
    """Failures from one IP then success from a different IP within 30 minutes."""
    anomalies = []
    by_user: dict[str, list[LoginEvent]] = defaultdict(list)
    for e in events:
        by_user[e.user_identifier].append(e)

    for user, user_events in by_user.items():
        user_events.sort(key=lambda e: e.timestamp)
        failures: list[LoginEvent] = []
        for event in user_events:
            if not event.success:
                failures.append(event)
            elif event.success and failures:
                recent_failures = [
                    f for f in failures if event.timestamp - f.timestamp <= timedelta(minutes=30)
                ]
                if not recent_failures:
                    failures = []
                    continue
                # Check if success IP differs from failure IPs
                failure_ips = {f.ip_address for f in recent_failures}
                cross_ip = event.ip_address not in failure_ips
                if cross_ip and len(recent_failures) >= 2:
                    confidence = 0.70
                    severity = LoginAnomaly.Severity.HIGH
                    score = _risk_score(severity, confidence)
                    anomaly = LoginAnomaly(
                        organisation=organisation,
                        user_identifier=user,
                        anomaly_type=LoginAnomaly.AnomalyType.SUSPICIOUS_SUCCESS_AFTER_FAILURES,
                        title=f"Possible credential success after failures — {user}",
                        description=(
                            f"{len(recent_failures)} failed logins from {failure_ips} "
                            f"followed by a successful login from a different IP "
                            f"({event.ip_address}) within 30 minutes. "
                            "This pattern may indicate a valid account compromise — "
                            "human verification is recommended."
                        ),
                        severity=severity,
                        confidence=confidence,
                        risk_score=score,
                        start_time=recent_failures[0].timestamp,
                        end_time=event.timestamp,
                        mitre_tactic="Initial Access",
                        mitre_technique="Valid Accounts pattern (T1078-style signal) — requires verification",
                        evidence_detail={
                            "failure_count": len(recent_failures),
                            "failure_ips": list(failure_ips),
                            "success_ip": event.ip_address,
                            "success_country": event.country,
                        },
                    )
                    anomalies.append((anomaly, recent_failures + [event]))
                failures = []

    return anomalies


# ---------------------------------------------------------------------------
# Rule 3 — Impossible travel
# ---------------------------------------------------------------------------


def detect_impossible_travel(
    organisation,
    events: list[LoginEvent],
) -> list[LoginAnomaly]:
    """Different countries within IMPOSSIBLE_TRAVEL_HOURS hours for same user."""
    anomalies = []
    logins = [e for e in events if e.success and e.country]
    by_user: dict[str, list[LoginEvent]] = defaultdict(list)
    for e in logins:
        by_user[e.user_identifier].append(e)

    for user, user_events in by_user.items():
        user_events.sort(key=lambda e: e.timestamp)
        for i in range(len(user_events) - 1):
            e1, e2 = user_events[i], user_events[i + 1]
            time_gap = e2.timestamp - e1.timestamp
            if (
                e1.country != e2.country
                and time_gap <= timedelta(hours=IMPOSSIBLE_TRAVEL_HOURS)
                and time_gap.total_seconds() > 0
            ):
                confidence = 0.80
                severity = LoginAnomaly.Severity.HIGH
                score = _risk_score(severity, confidence)
                gap_minutes = int(time_gap.total_seconds() / 60)
                anomaly = LoginAnomaly(
                    organisation=organisation,
                    user_identifier=user,
                    anomaly_type=LoginAnomaly.AnomalyType.IMPOSSIBLE_TRAVEL,
                    title=f"Possible impossible travel — {user}",
                    description=(
                        f"Login from {e1.country} ({e1.city}) at {e1.timestamp.strftime('%H:%M UTC')} "
                        f"followed by login from {e2.country} ({e2.city}) only {gap_minutes} minutes later. "
                        "Physical travel between these locations in this timeframe is unlikely. "
                        "This may indicate shared credentials or session hijacking — review recommended."
                    ),
                    severity=severity,
                    confidence=confidence,
                    risk_score=score,
                    start_time=e1.timestamp,
                    end_time=e2.timestamp,
                    mitre_tactic="Initial Access",
                    mitre_technique="Valid Accounts — impossible travel pattern (T1078-style signal)",
                    evidence_detail={
                        "location_1": {"country": e1.country, "city": e1.city, "ip": e1.ip_address},
                        "location_2": {"country": e2.country, "city": e2.city, "ip": e2.ip_address},
                        "gap_minutes": gap_minutes,
                    },
                )
                anomalies.append((anomaly, [e1, e2]))

    return anomalies


# ---------------------------------------------------------------------------
# Rule 4 — New device
# ---------------------------------------------------------------------------


def detect_new_device(
    organisation,
    events: list[LoginEvent],
) -> list[LoginAnomaly]:
    """
    User logs in from a device_id not seen in previous events for that user.
    Only flags if the user has at least one prior known device.
    """
    anomalies = []
    # Exclude the current batch events so we don't count brand-new devices as "known"
    batch_pks = {e.pk for e in events if e.pk}
    all_prior = (
        LoginEvent.objects.filter(organisation=organisation)
        .exclude(device_id="")
        .exclude(pk__in=batch_pks)
    )
    known_devices: dict[str, set[str]] = defaultdict(set)
    for e in all_prior:
        known_devices[e.user_identifier].add(e.device_id)

    # Process current batch — build known devices as we go
    seen_in_batch: dict[str, set[str]] = defaultdict(set)
    logins = sorted(
        [e for e in events if e.success and e.device_id],
        key=lambda e: e.timestamp,
    )
    for event in logins:
        user = event.user_identifier
        device = event.device_id
        all_known = known_devices[user] | seen_in_batch[user]

        if all_known and device not in all_known:
            # Only raise if user has established device history
            confidence = 0.60
            severity = LoginAnomaly.Severity.MEDIUM
            score = _risk_score(severity, confidence)
            anomaly = LoginAnomaly(
                organisation=organisation,
                user_identifier=user,
                anomaly_type=LoginAnomaly.AnomalyType.NEW_DEVICE,
                title=f"Login from new device — {user}",
                description=(
                    f"Login detected from device '{device}' which has not been seen before "
                    f"for {user}. This may indicate a new legitimate device or an unauthorised "
                    "access attempt — human review recommended."
                ),
                severity=severity,
                confidence=confidence,
                risk_score=score,
                start_time=event.timestamp,
                end_time=event.timestamp,
                mitre_tactic="Initial Access",
                mitre_technique="Valid Accounts — new device pattern",
                evidence_detail={
                    "new_device_id": device,
                    "known_devices": list(all_known),
                    "login_country": event.country,
                    "login_ip": event.ip_address,
                },
            )
            anomalies.append((anomaly, [event]))

        seen_in_batch[user].add(device)

    return anomalies


# ---------------------------------------------------------------------------
# Rule 5 — Unusual time
# ---------------------------------------------------------------------------


def detect_unusual_time(
    organisation,
    events: list[LoginEvent],
) -> list[LoginAnomaly]:
    """Login outside 07:00–22:00 UTC."""
    anomalies = []
    logins = [e for e in events if e.success]
    for event in logins:
        hour = event.timestamp.hour
        if hour < UNUSUAL_HOUR_START or hour >= UNUSUAL_HOUR_END:
            confidence = 0.50
            severity = LoginAnomaly.Severity.LOW
            score = _risk_score(severity, confidence)
            anomaly = LoginAnomaly(
                organisation=organisation,
                user_identifier=event.user_identifier,
                anomaly_type=LoginAnomaly.AnomalyType.UNUSUAL_TIME,
                title=f"Login at unusual hour — {event.user_identifier}",
                description=(
                    f"Login by {event.user_identifier} at {event.timestamp.strftime('%H:%M UTC')} "
                    f"is outside the expected active window ({UNUSUAL_HOUR_START:02d}:00–"
                    f"{UNUSUAL_HOUR_END:02d}:00 UTC). "
                    "This alone is a low-confidence signal and may reflect legitimate after-hours work."
                ),
                severity=severity,
                confidence=confidence,
                risk_score=score,
                start_time=event.timestamp,
                end_time=event.timestamp,
                mitre_tactic="",
                mitre_technique="",
                evidence_detail={
                    "login_hour_utc": hour,
                    "expected_window": f"{UNUSUAL_HOUR_START:02d}:00–{UNUSUAL_HOUR_END:02d}:00",
                    "device_id": event.device_id,
                    "country": event.country,
                },
            )
            anomalies.append((anomaly, [event]))

    return anomalies


# ---------------------------------------------------------------------------
# Rule 6 — Sensitive access after anomaly
# ---------------------------------------------------------------------------


def detect_sensitive_access_after_anomaly(
    organisation,
    events: list[LoginEvent],
    new_anomalies: list[tuple],
) -> list[LoginAnomaly]:
    """
    A user accesses a sensitive resource shortly after an anomaly was detected.
    Requires the other rules to have already run.
    """
    anomalies = []
    # Collect users who have anomalies in this run
    anomalous_users: dict[str, LoginAnomaly] = {}
    for anomaly_obj, _ in new_anomalies:
        user = anomaly_obj.user_identifier
        if user not in anomalous_users:
            anomalous_users[user] = anomaly_obj

    for user, source_anomaly in anomalous_users.items():
        sensitive_events = [
            e
            for e in events
            if e.user_identifier == user
            and e.success
            and _is_sensitive_resource(e.resource_accessed)
            and e.timestamp >= source_anomaly.start_time
        ]
        if not sensitive_events:
            continue

        confidence = 0.78
        severity = LoginAnomaly.Severity.HIGH
        score = _risk_score(severity, confidence)
        resources = list({e.resource_accessed for e in sensitive_events})
        anomaly = LoginAnomaly(
            organisation=organisation,
            user_identifier=user,
            anomaly_type=LoginAnomaly.AnomalyType.SENSITIVE_ACCESS_AFTER_ANOMALY,
            title=f"Sensitive resource access after anomalous login — {user}",
            description=(
                f"{user} accessed {len(sensitive_events)} sensitive resource(s) "
                f"({', '.join(resources)}) following a '{source_anomaly.anomaly_type}' pattern. "
                "If the prior login was unauthorised, this access may represent data exposure risk. "
                "Human verification is strongly recommended."
            ),
            severity=severity,
            confidence=confidence,
            risk_score=score,
            start_time=source_anomaly.start_time,
            end_time=sensitive_events[-1].timestamp,
            mitre_tactic="Collection",
            mitre_technique="Data collection after anomalous login — possible exfiltration-adjacent signal",
            evidence_detail={
                "source_anomaly_type": source_anomaly.anomaly_type,
                "sensitive_resources": resources,
                "access_count": len(sensitive_events),
            },
        )
        anomalies.append((anomaly, sensitive_events))

    return anomalies


# ---------------------------------------------------------------------------
# Main entry point
# ---------------------------------------------------------------------------


@transaction.atomic
def run_detection(organisation, events: list[LoginEvent] | None = None) -> dict:
    """
    Run all detection rules against an organisation's login events.
    If `events` is None, uses all events for the organisation.
    Returns a summary dict.
    """
    if events is None:
        events = list(LoginEvent.objects.filter(organisation=organisation))

    if not events:
        return {"anomalies_created": 0, "by_type": {}}

    # Run rules in sequence
    burst_pairs = detect_failed_login_bursts(organisation, events)
    success_pairs = detect_suspicious_success_after_failures(organisation, events)
    travel_pairs = detect_impossible_travel(organisation, events)
    device_pairs = detect_new_device(organisation, events)
    time_pairs = detect_unusual_time(organisation, events)

    all_pairs = burst_pairs + success_pairs + travel_pairs + device_pairs + time_pairs
    sensitive_pairs = detect_sensitive_access_after_anomaly(organisation, events, all_pairs)
    all_pairs.extend(sensitive_pairs)

    # Persist anomalies and link events
    created_count = 0
    by_type: dict[str, int] = defaultdict(int)

    for anomaly_obj, linked_events in all_pairs:
        # Deduplicate: skip if same user + type + start_time already exists
        exists = LoginAnomaly.objects.filter(
            organisation=organisation,
            user_identifier=anomaly_obj.user_identifier,
            anomaly_type=anomaly_obj.anomaly_type,
            start_time=anomaly_obj.start_time,
        ).exists()
        if exists:
            continue

        anomaly_obj.save()
        if linked_events:
            anomaly_obj.linked_events.set([e for e in linked_events if e.pk])
        created_count += 1
        by_type[anomaly_obj.anomaly_type] += 1

    return {
        "anomalies_created": created_count,
        "by_type": dict(by_type),
        "events_analysed": len(events),
    }
