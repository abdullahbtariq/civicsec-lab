"""IncidentFlow — apply a playbook template to an incident."""

from django.utils import timezone

from apps.incidents.models import Incident, IncidentTask, IncidentTimelineEntry, PlaybookTemplate


def apply_playbook(incident: Incident, template: PlaybookTemplate, applied_by=None) -> int:
    """
    Create IncidentTask records from a PlaybookTemplate's steps and log a timeline entry.

    Returns the number of tasks created.
    """
    steps = list(template.steps.order_by("order"))
    if not steps:
        return 0

    tasks = [
        IncidentTask(
            organisation=incident.organisation,
            incident=incident,
            title=step.title,
            description=step.description,
            order=step.order,
            playbook_step=step,
        )
        for step in steps
    ]
    IncidentTask.objects.bulk_create(tasks)

    IncidentTimelineEntry.objects.create(
        organisation=incident.organisation,
        incident=incident,
        entry_type=IncidentTimelineEntry.EntryType.ACTION_COMPLETED,
        title=f'Playbook applied: "{template.name}"',
        description=(
            f"{len(tasks)} response task(s) added from the " f'"{template.name}" playbook template.'
        ),
        actor=applied_by,
        timestamp=timezone.now(),
    )

    return len(tasks)
