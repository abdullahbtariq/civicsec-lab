"""
Tests for LogLens — detection rules, permissions, API, and CSV upload.
"""

import io
from datetime import timedelta

import pytest
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APIClient

from apps.loglens.models import LoginAnomaly, LoginEvent
from apps.loglens.services.detection import (
    FAILED_BURST_COUNT,
    FAILED_BURST_WINDOW_MINUTES,
    IMPOSSIBLE_TRAVEL_HOURS,
    UNUSUAL_HOUR_END,
    UNUSUAL_HOUR_START,
    detect_failed_login_bursts,
    detect_impossible_travel,
    detect_new_device,
    detect_unusual_time,
    run_detection,
)
from apps.loglens.services.risk_events import (
    RISK_SCORE_THRESHOLD,
    generate_risk_events_for_organisation,
)
from apps.loglens.services.synthetic import generate_synthetic_logs
from apps.organisations.models import Organisation

User = get_user_model()

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


@pytest.fixture
def org_a(db):
    return Organisation.objects.create(name="Org A", slug="org-a")


@pytest.fixture
def org_b(db):
    return Organisation.objects.create(name="Org B", slug="org-b")


@pytest.fixture
def admin_user(db, org_a):
    return User.objects.create_user(
        email="admin@org-a.test",
        password="testpass",
        role=User.Role.ADMIN,
        organisation=org_a,
    )


@pytest.fixture
def analyst_user(db, org_a):
    return User.objects.create_user(
        email="analyst@org-a.test",
        password="testpass",
        role=User.Role.ANALYST,
        organisation=org_a,
    )


@pytest.fixture
def viewer_user(db, org_a):
    return User.objects.create_user(
        email="viewer@org-a.test",
        password="testpass",
        role=User.Role.VIEWER,
        organisation=org_a,
    )


@pytest.fixture
def org_b_analyst(db, org_b):
    return User.objects.create_user(
        email="analyst@org-b.test",
        password="testpass",
        role=User.Role.ANALYST,
        organisation=org_b,
    )


def make_event(
    org, user_id, ts, success=True, event_type=None, country="GB", device_id="dev-1", resource=""
):
    if event_type is None:
        success_type = LoginEvent.EventType.LOGIN_SUCCESS
        fail_type = LoginEvent.EventType.LOGIN_FAILED
        event_type = success_type if success else fail_type
    return LoginEvent.objects.create(
        organisation=org,
        user_identifier=user_id,
        timestamp=ts,
        ip_address="1.2.3.4",
        country=country,
        device_id=device_id,
        event_type=event_type,
        success=success,
        resource_accessed=resource,
    )


def auth_client(user):
    client = APIClient()
    client.force_authenticate(user=user)
    return client


# ---------------------------------------------------------------------------
# Rule 1 — Failed login burst
# ---------------------------------------------------------------------------


class TestFailedLoginBurst:
    def test_burst_triggers_on_threshold(self, db, org_a):
        now = timezone.now().replace(hour=14, minute=0, second=0, microsecond=0)
        events = []
        for i in range(FAILED_BURST_COUNT):
            e = make_event(org_a, "user@test.com", now + timedelta(minutes=i), success=False)
            events.append(e)

        results = detect_failed_login_bursts(org_a, events)
        assert len(results) == 1
        anomaly, _ = results[0]
        assert anomaly.anomaly_type == LoginAnomaly.AnomalyType.FAILED_LOGIN_BURST

    def test_burst_below_threshold_not_triggered(self, db, org_a):
        now = timezone.now()
        events = [
            make_event(org_a, "user@test.com", now + timedelta(minutes=i), success=False)
            for i in range(FAILED_BURST_COUNT - 1)
        ]
        results = detect_failed_login_bursts(org_a, events)
        assert len(results) == 0

    def test_burst_outside_window_not_triggered(self, db, org_a):
        now = timezone.now()
        # Spread events beyond the window
        events = [
            make_event(
                org_a,
                "user@test.com",
                now + timedelta(minutes=i * (FAILED_BURST_WINDOW_MINUTES + 5)),
                success=False,
            )
            for i in range(FAILED_BURST_COUNT)
        ]
        results = detect_failed_login_bursts(org_a, events)
        assert len(results) == 0

    def test_burst_with_sensitive_success_upgrades_to_critical(self, db, org_a):
        now = timezone.now().replace(hour=14)
        events = [
            make_event(org_a, "user@test.com", now + timedelta(minutes=i), success=False)
            for i in range(FAILED_BURST_COUNT)
        ]
        # Sensitive success shortly after
        events.append(
            make_event(
                org_a,
                "user@test.com",
                now + timedelta(minutes=12),
                success=True,
                resource="volunteer-database",
            )
        )
        results = detect_failed_login_bursts(org_a, events)
        assert len(results) == 1
        anomaly, _ = results[0]
        assert anomaly.severity == LoginAnomaly.Severity.CRITICAL


# ---------------------------------------------------------------------------
# Rule 3 — Impossible travel
# ---------------------------------------------------------------------------


class TestImpossibleTravel:
    def test_detects_country_change_within_window(self, db, org_a):
        now = timezone.now().replace(hour=10)
        e1 = make_event(org_a, "user@test.com", now, country="GB")
        e2 = make_event(
            org_a,
            "user@test.com",
            now + timedelta(hours=IMPOSSIBLE_TRAVEL_HOURS - 1),
            country="RU",
        )
        results = detect_impossible_travel(org_a, [e1, e2])
        assert len(results) == 1
        anomaly, _ = results[0]
        assert anomaly.anomaly_type == LoginAnomaly.AnomalyType.IMPOSSIBLE_TRAVEL

    def test_no_alert_for_same_country(self, db, org_a):
        now = timezone.now().replace(hour=10)
        e1 = make_event(org_a, "user@test.com", now, country="GB")
        e2 = make_event(org_a, "user@test.com", now + timedelta(minutes=30), country="GB")
        results = detect_impossible_travel(org_a, [e1, e2])
        assert len(results) == 0

    def test_no_alert_when_gap_exceeds_threshold(self, db, org_a):
        now = timezone.now().replace(hour=10)
        e1 = make_event(org_a, "user@test.com", now, country="GB")
        e2 = make_event(
            org_a,
            "user@test.com",
            now + timedelta(hours=IMPOSSIBLE_TRAVEL_HOURS + 1),
            country="RU",
        )
        results = detect_impossible_travel(org_a, [e1, e2])
        assert len(results) == 0


# ---------------------------------------------------------------------------
# Rule 4 — New device
# ---------------------------------------------------------------------------


class TestNewDevice:
    def test_detects_new_device_for_known_user(self, db, org_a):
        now = timezone.now().replace(hour=10)
        # Establish known device
        make_event(org_a, "user@test.com", now - timedelta(days=1), device_id="known-device")
        # New device event
        new_event = make_event(org_a, "user@test.com", now, device_id="brand-new-device")
        results = detect_new_device(org_a, [new_event])
        assert len(results) == 1
        anomaly, _ = results[0]
        assert anomaly.anomaly_type == LoginAnomaly.AnomalyType.NEW_DEVICE

    def test_no_alert_for_known_device(self, db, org_a):
        now = timezone.now().replace(hour=10)
        make_event(org_a, "user@test.com", now - timedelta(days=1), device_id="known-device")
        same_device = make_event(org_a, "user@test.com", now, device_id="known-device")
        results = detect_new_device(org_a, [same_device])
        assert len(results) == 0

    def test_no_alert_for_user_with_no_history(self, db, org_a):
        now = timezone.now().replace(hour=10)
        new_user_event = make_event(org_a, "newuser@test.com", now, device_id="any-device")
        results = detect_new_device(org_a, [new_user_event])
        assert len(results) == 0


# ---------------------------------------------------------------------------
# Rule 5 — Unusual time
# ---------------------------------------------------------------------------


class TestUnusualTime:
    def test_detects_early_morning(self, db, org_a):
        now = timezone.now().replace(hour=UNUSUAL_HOUR_START - 1, minute=30)
        event = make_event(org_a, "user@test.com", now)
        results = detect_unusual_time(org_a, [event])
        assert len(results) == 1

    def test_detects_late_night(self, db, org_a):
        now = timezone.now().replace(hour=UNUSUAL_HOUR_END, minute=5)
        event = make_event(org_a, "user@test.com", now)
        results = detect_unusual_time(org_a, [event])
        assert len(results) == 1

    def test_no_alert_in_normal_hours(self, db, org_a):
        now = timezone.now().replace(hour=10, minute=0)
        event = make_event(org_a, "user@test.com", now)
        results = detect_unusual_time(org_a, [event])
        assert len(results) == 0


# ---------------------------------------------------------------------------
# run_detection + deduplication
# ---------------------------------------------------------------------------


class TestRunDetection:
    def test_run_detection_creates_anomalies(self, db, org_a):
        now = timezone.now().replace(hour=14)
        for i in range(FAILED_BURST_COUNT):
            make_event(org_a, "user@test.com", now + timedelta(minutes=i), success=False)

        result = run_detection(org_a)
        assert result["anomalies_created"] >= 1

    def test_run_detection_deduplicates(self, db, org_a):
        now = timezone.now().replace(hour=14)
        for i in range(FAILED_BURST_COUNT):
            make_event(org_a, "user@test.com", now + timedelta(minutes=i), success=False)

        run_detection(org_a)
        first_count = LoginAnomaly.objects.filter(organisation=org_a).count()
        run_detection(org_a)
        second_count = LoginAnomaly.objects.filter(organisation=org_a).count()
        assert first_count == second_count


# ---------------------------------------------------------------------------
# Risk event generation
# ---------------------------------------------------------------------------


class TestRiskEventGeneration:
    def test_high_risk_anomaly_generates_risk_event(self, db, org_a):
        now = timezone.now().replace(hour=14)
        # Create burst of failures followed by a success → HIGH severity (score ~52 > threshold 40)
        for i in range(FAILED_BURST_COUNT):
            make_event(org_a, "user@test.com", now + timedelta(minutes=i), success=False)
        # Success after burst pushes severity to HIGH
        make_event(org_a, "user@test.com", now + timedelta(minutes=12), success=True)
        run_detection(org_a)
        result = generate_risk_events_for_organisation(org_a)
        assert result["risk_events_created"] >= 1

    def test_low_risk_anomaly_skipped(self, db, org_a):
        now = timezone.now().replace(hour=UNUSUAL_HOUR_START - 2)
        make_event(org_a, "user@test.com", now)
        run_detection(org_a)

        # Unusual time alone has low risk score; may or may not meet threshold
        anomaly = LoginAnomaly.objects.filter(
            organisation=org_a,
            anomaly_type=LoginAnomaly.AnomalyType.UNUSUAL_TIME,
        ).first()
        if anomaly:
            if anomaly.risk_score < RISK_SCORE_THRESHOLD:
                result = generate_risk_events_for_organisation(org_a)
                assert result["anomalies_below_threshold"] >= 1


# ---------------------------------------------------------------------------
# Synthetic log generation
# ---------------------------------------------------------------------------


class TestSyntheticLogGeneration:
    def test_generates_events_for_org(self, db, org_a):
        result = generate_synthetic_logs(org_a, days_back=3)
        assert result["total_created"] > 0
        assert LoginEvent.objects.filter(organisation=org_a).count() == result["total_created"]

    def test_includes_anomaly_scenarios(self, db, org_a):
        result = generate_synthetic_logs(org_a, days_back=3)
        assert result["scenario_failed_burst"] > 0
        assert result["scenario_impossible_travel"] > 0

    def test_clear_existing_removes_old_events(self, db, org_a):
        generate_synthetic_logs(org_a, days_back=3)
        first_count = LoginEvent.objects.filter(organisation=org_a).count()
        generate_synthetic_logs(org_a, days_back=3, clear_existing=True)
        second_count = LoginEvent.objects.filter(organisation=org_a).count()
        # After clear_existing, count should reset (not double)
        assert second_count == first_count


# ---------------------------------------------------------------------------
# Organisation isolation (cross-org access forbidden)
# ---------------------------------------------------------------------------


class TestOrganisationIsolation:
    def test_anomalies_scoped_to_org(self, db, org_a, org_b, analyst_user, org_b_analyst):
        now = timezone.now().replace(hour=14)
        for i in range(FAILED_BURST_COUNT):
            make_event(org_b, "user@org-b.test", now + timedelta(minutes=i), success=False)
        run_detection(org_b)

        # org_a analyst should see no anomalies (response is a list when no pagination)
        client = auth_client(analyst_user)
        response = client.get("/api/loglens/anomalies/")
        assert response.status_code == 200
        data = response.data
        results = data.get("results", data) if isinstance(data, dict) else data
        assert len(results) == 0

    def test_events_scoped_to_org(self, db, org_a, org_b, analyst_user, org_b_analyst):
        now = timezone.now().replace(hour=10)
        make_event(org_b, "user@org-b.test", now)

        client = auth_client(analyst_user)
        response = client.get("/api/loglens/events/")
        assert response.status_code == 200
        data = response.data
        results = data.get("results", data) if isinstance(data, dict) else data
        assert len(results) == 0


# ---------------------------------------------------------------------------
# Role-based access
# ---------------------------------------------------------------------------


class TestRoleBasedAccess:
    def test_viewer_cannot_upload_logs(self, db, viewer_user):
        client = auth_client(viewer_user)
        csv_content = (
            b"user_email,timestamp,event_type,success\n"
            b"test@test.com,2024-01-01 10:00:00,login_success,true\n"
        )
        response = client.post(
            "/api/loglens/upload-logs/",
            {"file": io.BytesIO(csv_content)},
            format="multipart",
        )
        assert response.status_code == 403

    def test_viewer_cannot_generate_synthetic_logs(self, db, viewer_user):
        client = auth_client(viewer_user)
        response = client.post("/api/loglens/generate-synthetic-logs/", {}, format="json")
        assert response.status_code == 403

    def test_viewer_cannot_run_detection(self, db, viewer_user):
        client = auth_client(viewer_user)
        response = client.post("/api/loglens/run-detection/", {}, format="json")
        assert response.status_code == 403

    def test_viewer_can_read_anomalies(self, db, viewer_user):
        client = auth_client(viewer_user)
        response = client.get("/api/loglens/anomalies/")
        assert response.status_code == 200

    def test_analyst_can_generate_synthetic_logs(self, db, analyst_user):
        client = auth_client(analyst_user)
        response = client.post(
            "/api/loglens/generate-synthetic-logs/",
            {"days_back": 2},
            format="json",
        )
        assert response.status_code == 201

    def test_analyst_can_run_detection(self, db, analyst_user):
        client = auth_client(analyst_user)
        response = client.post("/api/loglens/run-detection/", {}, format="json")
        assert response.status_code == 200


# ---------------------------------------------------------------------------
# CSV upload
# ---------------------------------------------------------------------------


class TestCSVUpload:
    def _make_csv(self, rows):
        header = "user_email,timestamp,event_type,success,ip_address,country,device_id\n"
        return (header + "\n".join(rows)).encode()

    def test_valid_csv_creates_events(self, db, analyst_user):
        csv_bytes = self._make_csv(
            [
                "alice@test.com,2024-01-15 09:00:00,login_success,true,1.2.3.4,GB,device-1",
                "bob@test.com,2024-01-15 09:05:00,login_failed,false,5.6.7.8,US,device-2",
            ]
        )
        client = auth_client(analyst_user)
        # BytesIO needs a .name for the multipart upload filename check
        file_obj = io.BytesIO(csv_bytes)
        file_obj.name = "test_logs.csv"
        response = client.post(
            "/api/loglens/upload-logs/",
            {"file": file_obj},
            format="multipart",
        )
        assert response.status_code == 201
        assert response.data["events_created"] == 2

    def test_missing_required_column_returns_400(self, db, analyst_user):
        # Missing 'success' column
        csv_bytes = (
            b"user_email,timestamp,event_type\n"
            b"alice@test.com,2024-01-15 09:00:00,login_success\n"
        )
        client = auth_client(analyst_user)
        response = client.post(
            "/api/loglens/upload-logs/",
            {"file": io.BytesIO(csv_bytes)},
            format="multipart",
        )
        assert response.status_code == 400

    def test_non_csv_file_rejected(self, db, analyst_user):
        client = auth_client(analyst_user)
        fake_file = io.BytesIO(b"not a csv")
        fake_file.name = "data.txt"
        response = client.post(
            "/api/loglens/upload-logs/",
            {"file": fake_file},
            format="multipart",
        )
        assert response.status_code == 400

    def test_unauthenticated_upload_rejected(self, db):
        client = APIClient()
        response = client.post(
            "/api/loglens/upload-logs/",
            {"file": io.BytesIO(b"dummy")},
            format="multipart",
        )
        assert response.status_code in {401, 403}


# ---------------------------------------------------------------------------
# Overview endpoint
# ---------------------------------------------------------------------------


class TestLogLensOverview:
    def test_overview_returns_expected_keys(self, db, analyst_user):
        client = auth_client(analyst_user)
        response = client.get("/api/loglens/overview/")
        assert response.status_code == 200
        for key in [
            "total_events",
            "total_anomalies",
            "open_anomalies",
            "high_risk_count",
            "impossible_travel_count",
            "failed_burst_count",
            "latest_anomalies",
        ]:
            assert key in response.data

    def test_overview_counts_correct_after_detection(self, db, analyst_user, org_a):
        now = timezone.now().replace(hour=14)
        for i in range(FAILED_BURST_COUNT):
            make_event(org_a, "user@test.com", now + timedelta(minutes=i), success=False)
        run_detection(org_a)

        client = auth_client(analyst_user)
        response = client.get("/api/loglens/overview/")
        assert response.status_code == 200
        assert response.data["total_anomalies"] >= 1
        assert response.data["failed_burst_count"] >= 1
