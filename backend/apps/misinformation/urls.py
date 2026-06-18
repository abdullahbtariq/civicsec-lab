from django.urls import path

from apps.misinformation.views import (
    ClusterReviewView,
    DatasetPostsView,
    DatasetProcessView,
    DiscourseDatasetDetailView,
    DiscourseDatasetListView,
    EntityMentionListView,
    KeywordBurstListView,
    NarrativeClusterDetailView,
    NarrativeClusterListView,
    ObservatoryOverviewView,
)

urlpatterns = [
    path("overview/", ObservatoryOverviewView.as_view(), name="observatory-overview"),
    path("datasets/", DiscourseDatasetListView.as_view(), name="observatory-datasets"),
    path(
        "datasets/<int:dataset_id>/",
        DiscourseDatasetDetailView.as_view(),
        name="observatory-dataset-detail",
    ),
    path(
        "datasets/<int:dataset_id>/process/",
        DatasetProcessView.as_view(),
        name="observatory-dataset-process",
    ),
    path(
        "datasets/<int:dataset_id>/posts/",
        DatasetPostsView.as_view(),
        name="observatory-dataset-posts",
    ),
    path(
        "datasets/<int:dataset_id>/keyword-bursts/",
        KeywordBurstListView.as_view(),
        name="observatory-bursts-by-dataset",
    ),
    path(
        "datasets/<int:dataset_id>/entities/",
        EntityMentionListView.as_view(),
        name="observatory-entities-by-dataset",
    ),
    path("clusters/", NarrativeClusterListView.as_view(), name="observatory-clusters"),
    path(
        "clusters/<int:cluster_id>/",
        NarrativeClusterDetailView.as_view(),
        name="observatory-cluster-detail",
    ),
    path(
        "clusters/<int:cluster_id>/review/",
        ClusterReviewView.as_view(),
        name="observatory-cluster-review",
    ),
    path("keyword-bursts/", KeywordBurstListView.as_view(), name="observatory-bursts"),
    path("entities/", EntityMentionListView.as_view(), name="observatory-entities"),
]
