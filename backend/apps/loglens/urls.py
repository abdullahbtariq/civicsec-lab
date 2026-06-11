from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.loglens.views import (
    GenerateSyntheticLogsView,
    LoginAnomalyViewSet,
    LoginEventViewSet,
    LogLensOverviewView,
    RunDetectionView,
    UploadLoginLogsView,
)

router = DefaultRouter()
router.register("events", LoginEventViewSet, basename="loglens-event")
router.register("anomalies", LoginAnomalyViewSet, basename="loglens-anomaly")

urlpatterns = [
    path("overview/", LogLensOverviewView.as_view(), name="loglens-overview"),
    path("upload-logs/", UploadLoginLogsView.as_view(), name="loglens-upload"),
    path(
        "generate-synthetic-logs/",
        GenerateSyntheticLogsView.as_view(),
        name="loglens-generate-synthetic",
    ),
    path("run-detection/", RunDetectionView.as_view(), name="loglens-run-detection"),
    path("", include(router.urls)),
]
