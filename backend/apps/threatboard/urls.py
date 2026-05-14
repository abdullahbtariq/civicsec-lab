from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.threatboard.views import (
    AssetVulnerabilityMatchViewSet,
    EnrichEpssView,
    IngestKevView,
    MatchAssetsView,
    ThreatBoardOverviewView,
    ThreatIngestionRunViewSet,
    VulnerabilityScoreViewSet,
    VulnerabilityViewSet,
)

router = DefaultRouter()
router.register("vulnerabilities", VulnerabilityViewSet, basename="threatboard-vulnerability")
router.register("scores", VulnerabilityScoreViewSet, basename="threatboard-score")
router.register("asset-matches", AssetVulnerabilityMatchViewSet, basename="threatboard-asset-match")
router.register("ingestion-runs", ThreatIngestionRunViewSet, basename="threatboard-ingestion-run")

urlpatterns = [
    path("overview/", ThreatBoardOverviewView.as_view(), name="threatboard-overview"),
    path("ingest-kev/", IngestKevView.as_view(), name="threatboard-ingest-kev"),
    path("enrich-epss/", EnrichEpssView.as_view(), name="threatboard-enrich-epss"),
    path("match-assets/", MatchAssetsView.as_view(), name="threatboard-match-assets"),
    path("", include(router.urls)),
]
