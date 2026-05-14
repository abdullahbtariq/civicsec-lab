import pytest
from django.core.management import call_command
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.assets.models import Asset
from apps.organisations.models import Organisation
from apps.risk.models import RiskEvent
from apps.threatboard.models import AssetVulnerabilityMatch, Vulnerability, VulnerabilityScore


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def organisation_a():
    return Organisation.objects.create(name="Organisation A", slug="organisation-a")


@pytest.fixture
def organisation_b():
    return Organisation.objects.create(name="Organisation B", slug="organisation-b")


def make_user(email: str, organisation: Organisation, role: str) -> User:
    return User.objects.create_user(
        email=email,
        password="ChangeMe123!",
        full_name=email.split("@")[0],
        organisation=organisation,
        role=role,
    )


def make_asset(organisation: Organisation, name: str = "Staff Portal") -> Asset:
    return Asset.objects.create(
        organisation=organisation,
        name=name,
        asset_type=Asset.AssetType.WEB_APP,
        criticality=Asset.Criticality.HIGH,
        internet_exposed=True,
        data_sensitivity=Asset.DataSensitivity.SENSITIVE,
        vendor="Django",
        product="Civic Staff Portal",
    )


def make_vulnerability(cve_id: str = "CVE-2024-1234") -> Vulnerability:
    vulnerability = Vulnerability.objects.create(
        cve_id=cve_id,
        title="Demo vulnerability",
        vendor="Django",
        product="Civic Staff Portal",
        due_date=timezone.localdate(),
    )
    VulnerabilityScore.objects.create(
        vulnerability=vulnerability,
        kev_known_exploited=True,
        epss_percentile=0.9,
    )
    return vulnerability


@pytest.mark.django_db
def test_authenticated_viewer_can_read_vulnerabilities(api_client, organisation_a):
    viewer = make_user("viewer@example.test", organisation_a, User.Role.VIEWER)
    vulnerability = make_vulnerability()
    api_client.force_authenticate(user=viewer)

    response = api_client.get(reverse("threatboard-vulnerability-list"))

    assert response.status_code == 200
    assert response.data[0]["cve_id"] == vulnerability.cve_id


@pytest.mark.django_db
def test_unauthenticated_user_cannot_access_threatboard_endpoints(api_client):
    response = api_client.get(reverse("threatboard-vulnerability-list"))

    assert response.status_code in {401, 403}


@pytest.mark.django_db
def test_viewer_cannot_trigger_ingest_or_match(api_client, organisation_a):
    viewer = make_user("viewer@example.test", organisation_a, User.Role.VIEWER)
    api_client.force_authenticate(user=viewer)

    ingest_response = api_client.post(reverse("threatboard-ingest-kev"), {}, format="json")
    match_response = api_client.post(reverse("threatboard-match-assets"), {}, format="json")

    assert ingest_response.status_code == 403
    assert match_response.status_code == 403


@pytest.mark.django_db
def test_analyst_can_trigger_match_endpoint(api_client, organisation_a):
    analyst = make_user("analyst@example.test", organisation_a, User.Role.ANALYST)
    asset = make_asset(organisation_a)
    vulnerability = make_vulnerability()
    api_client.force_authenticate(user=analyst)

    response = api_client.post(
        reverse("threatboard-match-assets"),
        {"create_risk_events": True},
        format="json",
    )

    assert response.status_code == 202
    assert AssetVulnerabilityMatch.objects.filter(asset=asset, vulnerability=vulnerability).exists()
    assert RiskEvent.objects.filter(source_module=RiskEvent.SourceModule.THREATBOARD).exists()


@pytest.mark.django_db
def test_organisation_user_only_sees_own_asset_matches(
    api_client,
    organisation_a,
    organisation_b,
):
    viewer = make_user("viewer@example.test", organisation_a, User.Role.VIEWER)
    asset_a = make_asset(organisation_a, "A Staff Portal")
    asset_b = make_asset(organisation_b, "B Staff Portal")
    vulnerability = make_vulnerability()
    AssetVulnerabilityMatch.objects.create(
        organisation=organisation_a,
        asset=asset_a,
        vulnerability=vulnerability,
        calculated_risk_score=80,
        risk_band=AssetVulnerabilityMatch.RiskBand.CRITICAL,
    )
    AssetVulnerabilityMatch.objects.create(
        organisation=organisation_b,
        asset=asset_b,
        vulnerability=vulnerability,
        calculated_risk_score=80,
        risk_band=AssetVulnerabilityMatch.RiskBand.CRITICAL,
    )
    api_client.force_authenticate(user=viewer)

    response = api_client.get(reverse("threatboard-asset-match-list"))

    assert response.status_code == 200
    assert len(response.data) == 1
    assert response.data[0]["asset"]["name"] == "A Staff Portal"


@pytest.mark.django_db
def test_threatboard_overview_is_organisation_scoped(api_client, organisation_a, organisation_b):
    viewer = make_user("viewer@example.test", organisation_a, User.Role.VIEWER)
    asset_a = make_asset(organisation_a, "A Staff Portal")
    asset_b = make_asset(organisation_b, "B Staff Portal")
    vulnerability = make_vulnerability()
    AssetVulnerabilityMatch.objects.create(
        organisation=organisation_a,
        asset=asset_a,
        vulnerability=vulnerability,
        calculated_risk_score=80,
        risk_band=AssetVulnerabilityMatch.RiskBand.CRITICAL,
    )
    AssetVulnerabilityMatch.objects.create(
        organisation=organisation_b,
        asset=asset_b,
        vulnerability=vulnerability,
        calculated_risk_score=60,
        risk_band=AssetVulnerabilityMatch.RiskBand.HIGH,
    )
    api_client.force_authenticate(user=viewer)

    response = api_client.get(reverse("threatboard-overview"))

    assert response.status_code == 200
    assert response.data["asset_match_count"] == 1
    assert response.data["critical_match_count"] == 1
    assert response.data["high_match_count"] == 0


@pytest.mark.django_db
def test_seed_demo_creates_threatboard_demo_data():
    call_command("seed_demo")

    organisation = Organisation.objects.get(slug="open-civic-aid")

    assert (
        Vulnerability.objects.filter(
            cve_id__in=["CVE-2024-0001", "CVE-2024-0002", "CVE-2024-0003"]
        ).count()
        == 3
    )
    assert AssetVulnerabilityMatch.objects.filter(organisation=organisation).count() == 3
    assert (
        RiskEvent.objects.filter(
            organisation=organisation,
            source_module=RiskEvent.SourceModule.THREATBOARD,
        ).count()
        == 1
    )


@pytest.mark.django_db
def test_seed_demo_threatboard_data_is_idempotent():
    call_command("seed_demo")
    call_command("seed_demo")

    organisation = Organisation.objects.get(slug="open-civic-aid")

    assert Vulnerability.objects.filter(cve_id__startswith="CVE-2024-000").count() == 3
    assert AssetVulnerabilityMatch.objects.filter(organisation=organisation).count() == 3
    assert (
        RiskEvent.objects.filter(
            organisation=organisation,
            source_module=RiskEvent.SourceModule.THREATBOARD,
        ).count()
        == 1
    )
