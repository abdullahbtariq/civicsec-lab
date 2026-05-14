from datetime import timedelta

import pytest
from django.core.exceptions import ValidationError
from django.db import IntegrityError, transaction
from django.utils import timezone

from apps.assets.models import Asset
from apps.evidence.models import EvidenceItem
from apps.organisations.models import Organisation
from apps.risk.models import ActionRecommendation, RiskEvent
from apps.threatboard.models import AssetVulnerabilityMatch, Vulnerability, VulnerabilityScore
from apps.threatboard.services import epss
from apps.threatboard.services.kev import parse_kev_items, upsert_kev_vulnerabilities
from apps.threatboard.services.matching import match_vulnerabilities_to_assets
from apps.threatboard.services.risk_events import create_or_update_risk_event_for_match
from apps.threatboard.services.scoring import (
    calculate_threatboard_risk_score,
    risk_band_from_score,
)


@pytest.fixture
def organisation():
    return Organisation.objects.create(name="Open Civic Aid", slug="open-civic-aid")


def make_asset(organisation, **overrides):
    defaults = {
        "organisation": organisation,
        "name": "Staff Portal",
        "asset_type": Asset.AssetType.WEB_APP,
        "criticality": Asset.Criticality.HIGH,
        "internet_exposed": True,
        "data_sensitivity": Asset.DataSensitivity.SENSITIVE,
        "vendor": "Django",
        "product": "Civic Staff Portal",
    }
    defaults.update(overrides)
    return Asset.objects.create(**defaults)


def make_vulnerability(**overrides):
    defaults = {
        "cve_id": "CVE-2024-1234",
        "title": "Demo vulnerability",
        "vendor": "Django",
        "product": "Civic Staff Portal",
        "source": Vulnerability.Source.MANUAL,
    }
    defaults.update(overrides)
    return Vulnerability.objects.create(**defaults)


@pytest.mark.django_db
def test_vulnerability_cve_id_is_normalized():
    vulnerability = Vulnerability(cve_id=" cve-2024-1234 ", title="Demo")

    vulnerability.full_clean()
    vulnerability.save()

    assert vulnerability.cve_id == "CVE-2024-1234"


@pytest.mark.django_db
@pytest.mark.parametrize("value", [-0.1, 1.1])
def test_vulnerability_score_epss_validation(value):
    vulnerability = make_vulnerability()
    score = VulnerabilityScore(vulnerability=vulnerability, epss_score=value)

    with pytest.raises(ValidationError):
        score.full_clean()


@pytest.mark.django_db
@pytest.mark.parametrize("value", [-0.1, 10.1])
def test_vulnerability_score_cvss_validation(value):
    vulnerability = make_vulnerability()
    score = VulnerabilityScore(vulnerability=vulnerability, cvss_score=value)

    with pytest.raises(ValidationError):
        score.full_clean()


@pytest.mark.django_db
@pytest.mark.parametrize(
    "field,value",
    [("match_confidence", -0.1), ("match_confidence", 1.1), ("calculated_risk_score", 101)],
)
def test_asset_vulnerability_match_validation(organisation, field, value):
    asset = make_asset(organisation)
    vulnerability = make_vulnerability()
    match = AssetVulnerabilityMatch(
        organisation=organisation,
        asset=asset,
        vulnerability=vulnerability,
        **{field: value},
    )

    with pytest.raises(ValidationError):
        match.full_clean()


@pytest.mark.django_db
def test_unique_asset_vulnerability_match_constraint(organisation):
    asset = make_asset(organisation)
    vulnerability = make_vulnerability()
    AssetVulnerabilityMatch.objects.create(
        organisation=organisation,
        asset=asset,
        vulnerability=vulnerability,
    )

    with pytest.raises(IntegrityError), transaction.atomic():
        AssetVulnerabilityMatch.objects.create(
            organisation=organisation,
            asset=asset,
            vulnerability=vulnerability,
        )


@pytest.mark.django_db
def test_critical_internet_facing_kev_match_scores_high_or_critical(organisation):
    asset = make_asset(organisation, criticality=Asset.Criticality.CRITICAL)
    vulnerability = make_vulnerability(due_date=timezone.localdate() - timedelta(days=1))
    VulnerabilityScore.objects.create(
        vulnerability=vulnerability,
        kev_known_exploited=True,
        epss_percentile=0.95,
    )

    score = calculate_threatboard_risk_score(asset, vulnerability, 0.95)

    assert score.score >= 71
    assert score.risk_band == AssetVulnerabilityMatch.RiskBand.CRITICAL


@pytest.mark.django_db
def test_low_sensitivity_non_internet_asset_scores_lower(organisation):
    asset = make_asset(
        organisation,
        criticality=Asset.Criticality.LOW,
        internet_exposed=False,
        data_sensitivity=Asset.DataSensitivity.PUBLIC,
    )
    vulnerability = make_vulnerability()
    VulnerabilityScore.objects.create(vulnerability=vulnerability, epss_percentile=0.1)

    score = calculate_threatboard_risk_score(asset, vulnerability, 0.4)

    assert score.score <= 20
    assert score.risk_band == AssetVulnerabilityMatch.RiskBand.LOW


@pytest.mark.parametrize(
    ("score", "band"),
    [
        (0, "low"),
        (20, "low"),
        (21, "medium"),
        (45, "medium"),
        (46, "high"),
        (70, "high"),
        (71, "critical"),
    ],
)
def test_risk_band_from_score(score, band):
    assert risk_band_from_score(score) == band


@pytest.mark.django_db
def test_overdue_due_date_adds_component(organisation):
    asset = make_asset(organisation, internet_exposed=False)
    overdue = make_vulnerability(
        cve_id="CVE-2024-1111", due_date=timezone.localdate() - timedelta(days=1)
    )
    not_overdue = make_vulnerability(
        cve_id="CVE-2024-2222", due_date=timezone.localdate() + timedelta(days=1)
    )

    overdue_score = calculate_threatboard_risk_score(asset, overdue, 0.5)
    not_overdue_score = calculate_threatboard_risk_score(asset, not_overdue, 0.5)

    assert overdue_score.components["overdue_component"] == 5
    assert overdue_score.score > not_overdue_score.score


def test_parse_sample_kev_payload_correctly():
    payload = {
        "vulnerabilities": [
            {
                "cveID": "CVE-2024-1234",
                "vendorProject": "ExampleVendor",
                "product": "ExampleProduct",
                "vulnerabilityName": "Example vulnerability",
                "shortDescription": "Defensive metadata only.",
                "dateAdded": "2024-01-10",
                "dueDate": "2024-02-01",
                "knownRansomwareCampaignUse": "Known",
                "requiredAction": "Apply vendor patch or mitigation.",
                "notes": "Public KEV-style record.",
            }
        ]
    }

    items = parse_kev_items(payload)

    assert items[0]["cve_id"] == "CVE-2024-1234"
    assert items[0]["vendor"] == "ExampleVendor"
    assert items[0]["known_ransomware_campaign_use"] is True


@pytest.mark.django_db
def test_upsert_kev_creates_vulnerability_and_score():
    summary = upsert_kev_vulnerabilities(
        [
            {
                "cve_id": "CVE-2024-1234",
                "vendor": "ExampleVendor",
                "product": "ExampleProduct",
                "title": "Example vulnerability",
                "description": "Defensive metadata only.",
                "date_added_to_kev": timezone.localdate(),
                "due_date": timezone.localdate(),
                "known_ransomware_campaign_use": False,
                "required_action": "Apply vendor patch or mitigation.",
                "notes": "",
            }
        ]
    )

    vulnerability = Vulnerability.objects.get(cve_id="CVE-2024-1234")
    assert summary["created"] == 1
    assert vulnerability.score.kev_known_exploited is True


@pytest.mark.django_db
def test_malformed_kev_item_does_not_crash_whole_ingestion():
    summary = upsert_kev_vulnerabilities(
        [
            {"cveID": "not-a-cve"},
            {
                "cveID": "CVE-2024-1234",
                "vendorProject": "ExampleVendor",
                "product": "ExampleProduct",
                "vulnerabilityName": "Example vulnerability",
            },
        ]
    )

    assert summary["failed"] == 1
    assert Vulnerability.objects.filter(cve_id="CVE-2024-1234").exists()


def test_parse_sample_epss_response_correctly():
    payload = {"data": [{"cve": "CVE-2024-1234", "epss": "0.42", "percentile": "0.91"}]}

    scores = epss.parse_epss_response(payload)

    assert scores["CVE-2024-1234"]["epss_score"] == 0.42
    assert scores["CVE-2024-1234"]["epss_percentile"] == 0.91


@pytest.mark.django_db
def test_missing_epss_cve_is_handled_gracefully(monkeypatch):
    vulnerability = make_vulnerability()
    monkeypatch.setattr(epss, "fetch_epss_scores", lambda cve_ids: {})

    summary = epss.enrich_vulnerabilities_with_epss([vulnerability.cve_id])

    assert summary["seen"] == 1
    assert summary["failed"] == 1
    assert not VulnerabilityScore.objects.filter(vulnerability=vulnerability).exists()


@pytest.mark.django_db
def test_exact_vendor_product_match_creates_asset_match(organisation):
    asset = make_asset(organisation)
    vulnerability = make_vulnerability()
    VulnerabilityScore.objects.create(vulnerability=vulnerability, epss_percentile=0.8)

    summary = match_vulnerabilities_to_assets(organisation=organisation)

    assert summary["matches_created"] == 1
    assert AssetVulnerabilityMatch.objects.filter(asset=asset, vulnerability=vulnerability).exists()


@pytest.mark.django_db
def test_matching_preserves_organisation_scoping(organisation):
    other_org = Organisation.objects.create(name="Other Org", slug="other-org")
    asset = make_asset(organisation)
    other_asset = make_asset(other_org, name="Other Staff Portal")
    vulnerability = make_vulnerability()
    VulnerabilityScore.objects.create(vulnerability=vulnerability, epss_percentile=0.8)

    match_vulnerabilities_to_assets(organisation=organisation)

    assert AssetVulnerabilityMatch.objects.filter(asset=asset).exists()
    assert not AssetVulnerabilityMatch.objects.filter(asset=other_asset).exists()


@pytest.mark.django_db
def test_matching_twice_is_idempotent(organisation):
    make_asset(organisation)
    vulnerability = make_vulnerability()
    VulnerabilityScore.objects.create(vulnerability=vulnerability, epss_percentile=0.8)

    match_vulnerabilities_to_assets(organisation=organisation)
    match_vulnerabilities_to_assets(organisation=organisation)

    assert AssetVulnerabilityMatch.objects.count() == 1


@pytest.mark.django_db
def test_high_match_creates_risk_event_evidence_and_recommendations(organisation):
    make_asset(organisation, criticality=Asset.Criticality.CRITICAL)
    vulnerability = make_vulnerability(due_date=timezone.localdate() - timedelta(days=1))
    VulnerabilityScore.objects.create(
        vulnerability=vulnerability,
        kev_known_exploited=True,
        epss_percentile=0.95,
    )
    match_vulnerabilities_to_assets(organisation=organisation)
    match = AssetVulnerabilityMatch.objects.get()

    risk_event = create_or_update_risk_event_for_match(match)

    assert risk_event is not None
    assert risk_event.source_module == RiskEvent.SourceModule.THREATBOARD
    assert EvidenceItem.objects.filter(risk_event=risk_event).count() == 1
    assert ActionRecommendation.objects.filter(risk_event=risk_event).count() == 5


@pytest.mark.django_db
def test_risk_event_generation_is_idempotent(organisation):
    asset = make_asset(organisation, criticality=Asset.Criticality.CRITICAL)
    vulnerability = make_vulnerability()
    VulnerabilityScore.objects.create(vulnerability=vulnerability, kev_known_exploited=True)
    match_vulnerabilities_to_assets(organisation=organisation)
    match = AssetVulnerabilityMatch.objects.get(asset=asset, vulnerability=vulnerability)

    create_or_update_risk_event_for_match(match)
    create_or_update_risk_event_for_match(match)

    assert RiskEvent.objects.filter(source_module=RiskEvent.SourceModule.THREATBOARD).count() == 1
    risk_event = RiskEvent.objects.get(source_module=RiskEvent.SourceModule.THREATBOARD)
    assert EvidenceItem.objects.filter(risk_event=risk_event).count() == 1
    assert ActionRecommendation.objects.filter(risk_event=risk_event).count() == 5
