from django.utils import timezone
from rest_framework import status
from rest_framework.parsers import MultiPartParser
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.common.permissions import IsOrganisationScopedRole
from apps.misinformation.models import (
    DiscourseDataset,
    EntityMention,
    KeywordBurst,
    NarrativeCluster,
)
from apps.misinformation.serializers import (
    DiscourseDatasetSerializer,
    EntityMentionSerializer,
    KeywordBurstSerializer,
    NarrativeClusterDetailSerializer,
    NarrativeClusterListSerializer,
    PublicPostSerializer,
)
from apps.misinformation.services.csv_ingest import ingest_csv
from apps.misinformation.services.pipeline import process_dataset


class ObservatoryOverviewView(APIView):
    permission_classes = [IsOrganisationScopedRole]

    def get(self, request: Request) -> Response:
        org = request.user.organisation
        datasets = DiscourseDataset.objects.filter(organisation=org)
        clusters = NarrativeCluster.objects.filter(dataset__organisation=org)
        bursts = KeywordBurst.objects.filter(dataset__organisation=org)

        return Response(
            {
                "total_datasets": datasets.count(),
                "total_posts": sum(d.row_count for d in datasets),
                "total_clusters": clusters.count(),
                "needs_review": clusters.filter(
                    status=NarrativeCluster.ClusterStatus.NEEDS_REVIEW
                ).count(),
                "escalated": clusters.filter(
                    status=NarrativeCluster.ClusterStatus.ESCALATED
                ).count(),
                "total_keyword_bursts": bursts.count(),
                "recent_datasets": DiscourseDatasetSerializer(datasets[:5], many=True).data,
                "recent_clusters_needing_review": NarrativeClusterListSerializer(
                    clusters.filter(status=NarrativeCluster.ClusterStatus.NEEDS_REVIEW)[:5],
                    many=True,
                ).data,
            }
        )


class DiscourseDatasetListView(APIView):
    permission_classes = [IsOrganisationScopedRole]
    parser_classes = [MultiPartParser]

    def get(self, request: Request) -> Response:
        qs = DiscourseDataset.objects.filter(organisation=request.user.organisation)
        status_filter = request.query_params.get("processing_status")
        if status_filter:
            qs = qs.filter(processing_status=status_filter)
        return Response(DiscourseDatasetSerializer(qs, many=True).data)

    def post(self, request: Request) -> Response:
        if request.user.role not in {"admin", "analyst"}:
            return Response({"detail": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)

        file = request.FILES.get("file")
        if not file:
            return Response({"detail": "No file uploaded."}, status=status.HTTP_400_BAD_REQUEST)
        if not file.name.lower().endswith(".csv"):
            return Response(
                {"detail": "Only CSV files are accepted."}, status=status.HTTP_400_BAD_REQUEST
            )
        if file.size > 10 * 1024 * 1024:
            return Response(
                {"detail": "File exceeds 10 MB limit."}, status=status.HTTP_400_BAD_REQUEST
            )

        dataset = DiscourseDataset.objects.create(
            organisation=request.user.organisation,
            uploaded_by=request.user,
            original_filename=file.name[:255],
            description=request.data.get("description", ""),
            retention_policy=request.data.get(
                "retention_policy", DiscourseDataset.RetentionPolicy.MEDIUM
            ),
        )

        file_bytes = file.read()
        ingest_csv(dataset, file_bytes)

        # Process synchronously for MVP (no Celery task queue required)
        process_dataset(dataset.id)
        dataset.refresh_from_db()

        return Response(DiscourseDatasetSerializer(dataset).data, status=status.HTTP_201_CREATED)


class DiscourseDatasetDetailView(APIView):
    permission_classes = [IsOrganisationScopedRole]

    def _get_dataset(self, request: Request, dataset_id: int):
        try:
            return DiscourseDataset.objects.get(
                pk=dataset_id, organisation=request.user.organisation
            )
        except DiscourseDataset.DoesNotExist:
            return None

    def get(self, request: Request, dataset_id: int) -> Response:
        dataset = self._get_dataset(request, dataset_id)
        if not dataset:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(DiscourseDatasetSerializer(dataset).data)

    def delete(self, request: Request, dataset_id: int) -> Response:
        if request.user.role not in {"admin", "analyst"}:
            return Response({"detail": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)
        dataset = self._get_dataset(request, dataset_id)
        if not dataset:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        dataset.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class DatasetProcessView(APIView):
    permission_classes = [IsOrganisationScopedRole]

    def post(self, request: Request, dataset_id: int) -> Response:
        if request.user.role not in {"admin", "analyst"}:
            return Response({"detail": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)
        try:
            dataset = DiscourseDataset.objects.get(
                pk=dataset_id, organisation=request.user.organisation
            )
        except DiscourseDataset.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        # Clear existing analysis before re-processing
        dataset.clusters.all().delete()
        dataset.keyword_bursts.all().delete()
        dataset.entity_mentions.all().delete()

        process_dataset(dataset.id)
        dataset.refresh_from_db()
        return Response(DiscourseDatasetSerializer(dataset).data)


class NarrativeClusterListView(APIView):
    permission_classes = [IsOrganisationScopedRole]

    def get(self, request: Request) -> Response:
        qs = NarrativeCluster.objects.filter(dataset__organisation=request.user.organisation)
        dataset_id = request.query_params.get("dataset")
        if dataset_id:
            qs = qs.filter(dataset_id=dataset_id)
        cluster_status = request.query_params.get("status")
        if cluster_status:
            qs = qs.filter(status=cluster_status)
        return Response(NarrativeClusterListSerializer(qs, many=True).data)


class NarrativeClusterDetailView(APIView):
    permission_classes = [IsOrganisationScopedRole]

    def _get_cluster(self, request: Request, cluster_id: int):
        try:
            return NarrativeCluster.objects.get(
                pk=cluster_id, dataset__organisation=request.user.organisation
            )
        except NarrativeCluster.DoesNotExist:
            return None

    def get(self, request: Request, cluster_id: int) -> Response:
        cluster = self._get_cluster(request, cluster_id)
        if not cluster:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(NarrativeClusterDetailSerializer(cluster).data)


class ClusterReviewView(APIView):
    permission_classes = [IsOrganisationScopedRole]

    def patch(self, request: Request, cluster_id: int) -> Response:
        if request.user.role not in {"admin", "analyst"}:
            return Response({"detail": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)
        try:
            cluster = NarrativeCluster.objects.get(
                pk=cluster_id, dataset__organisation=request.user.organisation
            )
        except NarrativeCluster.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        allowed_statuses = {
            NarrativeCluster.ClusterStatus.REVIEWED_BENIGN,
            NarrativeCluster.ClusterStatus.REVIEWED_CONCERNING,
            NarrativeCluster.ClusterStatus.ESCALATED,
            NarrativeCluster.ClusterStatus.NEEDS_REVIEW,
            NarrativeCluster.ClusterStatus.UNREVIEWED,
        }
        new_status = request.data.get("status")
        if new_status and new_status not in allowed_statuses:
            return Response(
                {"detail": f"Invalid status: {new_status}"}, status=status.HTTP_400_BAD_REQUEST
            )

        if new_status:
            cluster.status = new_status
        if "review_notes" in request.data:
            cluster.review_notes = request.data["review_notes"]

        cluster.reviewed_by = request.user
        cluster.reviewed_at = timezone.now()
        cluster.save(
            update_fields=["status", "review_notes", "reviewed_by", "reviewed_at", "updated_at"]
        )

        return Response(NarrativeClusterDetailSerializer(cluster).data)


class KeywordBurstListView(APIView):
    permission_classes = [IsOrganisationScopedRole]

    def get(self, request: Request, dataset_id: int | None = None) -> Response:
        qs = KeywordBurst.objects.filter(dataset__organisation=request.user.organisation)
        # dataset_id comes from URL kwargs (datasets/<id>/keyword-bursts/) or query param
        resolved_dataset_id = dataset_id or request.query_params.get("dataset")
        if resolved_dataset_id:
            qs = qs.filter(dataset_id=resolved_dataset_id)
        return Response(KeywordBurstSerializer(qs[:50], many=True).data)


class EntityMentionListView(APIView):
    permission_classes = [IsOrganisationScopedRole]

    def get(self, request: Request, dataset_id: int | None = None) -> Response:
        qs = EntityMention.objects.filter(dataset__organisation=request.user.organisation)
        # dataset_id comes from URL kwargs (datasets/<id>/entities/) or query param
        resolved_dataset_id = dataset_id or request.query_params.get("dataset")
        if resolved_dataset_id:
            qs = qs.filter(dataset_id=resolved_dataset_id)
        entity_type = request.query_params.get("entity_type")
        if entity_type:
            qs = qs.filter(entity_type=entity_type)
        return Response(EntityMentionSerializer(qs[:50], many=True).data)


class DatasetPostsView(APIView):
    permission_classes = [IsOrganisationScopedRole]

    def get(self, request: Request, dataset_id: int) -> Response:
        try:
            dataset = DiscourseDataset.objects.get(
                pk=dataset_id, organisation=request.user.organisation
            )
        except DiscourseDataset.DoesNotExist:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        qs = dataset.posts.all()

        # Optional cluster filter
        cluster_id = request.query_params.get("cluster", "").strip()
        if cluster_id:
            qs = qs.filter(cluster_id=cluster_id)

        # Optional full-text search across post text
        search = request.query_params.get("search", "").strip()
        if search:
            from django.db.models import Q

            qs = qs.filter(Q(text__icontains=search) | Q(author_identifier__icontains=search))

        # Optional platform filter
        platform = request.query_params.get("platform", "").strip()
        if platform:
            qs = qs.filter(platform__iexact=platform)

        total = qs.count()

        # Pagination
        try:
            limit = min(int(request.query_params.get("limit", 50)), 500)
            offset = max(int(request.query_params.get("offset", 0)), 0)
        except (ValueError, TypeError):
            limit, offset = 50, 0

        page_qs = qs[offset : offset + limit]
        return Response(
            {
                "count": total,
                "limit": limit,
                "offset": offset,
                "results": PublicPostSerializer(page_qs, many=True).data,
            }
        )
