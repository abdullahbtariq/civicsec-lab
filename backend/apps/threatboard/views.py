from django.db.models import Q
from django.http import Http404
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.common.viewsets import OrganisationScopedModelViewSet
from apps.organisations.models import Organisation
from apps.threatboard.models import (
    AssetVulnerabilityMatch,
    ThreatIngestionRun,
    Vulnerability,
    VulnerabilityScore,
)
from apps.threatboard.permissions import CanTriggerThreatboardRun
from apps.threatboard.serializers import (
    AssetVulnerabilityMatchSerializer,
    ThreatIngestionRunSerializer,
    VulnerabilityScoreSerializer,
    VulnerabilitySerializer,
)
from apps.threatboard.services.epss import enrich_vulnerabilities_with_epss
from apps.threatboard.services.kev import (
    ThreatBoardServiceError,
    fetch_kev_catalog,
    parse_kev_items,
    upsert_kev_vulnerabilities,
)
from apps.threatboard.services.matching import match_vulnerabilities_to_assets


class VulnerabilityViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = VulnerabilitySerializer
    permission_classes = [IsAuthenticated]
    queryset = Vulnerability.objects.select_related("score").all()

    def get_queryset(self):
        queryset = super().get_queryset()
        cve_id = self.request.query_params.get("cve_id")
        vendor = self.request.query_params.get("vendor")
        product = self.request.query_params.get("product")
        kev_only = self.request.query_params.get("kev_only")

        if cve_id:
            queryset = queryset.filter(cve_id__icontains=cve_id.strip())
        if vendor:
            queryset = queryset.filter(vendor__icontains=vendor.strip())
        if product:
            queryset = queryset.filter(product__icontains=product.strip())
        if _truthy(kev_only):
            queryset = queryset.filter(
                Q(source=Vulnerability.Source.CISA_KEV) | Q(score__kev_known_exploited=True)
            )
        return queryset


class VulnerabilityScoreViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = VulnerabilityScoreSerializer
    permission_classes = [IsAuthenticated]
    queryset = VulnerabilityScore.objects.select_related("vulnerability").all()

    def get_queryset(self):
        queryset = super().get_queryset()
        cve_id = self.request.query_params.get("cve_id")
        if cve_id:
            queryset = queryset.filter(vulnerability__cve_id__icontains=cve_id.strip())
        return queryset


class AssetVulnerabilityMatchViewSet(OrganisationScopedModelViewSet):
    serializer_class = AssetVulnerabilityMatchSerializer
    queryset = AssetVulnerabilityMatch.objects.select_related(
        "organisation",
        "asset",
        "vulnerability",
        "vulnerability__score",
    ).all()

    def get_queryset(self):
        queryset = super().get_queryset()
        risk_band = self.request.query_params.get("risk_band")
        remediation_status = self.request.query_params.get("remediation_status")
        asset = self.request.query_params.get("asset")
        internet_exposed = self.request.query_params.get("internet_exposed")

        if risk_band:
            queryset = queryset.filter(risk_band=risk_band)
        if remediation_status:
            queryset = queryset.filter(remediation_status=remediation_status)
        if asset:
            queryset = queryset.filter(asset_id=asset)
        if internet_exposed is not None:
            queryset = queryset.filter(asset__internet_exposed=_truthy(internet_exposed))
        return queryset

    def perform_create(self, serializer):
        asset = serializer.validated_data["asset"]
        vulnerability = serializer.validated_data["vulnerability"]
        confidence = serializer.validated_data.get("match_confidence", 0.0)
        from apps.threatboard.services.scoring import (
            calculate_exposure_score,
            calculate_threatboard_risk_score,
        )

        threat_score = calculate_threatboard_risk_score(asset, vulnerability, confidence)
        serializer.save(
            organisation=asset.organisation,
            exposure_score=calculate_exposure_score(asset),
            calculated_risk_score=threat_score.score,
            risk_band=threat_score.risk_band,
            explanation=threat_score.explanation,
            first_seen_at=timezone.now(),
            last_seen_at=timezone.now(),
        )

    def perform_update(self, serializer):
        match = serializer.save()
        from apps.threatboard.services.scoring import (
            calculate_exposure_score,
            calculate_threatboard_risk_score,
        )

        threat_score = calculate_threatboard_risk_score(
            match.asset,
            match.vulnerability,
            match.match_confidence,
        )
        match.exposure_score = calculate_exposure_score(match.asset)
        match.calculated_risk_score = threat_score.score
        match.risk_band = threat_score.risk_band
        match.explanation = threat_score.explanation
        match.last_seen_at = timezone.now()
        match.save(
            update_fields=[
                "exposure_score",
                "calculated_risk_score",
                "risk_band",
                "explanation",
                "last_seen_at",
                "updated_at",
            ]
        )


class ThreatIngestionRunViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ThreatIngestionRunSerializer
    permission_classes = [IsAuthenticated]
    queryset = ThreatIngestionRun.objects.select_related("organisation").all()

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        if user.is_superuser:
            return queryset
        if not user.organisation_id:
            return queryset.filter(organisation__isnull=True)
        return queryset.filter(
            Q(organisation_id=user.organisation_id) | Q(organisation__isnull=True)
        )


class ThreatBoardOverviewView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        match_queryset = AssetVulnerabilityMatch.objects.select_related(
            "organisation",
            "asset",
            "vulnerability",
            "vulnerability__score",
        )
        run_queryset = ThreatIngestionRun.objects.select_related("organisation")

        if not request.user.is_superuser:
            if not request.user.organisation_id:
                match_queryset = match_queryset.none()
                run_queryset = run_queryset.filter(organisation__isnull=True)
            else:
                match_queryset = match_queryset.filter(organisation_id=request.user.organisation_id)
                run_queryset = run_queryset.filter(
                    Q(organisation_id=request.user.organisation_id) | Q(organisation__isnull=True)
                )

        overdue_matches = match_queryset.filter(
            vulnerability__due_date__lt=timezone.localdate(),
        ).exclude(
            remediation_status__in=[
                AssetVulnerabilityMatch.RemediationStatus.NOT_AFFECTED,
                AssetVulnerabilityMatch.RemediationStatus.PATCHED,
                AssetVulnerabilityMatch.RemediationStatus.MITIGATED,
                AssetVulnerabilityMatch.RemediationStatus.ACCEPTED_RISK,
            ]
        )

        latest_matches = match_queryset.order_by("-updated_at")[:5]
        latest_runs = run_queryset.order_by("-created_at")[:5]

        return Response(
            {
                "vulnerability_count": Vulnerability.objects.count(),
                "kev_vulnerability_count": Vulnerability.objects.filter(
                    Q(source=Vulnerability.Source.CISA_KEV) | Q(score__kev_known_exploited=True)
                ).count(),
                "asset_match_count": match_queryset.count(),
                "critical_match_count": match_queryset.filter(
                    risk_band=AssetVulnerabilityMatch.RiskBand.CRITICAL
                ).count(),
                "high_match_count": match_queryset.filter(
                    risk_band=AssetVulnerabilityMatch.RiskBand.HIGH
                ).count(),
                "overdue_match_count": overdue_matches.count(),
                "latest_matches": AssetVulnerabilityMatchSerializer(
                    latest_matches,
                    many=True,
                    context={"request": request},
                ).data,
                "latest_ingestion_runs": ThreatIngestionRunSerializer(latest_runs, many=True).data,
            }
        )


class IngestKevView(APIView):
    permission_classes = [CanTriggerThreatboardRun]

    def post(self, request):
        run = ThreatIngestionRun.objects.create(
            run_type=ThreatIngestionRun.RunType.KEV_INGESTION,
            status=ThreatIngestionRun.Status.RUNNING,
            source=ThreatIngestionRun.Source.CISA_KEV,
        )
        try:
            payload = fetch_kev_catalog()
            parse_kev_items(payload)
            items = payload["vulnerabilities"]
            summary = upsert_kev_vulnerabilities(items, run=run)
            run.status = _status_from_summary(summary)
            run.finished_at = timezone.now()
            run.save(update_fields=["status", "finished_at", "updated_at"])
        except ThreatBoardServiceError as exc:
            run.status = ThreatIngestionRun.Status.FAILED
            run.error_message = str(exc)
            run.finished_at = timezone.now()
            run.save(update_fields=["status", "error_message", "finished_at", "updated_at"])
            return Response({"detail": str(exc)}, status=status.HTTP_502_BAD_GATEWAY)

        response_data = {"ingestion_run": ThreatIngestionRunSerializer(run).data}

        if _truthy(request.data.get("enrich_epss") or request.query_params.get("enrich_epss")):
            try:
                response_data["epss_summary"] = _run_epss_enrichment()
            except ThreatBoardServiceError as exc:
                response_data["epss_error"] = str(exc)
        if _truthy(request.data.get("match_assets") or request.query_params.get("match_assets")):
            response_data["matching_summary"] = _run_asset_matching_for_request(request)

        return Response(response_data, status=status.HTTP_202_ACCEPTED)


class EnrichEpssView(APIView):
    permission_classes = [CanTriggerThreatboardRun]

    def post(self, request):
        cve_id = request.data.get("cve")
        cve_ids = request.data.get("cve_ids")
        limit = int(request.data.get("limit") or 100)

        if cve_id:
            selected_cves = [cve_id]
        elif isinstance(cve_ids, list) and cve_ids:
            selected_cves = cve_ids
        else:
            selected_cves = list(Vulnerability.objects.values_list("cve_id", flat=True)[:limit])

        run = ThreatIngestionRun.objects.create(
            run_type=ThreatIngestionRun.RunType.EPSS_ENRICHMENT,
            status=ThreatIngestionRun.Status.RUNNING,
            source=ThreatIngestionRun.Source.FIRST_EPSS,
        )
        try:
            summary = enrich_vulnerabilities_with_epss(selected_cves, run=run)
            run.status = _status_from_summary(summary)
            run.finished_at = timezone.now()
            run.save(update_fields=["status", "finished_at", "updated_at"])
        except ThreatBoardServiceError as exc:
            run.status = ThreatIngestionRun.Status.FAILED
            run.error_message = str(exc)
            run.finished_at = timezone.now()
            run.save(update_fields=["status", "error_message", "finished_at", "updated_at"])
            return Response({"detail": str(exc)}, status=status.HTTP_502_BAD_GATEWAY)

        return Response({"ingestion_run": ThreatIngestionRunSerializer(run).data}, status=202)


class MatchAssetsView(APIView):
    permission_classes = [CanTriggerThreatboardRun]

    def post(self, request):
        organisation = _organisation_for_request(request)
        if not request.user.is_superuser and organisation is None:
            return Response(
                {"detail": "Your account is not assigned to an organisation."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        run = ThreatIngestionRun.objects.create(
            organisation=organisation,
            run_type=ThreatIngestionRun.RunType.ASSET_MATCHING,
            status=ThreatIngestionRun.Status.RUNNING,
            source=ThreatIngestionRun.Source.INTERNAL,
        )
        summary = match_vulnerabilities_to_assets(
            organisation=organisation,
            run=run,
            create_risk_events=_truthy(request.data.get("create_risk_events")),
        )
        run.status = _status_from_summary(summary)
        run.finished_at = timezone.now()
        run.save(update_fields=["status", "finished_at", "updated_at"])
        return Response(
            {
                "ingestion_run": ThreatIngestionRunSerializer(run).data,
                "summary": summary,
            },
            status=202,
        )


def _organisation_for_request(request) -> Organisation | None:
    if not request.user.is_superuser:
        return request.user.organisation
    slug = request.data.get("organisation_slug") or request.query_params.get("organisation_slug")
    if slug:
        try:
            return Organisation.objects.get(slug=slug)
        except Organisation.DoesNotExist as exc:
            raise Http404("Organisation not found.") from exc
    return None


def _run_epss_enrichment() -> dict[str, int]:
    run = ThreatIngestionRun.objects.create(
        run_type=ThreatIngestionRun.RunType.EPSS_ENRICHMENT,
        status=ThreatIngestionRun.Status.RUNNING,
        source=ThreatIngestionRun.Source.FIRST_EPSS,
    )
    summary = enrich_vulnerabilities_with_epss(run=run)
    run.status = _status_from_summary(summary)
    run.finished_at = timezone.now()
    run.save(update_fields=["status", "finished_at", "updated_at"])
    return summary


def _run_asset_matching_for_request(request) -> dict[str, int]:
    organisation = _organisation_for_request(request)
    if not request.user.is_superuser and organisation is None:
        return {
            "assets_seen": 0,
            "matches_created": 0,
            "matches_updated": 0,
            "risk_events_created_or_updated": 0,
        }
    run = ThreatIngestionRun.objects.create(
        organisation=organisation,
        run_type=ThreatIngestionRun.RunType.ASSET_MATCHING,
        status=ThreatIngestionRun.Status.RUNNING,
        source=ThreatIngestionRun.Source.INTERNAL,
    )
    summary = match_vulnerabilities_to_assets(
        organisation=organisation,
        run=run,
        create_risk_events=True,
    )
    run.status = _status_from_summary(summary)
    run.finished_at = timezone.now()
    run.save(update_fields=["status", "finished_at", "updated_at"])
    return summary


def _truthy(value) -> bool:
    return str(value).strip().lower() in {"1", "true", "yes", "on"}


def _status_from_summary(summary: dict[str, int]) -> str:
    return (
        ThreatIngestionRun.Status.COMPLETED_WITH_ERRORS
        if summary.get("failed", 0) or summary.get("records_failed", 0)
        else ThreatIngestionRun.Status.COMPLETED
    )
