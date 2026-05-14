import pytest
from django.core.exceptions import ValidationError

from apps.accounts.models import User
from apps.assets.models import Asset
from apps.common.models import ProcessingJob
from apps.organisations.models import Organisation
from apps.risk.models import RiskEvent


@pytest.mark.django_db
def test_user_model_creation():
    organisation = Organisation.objects.create(name="Demo Org", slug="demo-org")

    user = User.objects.create_user(
        email="analyst@example.test",
        password="ChangeMe123!",
        full_name="Demo Analyst",
        organisation=organisation,
        role=User.Role.ANALYST,
    )

    assert user.email == "analyst@example.test"
    assert user.organisation == organisation
    assert user.is_analyst is True
    assert user.is_org_admin is False
    assert User.USERNAME_FIELD == "email"
    assert "username" not in {field.name for field in User._meta.fields}


@pytest.mark.django_db
def test_organisation_creation():
    organisation = Organisation.objects.create(
        name="Open Civic Aid",
        slug="open-civic-aid",
        sector="civic_technology",
        country="United Kingdom",
        risk_profile=Organisation.RiskProfile.ELEVATED,
    )

    assert str(organisation) == "Open Civic Aid"
    assert organisation.risk_profile == Organisation.RiskProfile.ELEVATED


@pytest.mark.django_db
def test_asset_belongs_to_organisation():
    organisation = Organisation.objects.create(name="Demo Org", slug="demo-org")
    asset = Asset.objects.create(
        organisation=organisation,
        name="Staff Portal",
        asset_type=Asset.AssetType.WEB_APP,
    )

    assert asset.organisation == organisation
    assert str(asset) == "Staff Portal"


@pytest.mark.django_db
@pytest.mark.parametrize("confidence", [-0.1, 1.1])
def test_risk_event_confidence_must_be_between_zero_and_one(confidence):
    organisation = Organisation.objects.create(name="Demo Org", slug="demo-org")
    risk_event = RiskEvent(
        organisation=organisation,
        source_module=RiskEvent.SourceModule.MANUAL,
        event_type="manual_review",
        title="Manual review",
        confidence=confidence,
        risk_score=50,
    )

    with pytest.raises(ValidationError):
        risk_event.full_clean()


@pytest.mark.django_db
@pytest.mark.parametrize("risk_score", [-1, 101])
def test_risk_event_score_must_be_between_zero_and_one_hundred(risk_score):
    organisation = Organisation.objects.create(name="Demo Org", slug="demo-org")
    risk_event = RiskEvent(
        organisation=organisation,
        source_module=RiskEvent.SourceModule.MANUAL,
        event_type="manual_review",
        title="Manual review",
        confidence=0.5,
        risk_score=risk_score,
    )

    with pytest.raises(ValidationError):
        risk_event.full_clean()


@pytest.mark.django_db
@pytest.mark.parametrize("progress", [-1, 101])
def test_processing_job_progress_must_be_between_zero_and_one_hundred(progress):
    job = ProcessingJob(job_type=ProcessingJob.JobType.DEMO_SEED, progress=progress)

    with pytest.raises(ValidationError):
        job.full_clean()
