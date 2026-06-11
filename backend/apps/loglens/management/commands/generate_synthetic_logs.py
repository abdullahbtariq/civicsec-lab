"""Management command: generate synthetic login logs for LogLens."""

from django.core.management.base import BaseCommand

from apps.loglens.services.synthetic import generate_synthetic_logs
from apps.organisations.models import Organisation


class Command(BaseCommand):
    help = "Generate synthetic login logs for LogLens demo data."

    def add_arguments(self, parser):
        parser.add_argument(
            "--org-slug",
            default="open-civic-aid",
            help="Organisation slug to generate logs for (default: open-civic-aid).",
        )
        parser.add_argument(
            "--days",
            type=int,
            default=7,
            help="Number of days of history to generate (default: 7).",
        )
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Clear existing login events before generating.",
        )

    def handle(self, *args, **options):
        slug = options["org_slug"]
        try:
            org = Organisation.objects.get(slug=slug)
        except Organisation.DoesNotExist:
            self.stderr.write(self.style.ERROR(f"Organisation '{slug}' not found."))
            return

        self.stdout.write(f"Generating synthetic logs for '{org.name}'...")
        result = generate_synthetic_logs(
            organisation=org,
            days_back=options["days"],
            clear_existing=options["clear"],
        )
        self.stdout.write(
            self.style.SUCCESS(
                f"Done. batch_id={result['batch_id']} "
                f"total={result['total_created']} "
                f"normal={result['normal_events']} "
                f"burst_scenario={result['scenario_failed_burst']} "
                f"travel_scenario={result['scenario_impossible_travel']} "
                f"device_scenario={result['scenario_new_device']} "
                f"time_scenario={result['scenario_unusual_time']}"
            )
        )
