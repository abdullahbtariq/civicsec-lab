from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone

from apps.threatboard.models import ThreatIngestionRun, Vulnerability
from apps.threatboard.services.epss import enrich_vulnerabilities_with_epss
from apps.threatboard.services.kev import ThreatBoardServiceError


class Command(BaseCommand):
    help = "Enrich vulnerabilities with public FIRST EPSS probability data."

    def add_arguments(self, parser):
        parser.add_argument("--limit", type=int, default=100)
        parser.add_argument("--cve", action="append", default=[])

    def handle(self, *args, **options):
        cve_ids = options["cve"] or list(
            Vulnerability.objects.values_list("cve_id", flat=True)[: options["limit"]]
        )
        run = ThreatIngestionRun.objects.create(
            run_type=ThreatIngestionRun.RunType.EPSS_ENRICHMENT,
            status=ThreatIngestionRun.Status.RUNNING,
            source=ThreatIngestionRun.Source.FIRST_EPSS,
        )

        try:
            summary = enrich_vulnerabilities_with_epss(cve_ids, run=run)
        except ThreatBoardServiceError as exc:
            run.status = ThreatIngestionRun.Status.FAILED
            run.error_message = str(exc)
            run.finished_at = timezone.now()
            run.save(update_fields=["status", "error_message", "finished_at", "updated_at"])
            raise CommandError(str(exc)) from exc

        run.status = (
            ThreatIngestionRun.Status.COMPLETED_WITH_ERRORS
            if summary["failed"]
            else ThreatIngestionRun.Status.COMPLETED
        )
        run.finished_at = timezone.now()
        run.save(update_fields=["status", "finished_at", "updated_at"])

        self.stdout.write(self.style.SUCCESS("EPSS enrichment complete."))
        self.stdout.write(
            f"Seen: {summary['seen']} Updated: {summary['updated']} Failed: {summary['failed']}"
        )
