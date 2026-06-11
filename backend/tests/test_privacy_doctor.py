"""
Tests for DataPrivacy Doctor — profiling, detection, risk scoring,
RiskEvent generation, permissions, and API endpoints.
"""

import io

import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from apps.organisations.models import Organisation
from apps.privacy_doctor.models import DatasetColumnProfile, UploadedDataset
from apps.privacy_doctor.services.detection import (
    classify_column,
    detect_direct_identifiers,
    detect_quasi_identifier_combination,
    detect_sensitive_attributes,
    infer_column_type,
    mask_value,
)
from apps.privacy_doctor.services.profiler import scan_dataset
from apps.privacy_doctor.services.risk_events import (
    RISK_SCORE_THRESHOLD,
    generate_risk_event_for_dataset,
)
from apps.privacy_doctor.services.risk_score import calculate_dataset_risk_score
from apps.privacy_doctor.services.synthetic import generate_synthetic_volunteer_csv

User = get_user_model()

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

SIMPLE_CSV = (
    b"full_name,email,age,city,notes\n"
    b"Alice Smith,alice@example.com,34,London,Available weekends\n"
    b"Bob Jones,bob@example.com,28,Manchester,No restrictions\n"
)

VOLUNTEER_CSV_HEADER = (
    b"volunteer_id,full_name,email,phone,date_of_birth,age,gender,"
    b"city,postcode,occupation,health_conditions,skills,notes,joined_date\n"
)


def make_org(name="Test Org", slug="test-org"):
    return Organisation.objects.create(name=name, slug=slug)


def make_user(org, role="admin"):
    return User.objects.create_user(
        email=f"{role}@{org.slug}.test",
        password="testpass",
        role=role,
        organisation=org,
    )


def auth_client(user):
    client = APIClient()
    client.force_authenticate(user=user)
    return client


def make_dataset(org, user=None, **kwargs):
    return UploadedDataset.objects.create(
        organisation=org,
        uploaded_by=user,
        original_filename="test.csv",
        **kwargs,
    )


# ---------------------------------------------------------------------------
# Column type inference
# ---------------------------------------------------------------------------


class TestTypeInference:
    def test_email_column_detected(self):
        result = infer_column_type("email", ["alice@example.com", "bob@test.org"])
        assert result == "email"

    def test_phone_column_detected(self):
        result = infer_column_type("phone_number", ["+44 7911 123456"])
        assert result == "phone"

    def test_date_column_detected(self):
        result = infer_column_type("date_of_birth", ["1990-05-15"])
        assert result == "date"

    def test_numeric_column_detected(self):
        result = infer_column_type("age", ["34", "28", "45", "22", "31"])
        assert result == "numeric"

    def test_free_text_detected_by_name(self):
        result = infer_column_type("notes", ["Some long text about this person"])
        assert result == "free_text"

    def test_identifier_column_detected(self):
        result = infer_column_type("volunteer_id", ["ABC123", "DEF456"])
        assert result == "identifier"


# ---------------------------------------------------------------------------
# Column classification
# ---------------------------------------------------------------------------


class TestColumnClassification:
    def test_email_is_direct_identifier(self):
        result = classify_column("email", "email", ["alice@example.com"])
        assert result["privacy_category"] == "direct_identifier"
        assert result["risk_score"] >= 70

    def test_full_name_is_direct_identifier(self):
        result = classify_column("full_name", "name", ["Alice Smith"])
        assert result["privacy_category"] == "direct_identifier"

    def test_age_is_quasi_identifier(self):
        result = classify_column("age", "numeric", ["34", "28"])
        assert result["privacy_category"] == "quasi_identifier"

    def test_city_is_quasi_identifier(self):
        result = classify_column("city", "text", ["London", "Manchester"])
        assert result["privacy_category"] == "quasi_identifier"

    def test_health_condition_is_sensitive(self):
        result = classify_column("health_conditions", "text", ["Asthma", ""])
        assert result["privacy_category"] == "sensitive_attribute"

    def test_religion_is_sensitive(self):
        result = classify_column("religion", "text", ["Christian", "Muslim"])
        assert result["privacy_category"] == "sensitive_attribute"

    def test_notes_is_free_text_risk(self):
        result = classify_column("notes", "free_text", ["Available weekends"])
        assert result["privacy_category"] == "free_text_risk"

    def test_skills_is_low_risk(self):
        result = classify_column("skills", "category", ["Tech", "Finance", "Legal"])
        assert result["privacy_category"] == "low_risk"


# ---------------------------------------------------------------------------
# Value masking
# ---------------------------------------------------------------------------


class TestValueMasking:
    def test_email_masked(self):
        masked = mask_value("alice@example.com", "email")
        assert "@" in masked
        assert "alice@example.com" not in masked

    def test_phone_masked(self):
        masked = mask_value("+44791112345", "phone")
        assert "***" in masked
        assert "+44791112345" not in masked

    def test_name_masked(self):
        masked = mask_value("Alice Smith", "name")
        assert "***" in masked
        assert "Alice Smith" not in masked


# ---------------------------------------------------------------------------
# Dataset-level finding detection
# ---------------------------------------------------------------------------


class TestFindingDetection:
    def _make_profiles(self, categories):
        return [
            {
                "column_name": f"col_{i}",
                "privacy_category": cat,
                "inferred_type": "text",
                "uniqueness_ratio": 0.5,
                "sample_values_masked": [],
                "risk_score": 50,
                "recommended_transformation": "remove column",
            }
            for i, cat in enumerate(categories)
        ]

    def test_direct_identifier_finding_created(self):
        profiles = self._make_profiles(["direct_identifier", "low_risk"])
        findings = detect_direct_identifiers(profiles)
        assert len(findings) == 1
        assert findings[0]["finding_type"] == "direct_identifier_detected"
        assert findings[0]["severity"] == "high"

    def test_quasi_combination_requires_3(self):
        profiles = self._make_profiles(["quasi_identifier", "quasi_identifier"])
        findings = detect_quasi_identifier_combination(profiles)
        assert len(findings) == 0

    def test_quasi_combination_triggered_at_3(self):
        profiles = self._make_profiles(["quasi_identifier", "quasi_identifier", "quasi_identifier"])
        findings = detect_quasi_identifier_combination(profiles)
        assert len(findings) == 1
        assert findings[0]["finding_type"] == "quasi_identifier_combination"

    def test_sensitive_attribute_finding(self):
        profiles = self._make_profiles(["sensitive_attribute"])
        findings = detect_sensitive_attributes(profiles)
        assert len(findings) == 1
        assert findings[0]["finding_type"] == "sensitive_attribute_detected"
        assert findings[0]["severity"] == "high"


# ---------------------------------------------------------------------------
# Risk score calculation
# ---------------------------------------------------------------------------


class TestRiskScoreCalculation:
    def _make_profiles(self, categories):
        return [{"privacy_category": cat} for cat in categories]

    def test_no_risk_columns_low_score(self):
        profiles = self._make_profiles(["low_risk", "low_risk"])
        score, band = calculate_dataset_risk_score(profiles, [])
        assert score < 21
        assert band == "low"

    def test_direct_identifier_raises_score(self):
        profiles = self._make_profiles(["direct_identifier", "low_risk"])
        score, band = calculate_dataset_risk_score(profiles, [])
        assert score >= 20

    def test_multiple_direct_identifiers_high_risk(self):
        profiles = self._make_profiles(["direct_identifier"] * 3 + ["quasi_identifier"] * 3)
        score, band = calculate_dataset_risk_score(profiles, [])
        assert band in {"high", "severe"}

    def test_score_capped_at_100(self):
        profiles = self._make_profiles(["direct_identifier"] * 20)
        score, _ = calculate_dataset_risk_score(profiles, [])
        assert score <= 100


# ---------------------------------------------------------------------------
# Full scan pipeline (integration)
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestScanPipeline:
    def test_simple_csv_creates_profiles_and_findings(self, db):
        org = make_org()
        user = make_user(org)
        dataset = make_dataset(org, user)
        summary = scan_dataset(dataset, SIMPLE_CSV)

        assert summary["row_count"] == 2
        assert summary["column_count"] == 5
        assert DatasetColumnProfile.objects.filter(dataset=dataset).count() == 5
        # email and full_name should be direct identifiers
        assert summary["direct_identifier_count"] >= 2

    def test_scan_sets_processing_status_complete(self, db):
        org = make_org()
        dataset = make_dataset(org)
        scan_dataset(dataset, SIMPLE_CSV)
        dataset.refresh_from_db()
        assert dataset.processing_status == UploadedDataset.ProcessingStatus.COMPLETE

    def test_scan_sets_risk_score(self, db):
        org = make_org()
        dataset = make_dataset(org)
        scan_dataset(dataset, SIMPLE_CSV)
        dataset.refresh_from_db()
        assert dataset.privacy_risk_score > 0

    def test_delete_after_processing_removes_file(self, db, tmp_path):
        org = make_org()
        # Create a real temp file
        tmp_file = tmp_path / "test.csv"
        tmp_file.write_bytes(SIMPLE_CSV)
        dataset = make_dataset(
            org,
            stored_file_path=str(tmp_file),
            retention_policy=UploadedDataset.RetentionPolicy.DELETE_AFTER_PROCESSING,
        )
        scan_dataset(dataset, SIMPLE_CSV)
        dataset.refresh_from_db()
        assert dataset.original_file_deleted is True
        assert not tmp_file.exists()

    def test_retain_for_demo_keeps_file(self, db, tmp_path):
        org = make_org()
        tmp_file = tmp_path / "demo.csv"
        tmp_file.write_bytes(SIMPLE_CSV)
        dataset = make_dataset(
            org,
            stored_file_path=str(tmp_file),
            retention_policy=UploadedDataset.RetentionPolicy.RETAIN_FOR_DEMO,
        )
        scan_dataset(dataset, SIMPLE_CSV)
        dataset.refresh_from_db()
        assert dataset.original_file_deleted is False

    def test_rescan_clears_old_profiles(self, db):
        org = make_org()
        dataset = make_dataset(org)
        scan_dataset(dataset, SIMPLE_CSV)
        scan_dataset(dataset, SIMPLE_CSV)  # second scan
        # Should not double-up profiles
        assert DatasetColumnProfile.objects.filter(dataset=dataset).count() == 5


# ---------------------------------------------------------------------------
# Risk event generation
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestRiskEventGeneration:
    def test_high_risk_dataset_creates_risk_event(self, db):
        org = make_org()
        dataset = make_dataset(
            org,
            privacy_risk_score=75,
            risk_band="severe",
            processing_status=UploadedDataset.ProcessingStatus.COMPLETE,
        )
        result = generate_risk_event_for_dataset(dataset)
        assert result["risk_event_created"] is True
        dataset.refresh_from_db()
        assert dataset.risk_event is not None

    def test_low_risk_dataset_skips_risk_event(self, db):
        org = make_org()
        dataset = make_dataset(
            org,
            privacy_risk_score=RISK_SCORE_THRESHOLD - 1,
            risk_band="low",
        )
        result = generate_risk_event_for_dataset(dataset)
        assert result["risk_event_created"] is False

    def test_already_linked_dataset_skips(self, db):
        from apps.risk.models import RiskEvent

        org = make_org()
        existing_event = RiskEvent.objects.create(
            organisation=org,
            source_module=RiskEvent.SourceModule.PRIVACY_DOCTOR,
            event_type="test",
            title="existing",
            severity=RiskEvent.Severity.HIGH,
        )
        dataset = make_dataset(
            org,
            privacy_risk_score=80,
            risk_band="severe",
            risk_event=existing_event,
        )
        result = generate_risk_event_for_dataset(dataset)
        assert result["risk_event_created"] is False
        assert result["reason"] == "already linked"


# ---------------------------------------------------------------------------
# Synthetic data generation
# ---------------------------------------------------------------------------


class TestSyntheticDataGeneration:
    def test_generates_valid_csv(self):
        csv_bytes = generate_synthetic_volunteer_csv(num_rows=10)
        assert isinstance(csv_bytes, bytes)
        assert b"email" in csv_bytes
        assert b"full_name" in csv_bytes

    def test_generates_correct_row_count(self):
        csv_bytes = generate_synthetic_volunteer_csv(num_rows=20)
        lines = csv_bytes.strip().split(b"\n")
        # 1 header + 20 data rows
        assert len(lines) == 21

    def test_contains_privacy_risk_columns(self):
        csv_bytes = generate_synthetic_volunteer_csv(num_rows=5)
        assert b"health_conditions" in csv_bytes
        assert b"date_of_birth" in csv_bytes
        assert b"postcode" in csv_bytes


# ---------------------------------------------------------------------------
# Organisation isolation
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestOrganisationIsolation:
    def test_datasets_scoped_to_organisation(self, db):
        org_a = make_org("Org A", "org-a")
        org_b = make_org("Org B", "org-b")
        make_dataset(org_a)
        make_dataset(org_b)
        viewer = make_user(org_a, "viewer")
        client = auth_client(viewer)
        response = client.get("/api/privacy-doctor/datasets/")
        assert response.status_code == 200
        data = (
            response.data
            if isinstance(response.data, list)
            else response.data.get("results", response.data)
        )
        assert len(data) == 1

    def test_cannot_access_other_org_dataset(self, db):
        org_a = make_org("Org A", "org-a")
        org_b = make_org("Org B", "org-b")
        dataset_b = make_dataset(org_b)
        viewer = make_user(org_a, "viewer")
        client = auth_client(viewer)
        response = client.get(f"/api/privacy-doctor/datasets/{dataset_b.id}/")
        assert response.status_code == 404


# ---------------------------------------------------------------------------
# Role-based access control
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestRoleBasedAccess:
    def test_unauthenticated_cannot_access(self, db):
        client = APIClient()
        response = client.get("/api/privacy-doctor/datasets/")
        assert response.status_code in {401, 403}

    def test_viewer_can_read_datasets(self, db):
        org = make_org()
        viewer = make_user(org, "viewer")
        client = auth_client(viewer)
        response = client.get("/api/privacy-doctor/datasets/")
        assert response.status_code == 200

    def test_viewer_cannot_upload(self, db):
        org = make_org()
        viewer = make_user(org, "viewer")
        client = auth_client(viewer)
        csv_file = io.BytesIO(SIMPLE_CSV)
        csv_file.name = "test.csv"
        response = client.post(
            "/api/privacy-doctor/upload-dataset/",
            {"file": csv_file},
            format="multipart",
        )
        assert response.status_code == 403

    def test_viewer_cannot_generate_synthetic(self, db):
        org = make_org()
        viewer = make_user(org, "viewer")
        client = auth_client(viewer)
        response = client.post("/api/privacy-doctor/generate-synthetic/", {}, format="json")
        assert response.status_code == 403

    def test_analyst_can_upload_csv(self, db):
        org = make_org()
        analyst = make_user(org, "analyst")
        client = auth_client(analyst)
        csv_file = io.BytesIO(SIMPLE_CSV)
        csv_file.name = "test.csv"
        response = client.post(
            "/api/privacy-doctor/upload-dataset/",
            {"file": csv_file},
            format="multipart",
        )
        assert response.status_code == 201
        assert response.data["row_count"] == 2

    def test_analyst_can_generate_synthetic(self, db):
        org = make_org()
        analyst = make_user(org, "analyst")
        client = auth_client(analyst)
        response = client.post(
            "/api/privacy-doctor/generate-synthetic/",
            {"num_rows": 10},
            format="json",
        )
        assert response.status_code == 201
        assert response.data["row_count"] == 10


# ---------------------------------------------------------------------------
# API endpoint tests
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestAPIEndpoints:
    def test_overview_returns_expected_keys(self, db):
        org = make_org()
        analyst = make_user(org, "analyst")
        client = auth_client(analyst)
        response = client.get("/api/privacy-doctor/overview/")
        assert response.status_code == 200
        assert "total_datasets" in response.data
        assert "high_risk_datasets" in response.data

    def test_upload_rejects_non_csv(self, db):
        org = make_org()
        analyst = make_user(org, "analyst")
        client = auth_client(analyst)
        txt_file = io.BytesIO(b"not a csv")
        txt_file.name = "data.txt"
        response = client.post(
            "/api/privacy-doctor/upload-dataset/",
            {"file": txt_file},
            format="multipart",
        )
        assert response.status_code == 400

    def test_column_profiles_returned_after_scan(self, db):
        org = make_org()
        analyst = make_user(org, "analyst")
        client = auth_client(analyst)
        csv_file = io.BytesIO(SIMPLE_CSV)
        csv_file.name = "test.csv"
        upload_resp = client.post(
            "/api/privacy-doctor/upload-dataset/",
            {"file": csv_file},
            format="multipart",
        )
        assert upload_resp.status_code == 201
        dataset_id = upload_resp.data["dataset_id"]

        profiles_resp = client.get(f"/api/privacy-doctor/datasets/{dataset_id}/column-profiles/")
        assert profiles_resp.status_code == 200
        data = profiles_resp.data if isinstance(profiles_resp.data, list) else []
        assert len(data) == 5  # 5 columns in SIMPLE_CSV

    def test_findings_returned_after_scan(self, db):
        org = make_org()
        analyst = make_user(org, "analyst")
        client = auth_client(analyst)
        csv_file = io.BytesIO(SIMPLE_CSV)
        csv_file.name = "test.csv"
        upload_resp = client.post(
            "/api/privacy-doctor/upload-dataset/",
            {"file": csv_file},
            format="multipart",
        )
        dataset_id = upload_resp.data["dataset_id"]

        findings_resp = client.get(f"/api/privacy-doctor/datasets/{dataset_id}/findings/")
        assert findings_resp.status_code == 200
        data = findings_resp.data if isinstance(findings_resp.data, list) else []
        # Should have at least one finding (email + full_name are direct identifiers)
        assert len(data) >= 1

    def test_report_generated_as_json(self, db):
        org = make_org()
        analyst = make_user(org, "analyst")
        client = auth_client(analyst)
        csv_file = io.BytesIO(SIMPLE_CSV)
        csv_file.name = "test.csv"
        upload_resp = client.post(
            "/api/privacy-doctor/upload-dataset/",
            {"file": csv_file},
            format="multipart",
        )
        dataset_id = upload_resp.data["dataset_id"]

        report_resp = client.get(f"/api/privacy-doctor/datasets/{dataset_id}/report/")
        assert report_resp.status_code == 200
        assert "report_markdown" in report_resp.data
        assert "# Privacy Review Report" in report_resp.data["report_markdown"]

    def test_delete_original_marks_dataset(self, db):
        org = make_org()
        analyst = make_user(org, "analyst")
        client = auth_client(analyst)
        dataset = make_dataset(
            org, analyst, retention_policy=UploadedDataset.RetentionPolicy.MANUAL_DELETE
        )
        response = client.post(f"/api/privacy-doctor/datasets/{dataset.id}/delete-original/")
        assert response.status_code == 200
        dataset.refresh_from_db()
        assert dataset.original_file_deleted is True
