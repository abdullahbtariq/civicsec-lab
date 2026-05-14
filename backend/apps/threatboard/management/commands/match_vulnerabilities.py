from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone

from apps.organisations.models import Organisation
from apps.threatboard.models import ThreatIngestionRun
from apps.threatboard.services.matching import match_vulnerabilities_to_assets


class Command(BaseCommand):
    help = "Match vulnerability metadata to organisation assets."

    def add_arguments(self, parser):
        parser.add_argument("--organisation-slug")
        parser.add_argument("--create-risk-events", action="store_true")

    def handle(self, *args, **options):
        organisation = None
        if options["organisation_slug"]:
            try:
                organisation = Organisation.objects.get(slug=options["organisation_slug"])
            except Organisation.DoesNotExist as exc:
                raise CommandError("Organisation not found.") from exc

        run = ThreatIngestionRun.objects.create(
            organisation=organisation,
            run_type=ThreatIngestionRun.RunType.ASSET_MATCHING,
            status=ThreatIngestionRun.Status.RUNNING,
            source=ThreatIngestionRun.Source.INTERNAL,
        )
        summary = match_vulnerabilities_to_assets(
            organisation=organisation,
            run=run,
            create_risk_events=options["create_risk_events"],
        )
        run.status = ThreatIngestionRun.Status.COMPLETED
        run.finished_at = timezone.now()
        run.save(update_fields=["status", "finished_at", "updated_at"])

        self.stdout.write(self.style.SUCCESS("Vulnerability matching complete."))
        self.stdout.write(
            f"Assets: {summary['assets_seen']} Created: {summary['matches_created']} "
            f"Updated: {summary['matches_updated']} "
            f"Risk events: {summary['risk_events_created_or_updated']}"
        )
