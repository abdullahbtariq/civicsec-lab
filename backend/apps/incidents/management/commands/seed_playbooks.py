"""Management command: seed built-in IncidentFlow playbook templates."""

from django.core.management.base import BaseCommand

from apps.incidents.services.seed_playbooks import seed_builtin_playbooks


class Command(BaseCommand):
    help = "Seed built-in IncidentFlow playbook templates."

    def handle(self, *args, **options):
        created = seed_builtin_playbooks()
        if created:
            self.stdout.write(
                self.style.SUCCESS(f"Created {created} built-in playbook template(s).")
            )
        else:
            self.stdout.write("All built-in playbook templates already exist — nothing to do.")
