from django.db.models import Avg, Count
from rest_framework import status
from rest_framework.parsers import MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.common.permissions import IsOrganisationScopedRole
from apps.common.viewsets import OrganisationScopedModelViewSet
from apps.loglens.models import LoginAnomaly, LoginEvent
from apps.loglens.serializers import (
    LoginAnomalySerializer,
    LoginAnomalyStatusUpdateSerializer,
    LoginEventSerializer,
)
from apps.loglens.services.csv_upload import CSVUploadError, parse_and_save_csv
from apps.loglens.services.detection import run_detection
from apps.loglens.services.risk_events import generate_risk_events_for_organisation
from apps.loglens.services.synthetic import generate_synthetic_logs


class LogLensOverviewView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if not user.organisation_id:
            return Response({"detail": "No organisation assigned."}, status=400)

        org_id = user.organisation_id

        total_events = LoginEvent.objects.filter(organisation_id=org_id).count()
        total_anomalies = LoginAnomaly.objects.filter(organisation_id=org_id).count()
        open_anomalies = LoginAnomaly.objects.filter(
            organisation_id=org_id,
            status=LoginAnomaly.Status.NEW,
        ).count()
        high_risk = LoginAnomaly.objects.filter(
            organisation_id=org_id,
            severity__in=[LoginAnomaly.Severity.HIGH, LoginAnomaly.Severity.CRITICAL],
            status=LoginAnomaly.Status.NEW,
        ).count()
        impossible_travel = LoginAnomaly.objects.filter(
            organisation_id=org_id,
            anomaly_type=LoginAnomaly.AnomalyType.IMPOSSIBLE_TRAVEL,
            status=LoginAnomaly.Status.NEW,
        ).count()
        failed_bursts = LoginAnomaly.objects.filter(
            organisation_id=org_id,
            anomaly_type=LoginAnomaly.AnomalyType.FAILED_LOGIN_BURST,
            status=LoginAnomaly.Status.NEW,
        ).count()
        sensitive_access = LoginAnomaly.objects.filter(
            organisation_id=org_id,
            anomaly_type=LoginAnomaly.AnomalyType.SENSITIVE_ACCESS_AFTER_ANOMALY,
            status=LoginAnomaly.Status.NEW,
        ).count()

        # Anomalies by type
        by_type = (
            LoginAnomaly.objects.filter(organisation_id=org_id)
            .values("anomaly_type")
            .annotate(count=Count("id"))
            .order_by("-count")
        )

        # Top affected users
        top_users = (
            LoginAnomaly.objects.filter(organisation_id=org_id, status=LoginAnomaly.Status.NEW)
            .values("user_identifier")
            .annotate(anomaly_count=Count("id"), max_risk=Avg("risk_score"))
            .order_by("-anomaly_count")[:5]
        )

        # Latest anomalies
        latest = LoginAnomaly.objects.filter(organisation_id=org_id).order_by("-created_at")[:5]

        return Response(
            {
                "total_events": total_events,
                "total_anomalies": total_anomalies,
                "open_anomalies": open_anomalies,
                "high_risk_count": high_risk,
                "impossible_travel_count": impossible_travel,
                "failed_burst_count": failed_bursts,
                "sensitive_access_count": sensitive_access,
                "anomalies_by_type": list(by_type),
                "top_affected_users": list(top_users),
                "latest_anomalies": LoginAnomalySerializer(latest, many=True).data,
            }
        )


class LoginEventViewSet(OrganisationScopedModelViewSet):
    serializer_class = LoginEventSerializer
    queryset = LoginEvent.objects.all()
    http_method_names = ["get", "head", "options"]  # read-only; writes via upload endpoint

    def get_queryset(self):
        qs = super().get_queryset()
        user_id = self.request.query_params.get("user_identifier")
        batch = self.request.query_params.get("batch")
        event_type = self.request.query_params.get("event_type")
        success = self.request.query_params.get("success")
        if user_id:
            qs = qs.filter(user_identifier__icontains=user_id)
        if batch:
            qs = qs.filter(upload_batch=batch)
        if event_type:
            qs = qs.filter(event_type=event_type)
        if success is not None:
            qs = qs.filter(success=success.lower() in {"true", "1"})
        return qs


class LoginAnomalyViewSet(OrganisationScopedModelViewSet):
    serializer_class = LoginAnomalySerializer
    queryset = LoginAnomaly.objects.prefetch_related("linked_events").all()
    http_method_names = ["get", "patch", "head", "options"]

    def get_queryset(self):
        qs = super().get_queryset()
        anomaly_type = self.request.query_params.get("anomaly_type")
        severity = self.request.query_params.get("severity")
        status_filter = self.request.query_params.get("status")
        user_id = self.request.query_params.get("user_identifier")
        if anomaly_type:
            qs = qs.filter(anomaly_type=anomaly_type)
        if severity:
            qs = qs.filter(severity=severity)
        if status_filter:
            qs = qs.filter(status=status_filter)
        if user_id:
            qs = qs.filter(user_identifier__icontains=user_id)
        return qs

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = LoginAnomalyStatusUpdateSerializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(LoginAnomalySerializer(instance).data)


class UploadLoginLogsView(APIView):
    permission_classes = [IsOrganisationScopedRole]
    parser_classes = [MultiPartParser]

    def post(self, request):
        user = request.user
        if not user.organisation_id:
            return Response({"detail": "No organisation assigned."}, status=400)
        if user.role not in {"admin", "analyst"}:
            return Response({"detail": "Only admins and analysts can upload logs."}, status=403)

        file_obj = request.FILES.get("file")
        if not file_obj:
            return Response({"detail": "No file provided. Use field name 'file'."}, status=400)

        filename = file_obj.name or "upload.csv"
        if not filename.lower().endswith(".csv"):
            return Response({"detail": "Only .csv files are accepted."}, status=400)

        try:
            result = parse_and_save_csv(
                organisation=user.organisation,
                file_obj=file_obj,
                filename=filename,
                file_size=file_obj.size,
            )
        except CSVUploadError as exc:
            return Response({"detail": str(exc)}, status=400)

        return Response(result, status=status.HTTP_201_CREATED)


class GenerateSyntheticLogsView(APIView):
    permission_classes = [IsOrganisationScopedRole]

    def post(self, request):
        user = request.user
        if not user.organisation_id:
            return Response({"detail": "No organisation assigned."}, status=400)
        if user.role not in {"admin", "analyst"}:
            return Response(
                {"detail": "Only admins and analysts can generate synthetic logs."}, status=403
            )

        days_back = int(request.data.get("days_back", 7))
        clear_existing = bool(request.data.get("clear_existing", False))

        result = generate_synthetic_logs(
            organisation=user.organisation,
            days_back=min(days_back, 30),
            clear_existing=clear_existing,
        )
        return Response(result, status=status.HTTP_201_CREATED)


class RunDetectionView(APIView):
    permission_classes = [IsOrganisationScopedRole]

    def post(self, request):
        user = request.user
        if not user.organisation_id:
            return Response({"detail": "No organisation assigned."}, status=400)
        if user.role not in {"admin", "analyst"}:
            return Response({"detail": "Only admins and analysts can run detection."}, status=403)

        detection_result = run_detection(organisation=user.organisation)
        risk_event_result = generate_risk_events_for_organisation(organisation=user.organisation)

        return Response(
            {
                "detection": detection_result,
                "risk_events": risk_event_result,
            }
        )
