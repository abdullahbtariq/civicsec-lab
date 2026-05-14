"""URL configuration for CivicSec Lab."""

from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.accounts.views import CurrentUserView
from apps.assets.views import AssetViewSet
from apps.common.views import ProcessingJobViewSet
from apps.evidence.views import EvidenceItemViewSet
from apps.incidents.views import IncidentTimelineEntryViewSet, IncidentViewSet
from apps.organisations.views import OrganisationViewSet
from apps.risk.views import ActionRecommendationViewSet, RiskEventViewSet


def health_check(_request):
    return JsonResponse({"status": "ok", "service": "civicsec-backend"})


router = DefaultRouter()
router.register("organisations", OrganisationViewSet, basename="organisation")
router.register("assets", AssetViewSet, basename="asset")
router.register("risk-events", RiskEventViewSet, basename="risk-event")
router.register("evidence-items", EvidenceItemViewSet, basename="evidence-item")
router.register("recommendations", ActionRecommendationViewSet, basename="recommendation")
router.register("incidents", IncidentViewSet, basename="incident")
router.register("incident-timeline", IncidentTimelineEntryViewSet, basename="incident-timeline")
router.register("processing-jobs", ProcessingJobViewSet, basename="processing-job")

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/health/", health_check, name="health-check"),
    path("api/auth/me/", CurrentUserView.as_view(), name="auth-me"),
    path("api/", include(router.urls)),
]
