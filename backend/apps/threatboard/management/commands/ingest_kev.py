from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone

from apps.threatboard.models import ThreatIngestionRun
from apps.threatboard.services.epss import enrich_vulnerabilities_with_epss
from apps.threatboard.services.kev import (
    ThreatBoardServiceError,
    fetch_kev_catalog,
    parse_kev_items,
    upsert_kev_vulnerabilities,
)
from apps.threatboard.services.matching import match_vulnerabilities_to_assets


class Command(BaseCommand):
    help = "Fetch and ingest the public CISA KEV catalog."

    def add_arguments(self, parser):
        parser.add_argument("--match-assets", action="store_true")
        parser.add_argument("--enrich-epss", action="store_true")

    def handle(self, *args, **options):
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
        except ThreatBoardServiceError as exc:
            run.status = ThreatIngestionRun.Status.FAILED
            run.error_message = str(exc)
            run.finished_at = timezone.now()
            run.save(update_fields=["status", "error_message", "finished_at", "updated_at"])
            raise CommandError(str(exc)) from exc

        run.status = _status_from_summary(summary)
        run.finished_at = timezone.now()
        run.save(update_fields=["status", "finished_at", "updated_at"])

        self.stdout.write(self.style.SUCCESS("CISA KEV ingestion complete."))
        self.stdout.write(
            f"Seen: {summary['seen']} Created: {summary['created']} "
            f"Updated: {summary['updated']} Failed: {summary['failed']}"
        )

        if options["enrich_epss"]:
            epss_run = ThreatIngestionRun.objects.create(
                run_type=ThreatIngestionRun.RunType.EPSS_ENRICHMENT,
                status=ThreatIngestionRun.Status.RUNNING,
                source=ThreatIngestionRun.Source.FIRST_EPSS,
            )
            try:
                epss_summary = enrich_vulnerabilities_with_epss(run=epss_run)
            except ThreatBoardServiceError as exc:
                epss_run.status = ThreatIngestionRun.Status.FAILED
                epss_run.error_message = str(exc)
                epss_run.finished_at = timezone.now()
                epss_run.save(
                    update_fields=["status", "error_message", "finished_at", "updated_at"]
                )
                raise CommandError(str(exc)) from exc
            epss_run.status = _status_from_summary(epss_summary)
            epss_run.finished_at = timezone.now()
            epss_run.save(update_fields=["status", "finished_at", "updated_at"])
            self.stdout.write(
                f"EPSS enrichment: seen={epss_summary['seen']} "
                f"updated={epss_summary['updated']} failed={epss_summary['failed']}"
            )

        if options["match_assets"]:
            match_run = ThreatIngestionRun.objects.create(
                run_type=ThreatIngestionRun.RunType.ASSET_MATCHING,
                status=ThreatIngestionRun.Status.RUNNING,
                source=ThreatIngestionRun.Source.INTERNAL,
            )
            match_summary = match_vulnerabilities_to_assets(
                run=match_run,
                create_risk_events=True,
            )
            match_run.status = ThreatIngestionRun.Status.COMPLETED
            match_run.finished_at = timezone.now()
            match_run.save(update_fields=["status", "finished_at", "updated_at"])
            self.stdout.write(
                f"Asset matching: assets={match_summary['assets_seen']} "
                f"created={match_summary['matches_created']} "
                f"updated={match_summary['matches_updated']}"
            )


def _status_from_summary(summary: dict[str, int]) -> str:
    return (
        ThreatIngestionRun.Status.COMPLETED_WITH_ERRORS
        if summary.get("failed", 0)
        else ThreatIngestionRun.Status.COMPLETED
    )
