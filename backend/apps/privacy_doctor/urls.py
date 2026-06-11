"""DataPrivacy Doctor URL configuration."""

from django.urls import path

from apps.privacy_doctor import views

urlpatterns = [
    path("overview/", views.PrivacyDoctorOverviewView.as_view(), name="privacy-doctor-overview"),
    path("upload-dataset/", views.UploadDatasetView.as_view(), name="privacy-doctor-upload"),
    path("datasets/", views.DatasetListView.as_view(), name="privacy-doctor-dataset-list"),
    path(
        "datasets/<int:dataset_id>/",
        views.DatasetDetailView.as_view(),
        name="privacy-doctor-dataset-detail",
    ),
    path(
        "datasets/<int:dataset_id>/column-profiles/",
        views.DatasetColumnProfilesView.as_view(),
        name="privacy-doctor-column-profiles",
    ),
    path(
        "datasets/<int:dataset_id>/findings/",
        views.DatasetFindingsView.as_view(),
        name="privacy-doctor-findings",
    ),
    path(
        "datasets/<int:dataset_id>/delete-original/",
        views.DeleteOriginalFileView.as_view(),
        name="privacy-doctor-delete-original",
    ),
    path(
        "datasets/<int:dataset_id>/report/",
        views.DatasetReportView.as_view(),
        name="privacy-doctor-report",
    ),
    path(
        "generate-synthetic/",
        views.GenerateSyntheticDatasetView.as_view(),
        name="privacy-doctor-generate-synthetic",
    ),
]
