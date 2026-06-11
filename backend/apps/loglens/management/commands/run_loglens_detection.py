"""Management command: run LogLens detection rules."""

from django.core.management.base import BaseCommand

from apps.loglens.services.detection import run_detection
from apps.loglens.services.risk_events import generate_risk_events_for_organisation
from apps.organisations.models import Organisation


class Command(BaseCommand):
    help = "Run LogLens detection rules and generate risk events."

    def add_arguments(self, parser):
        parser.add_argument(
            "--org-slug",
            default="open-civic-aid",
            help="Organisation slug to run detection for (default: open-civic-aid).",
        )

    def handle(self, *args, **options):
        slug = options["org_slug"]
        try:
            org = Organisation.objects.get(slug=slug)
        except Organisation.DoesNotExist:
            self.stderr.write(self.style.ERROR(f"Organisation '{slug}' not found."))
            return

        self.stdout.write(f"Running detection for '{org.name}'...")
        detection_result = run_detection(organisation=org)
        self.stdout.write(
            f"Anomalies created: {detection_result['anomalies_created']} "
            f"(events analysed: {detection_result['events_analysed']})"
        )
        for k, v in detection_result["by_type"].items():
            self.stdout.write(f"  {k}: {v}")

        self.stdout.write("Generating risk events...")
        risk_result = generate_risk_events_for_organisation(organisation=org)
        self.stdout.write(
            self.style.SUCCESS(
                f"Risk events created: {risk_result['risk_events_created']} "
                f"(below threshold: {risk_result['anomalies_below_threshold']})"
            )
        )
