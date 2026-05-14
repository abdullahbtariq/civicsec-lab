import pytest
from django.core.management import call_command

from apps.accounts.models import User
from apps.assets.models import Asset
from apps.evidence.models import EvidenceItem
from apps.incidents.models import Incident, IncidentTimelineEntry
from apps.organisations.models import Organisation
from apps.risk.models import ActionRecommendation, RiskEvent


@pytest.mark.django_db
def test_seed_demo_is_idempotent():
    call_command("seed_demo")
    call_command("seed_demo")

    organisation = Organisation.objects.get(slug="open-civic-aid")

    assert Organisation.objects.filter(slug="open-civic-aid").count() == 1
    assert User.objects.filter(organisation=organisation).count() == 3
    assert Asset.objects.filter(organisation=organisation).count() == 5
    assert RiskEvent.objects.filter(organisation=organisation).count() == 3
    assert EvidenceItem.objects.filter(organisation=organisation).count() == 3
    assert ActionRecommendation.objects.filter(organisation=organisation).count() == 3
    assert Incident.objects.filter(organisation=organisation).count() == 1
    assert IncidentTimelineEntry.objects.filter(organisation=organisation).count() == 2
