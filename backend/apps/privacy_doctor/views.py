"""DataPrivacy Doctor views."""

import os
import tempfile

from django.http import HttpResponse
from rest_framework import status
from rest_framework.parsers import MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.common.permissions import IsOrganisationScopedRole
from apps.privacy_doctor.models import UploadedDataset
from apps.privacy_doctor.serializers import (
    DatasetColumnProfileSerializer,
    PrivacyFindingSerializer,
    UploadedDatasetSerializer,
)
from apps.privacy_doctor.services.profiler import scan_dataset
from apps.privacy_doctor.services.report import generate_markdown_report
from apps.privacy_doctor.services.risk_events import generate_risk_event_for_dataset
from apps.privacy_doctor.services.synthetic import generate_synthetic_volunteer_csv

MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB
MAX_ROWS = 50_000
ALLOWED_EXTENSIONS = {".csv"}


class PrivacyDoctorOverviewView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        org = request.user.organisation
        datasets = UploadedDataset.objects.filter(organisation=org)
        total = datasets.count()
        complete = datasets.filter(processing_status="complete").count()
        high_risk = datasets.filter(risk_band__in=["high", "severe"]).count()
        severe = datasets.filter(risk_band="severe").count()
        recent = datasets.filter(processing_status="complete").order_by("-uploaded_at")[:5]

        return Response(
            {
                "total_datasets": total,
                "complete_datasets": complete,
                "high_risk_datasets": high_risk,
                "severe_risk_datasets": severe,
                "datasets_with_identifiers": datasets.filter(
                    column_profiles__privacy_category="direct_identifier"
                )
                .distinct()
                .count(),
                "datasets_with_sensitive": datasets.filter(
                    column_profiles__privacy_category="sensitive_attribute"
                )
                .distinct()
                .count(),
                "recent_datasets": UploadedDatasetSerializer(recent, many=True).data,
            }
        )


class UploadDatasetView(APIView):
    parser_classes = [MultiPartParser]
    permission_classes = [IsOrganisationScopedRole]

    def post(self, request: Request) -> Response:
        if request.user.role not in {"admin", "analyst"}:
            return Response(status=status.HTTP_403_FORBIDDEN)
        file_obj = request.FILES.get("file")
        if not file_obj:
            return Response({"error": "No file provided."}, status=status.HTTP_400_BAD_REQUEST)

        filename = getattr(file_obj, "name", "upload.csv")
        _, ext = os.path.splitext(filename.lower())
        if ext not in ALLOWED_EXTENSIONS:
            return Response(
                {"error": "Only .csv files are accepted."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        file_size = file_obj.size
        if file_size > MAX_FILE_SIZE_BYTES:
            return Response(
                {"error": f"File exceeds the {MAX_FILE_SIZE_BYTES // (1024 * 1024)} MB limit."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        retention_policy = request.data.get(
            "retention_policy", UploadedDataset.RetentionPolicy.DELETE_AFTER_PROCESSING
        )

        csv_bytes = file_obj.read()

        dataset = UploadedDataset.objects.create(
            organisation=request.user.organisation,
            uploaded_by=request.user,
            original_filename=filename,
            file_size=file_size,
            retention_policy=retention_policy,
        )

        # Save file temporarily for retain policies; we pass bytes directly for scanning
        if retention_policy != UploadedDataset.RetentionPolicy.DELETE_AFTER_PROCESSING:
            tmp = tempfile.NamedTemporaryFile(
                delete=False, suffix=".csv", prefix=f"dpd_{dataset.id}_"
            )
            tmp.write(csv_bytes)
            tmp.close()
            dataset.stored_file_path = tmp.name
            dataset.save(update_fields=["stored_file_path"])

        try:
            summary = scan_dataset(dataset, csv_bytes)
        except ValueError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        risk_result = generate_risk_event_for_dataset(dataset)

        return Response(
            {
                "dataset_id": dataset.id,
                "original_filename": dataset.original_filename,
                **summary,
                "risk_event": risk_result,
            },
            status=status.HTTP_201_CREATED,
        )


class DatasetListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        qs = UploadedDataset.objects.filter(organisation=request.user.organisation)
        return Response(UploadedDatasetSerializer(qs, many=True).data)


class DatasetDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def _get_dataset(self, request, dataset_id):
        try:
            return UploadedDataset.objects.get(
                id=dataset_id, organisation=request.user.organisation
            )
        except UploadedDataset.DoesNotExist:
            return None

    def get(self, request: Request, dataset_id: int) -> Response:
        dataset = self._get_dataset(request, dataset_id)
        if not dataset:
            return Response(status=status.HTTP_404_NOT_FOUND)
        return Response(UploadedDatasetSerializer(dataset).data)


class DatasetColumnProfilesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Request, dataset_id: int) -> Response:
        try:
            dataset = UploadedDataset.objects.get(
                id=dataset_id, organisation=request.user.organisation
            )
        except UploadedDataset.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        profiles = dataset.column_profiles.order_by("-risk_score")
        return Response(DatasetColumnProfileSerializer(profiles, many=True).data)


class DatasetFindingsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Request, dataset_id: int) -> Response:
        try:
            dataset = UploadedDataset.objects.get(
                id=dataset_id, organisation=request.user.organisation
            )
        except UploadedDataset.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
        findings = dataset.findings.order_by("-severity")
        return Response(PrivacyFindingSerializer(findings, many=True).data)


class DeleteOriginalFileView(APIView):
    permission_classes = [IsOrganisationScopedRole]

    def post(self, request: Request, dataset_id: int) -> Response:
        if request.user.role not in {"admin", "analyst"}:
            return Response(status=status.HTTP_403_FORBIDDEN)
        try:
            dataset = UploadedDataset.objects.get(
                id=dataset_id, organisation=request.user.organisation
            )
        except UploadedDataset.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

        if dataset.original_file_deleted:
            return Response({"message": "Original file already deleted."})

        if dataset.stored_file_path and os.path.exists(dataset.stored_file_path):
            try:
                os.remove(dataset.stored_file_path)
            except OSError:
                pass

        dataset.original_file_deleted = True
        dataset.stored_file_path = ""
        dataset.save(update_fields=["original_file_deleted", "stored_file_path"])

        return Response({"message": "Original file deleted.", "dataset_id": dataset_id})


class DatasetReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Request, dataset_id: int) -> Response:
        try:
            dataset = UploadedDataset.objects.get(
                id=dataset_id, organisation=request.user.organisation
            )
        except UploadedDataset.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

        if dataset.processing_status != UploadedDataset.ProcessingStatus.COMPLETE:
            return Response(
                {"error": "Dataset scan is not complete yet."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        fmt = request.query_params.get("format", "json")
        report_md = generate_markdown_report(dataset)

        if fmt == "markdown":
            return HttpResponse(
                report_md,
                content_type="text/markdown; charset=utf-8",
                headers={
                    "Content-Disposition": (
                        f'attachment; filename="privacy-report-{dataset.id}.md"'
                    )
                },
            )

        return Response({"report_markdown": report_md, "dataset_id": dataset_id})


class GenerateSyntheticDatasetView(APIView):
    permission_classes = [IsOrganisationScopedRole]

    def post(self, request: Request) -> Response:
        if request.user.role not in {"admin", "analyst"}:
            return Response(status=status.HTTP_403_FORBIDDEN)
        num_rows = min(int(request.data.get("num_rows", 60)), 500)
        csv_bytes = generate_synthetic_volunteer_csv(num_rows=num_rows)

        dataset = UploadedDataset.objects.create(
            organisation=request.user.organisation,
            uploaded_by=request.user,
            original_filename="synthetic_volunteers.csv",
            file_size=len(csv_bytes),
            retention_policy=UploadedDataset.RetentionPolicy.RETAIN_FOR_DEMO,
        )

        summary = scan_dataset(dataset, csv_bytes)
        risk_result = generate_risk_event_for_dataset(dataset)

        return Response(
            {"dataset_id": dataset.id, **summary, "risk_event": risk_result},
            status=status.HTTP_201_CREATED,
        )
