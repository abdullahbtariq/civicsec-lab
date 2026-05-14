import pytest
from django.urls import reverse
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.assets.models import Asset
from apps.organisations.models import Organisation


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


@pytest.mark.django_db
def test_auth_me_returns_current_user(api_client, organisation_a):
    user = make_user("analyst@example.test", organisation_a, User.Role.ANALYST)
    api_client.force_authenticate(user=user)

    response = api_client.get(reverse("auth-me"))

    assert response.status_code == 200
    assert response.data["email"] == "analyst@example.test"
    assert response.data["role"] == User.Role.ANALYST
    assert response.data["organisation"]["slug"] == "organisation-a"


@pytest.mark.django_db
def test_user_cannot_see_assets_from_other_organisation(api_client, organisation_a, organisation_b):
    user = make_user("analyst@example.test", organisation_a, User.Role.ANALYST)
    Asset.objects.create(organisation=organisation_a, name="A Staff Portal")
    Asset.objects.create(organisation=organisation_b, name="B Staff Portal")
    api_client.force_authenticate(user=user)

    response = api_client.get(reverse("asset-list"))

    assert response.status_code == 200
    assert [asset["name"] for asset in response.data] == ["A Staff Portal"]


@pytest.mark.django_db
def test_user_cannot_retrieve_asset_from_other_organisation(
    api_client,
    organisation_a,
    organisation_b,
):
    user = make_user("analyst@example.test", organisation_a, User.Role.ANALYST)
    other_asset = Asset.objects.create(organisation=organisation_b, name="B Staff Portal")
    api_client.force_authenticate(user=user)

    response = api_client.get(reverse("asset-detail", args=[other_asset.id]))

    assert response.status_code == 404


@pytest.mark.django_db
def test_viewer_cannot_create_asset(api_client, organisation_a):
    viewer = make_user("viewer@example.test", organisation_a, User.Role.VIEWER)
    api_client.force_authenticate(user=viewer)

    response = api_client.post(
        reverse("asset-list"),
        {"name": "Viewer Asset", "asset_type": Asset.AssetType.WEB_APP},
        format="json",
    )

    assert response.status_code == 403
    assert Asset.objects.filter(name="Viewer Asset").exists() is False


@pytest.mark.django_db
def test_analyst_can_create_asset(api_client, organisation_a):
    analyst = make_user("analyst@example.test", organisation_a, User.Role.ANALYST)
    api_client.force_authenticate(user=analyst)

    response = api_client.post(
        reverse("asset-list"),
        {
            "name": "Analyst Asset",
            "asset_type": Asset.AssetType.WEB_APP,
            "criticality": Asset.Criticality.HIGH,
        },
        format="json",
    )

    assert response.status_code == 201
    asset = Asset.objects.get(name="Analyst Asset")
    assert asset.organisation == organisation_a
    assert asset.created_by == analyst


@pytest.mark.django_db
def test_admin_can_delete_asset(api_client, organisation_a):
    admin = make_user("admin@example.test", organisation_a, User.Role.ADMIN)
    asset = Asset.objects.create(organisation=organisation_a, name="Delete Me")
    api_client.force_authenticate(user=admin)

    response = api_client.delete(reverse("asset-detail", args=[asset.id]))

    assert response.status_code == 204
    assert Asset.objects.filter(id=asset.id).exists() is False


@pytest.mark.django_db
def test_org_admin_cannot_create_new_organisation(api_client, organisation_a):
    admin = make_user("admin@example.test", organisation_a, User.Role.ADMIN)
    api_client.force_authenticate(user=admin)

    response = api_client.post(
        reverse("organisation-list"),
        {"name": "Another Org", "slug": "another-org"},
        format="json",
    )

    assert response.status_code == 403
    assert Organisation.objects.filter(slug="another-org").exists() is False
