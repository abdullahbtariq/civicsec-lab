"""IncidentFlow URL configuration."""

from django.http import HttpResponse
from django.urls import path
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.common.permissions import IsOrganisationScopedRole
from apps.incidents.models import Incident, IncidentTask, IncidentTimelineEntry, PlaybookTemplate
from apps.incidents.serializers import IncidentTaskSerializer, PlaybookTemplateSerializer
from apps.incidents.services.apply_playbook import apply_playbook
from apps.incidents.services.report import generate_incident_report


class PlaybookTemplateListView(APIView):
    """List playbook templates available to the organisation (built-ins + org-specific)."""

    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        templates = PlaybookTemplate.objects.filter(
            organisation__isnull=True
        ) | PlaybookTemplate.objects.filter(organisation=request.user.organisation)
        templates = templates.prefetch_related("steps").order_by("incident_type", "name")
        return Response(PlaybookTemplateSerializer(templates, many=True).data)


class ApplyPlaybookView(APIView):
    """Apply a playbook template to an incident, creating tasks."""

    permission_classes = [IsOrganisationScopedRole]

    def post(self, request: Request, incident_id: int) -> Response:
        if request.user.role not in {"admin", "analyst"}:
            return Response(status=status.HTTP_403_FORBIDDEN)

        try:
            incident = Incident.objects.get(id=incident_id, organisation=request.user.organisation)
        except Incident.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

        template_id = request.data.get("template_id")
        if not template_id:
            return Response(
                {"error": "template_id is required."}, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            template = PlaybookTemplate.objects.get(id=template_id)
        except PlaybookTemplate.DoesNotExist:
            return Response(
                {"error": "Playbook template not found."}, status=status.HTTP_404_NOT_FOUND
            )

        # Allow built-in (org=None) or org-specific templates
        if template.organisation and template.organisation != request.user.organisation:
            return Response(status=status.HTTP_403_FORBIDDEN)

        tasks_created = apply_playbook(incident, template, applied_by=request.user)
        return Response(
            {"tasks_created": tasks_created, "template_name": template.name},
            status=status.HTTP_201_CREATED,
        )


class IncidentTaskListView(APIView):
    """List and create tasks for an incident."""

    permission_classes = [IsAuthenticated]

    def _get_incident(self, request, incident_id):
        try:
            return Incident.objects.get(id=incident_id, organisation=request.user.organisation)
        except Incident.DoesNotExist:
            return None

    def get(self, request: Request, incident_id: int) -> Response:
        if not self._get_incident(request, incident_id):
            return Response(status=status.HTTP_404_NOT_FOUND)
        tasks = IncidentTask.objects.filter(
            incident_id=incident_id,
            organisation=request.user.organisation,
        ).order_by("order", "created_at")
        return Response(IncidentTaskSerializer(tasks, many=True).data)

    def post(self, request: Request, incident_id: int) -> Response:
        if request.user.role not in {"admin", "analyst"}:
            return Response(status=status.HTTP_403_FORBIDDEN)
        incident = self._get_incident(request, incident_id)
        if not incident:
            return Response(status=status.HTTP_404_NOT_FOUND)
        serializer = IncidentTaskSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save(incident=incident, organisation=incident.organisation)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class IncidentTaskDetailView(APIView):
    """Update or delete a single incident task."""

    permission_classes = [IsOrganisationScopedRole]

    def _get_task(self, request, task_id):
        try:
            return IncidentTask.objects.get(id=task_id, organisation=request.user.organisation)
        except IncidentTask.DoesNotExist:
            return None

    def patch(self, request: Request, task_id: int) -> Response:
        if request.user.role not in {"admin", "analyst"}:
            return Response(status=status.HTTP_403_FORBIDDEN)
        task = self._get_task(request, task_id)
        if not task:
            return Response(status=status.HTTP_404_NOT_FOUND)
        serializer = IncidentTaskSerializer(task, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        # Auto-set completed_at when status becomes "done"
        from django.utils import timezone

        if request.data.get("status") == "done" and task.status != "done":
            serializer.save(completed_at=timezone.now())
        elif request.data.get("status") and request.data["status"] != "done":
            serializer.save(completed_at=None)
        else:
            serializer.save()
        return Response(serializer.data)

    def delete(self, request: Request, task_id: int) -> Response:
        if request.user.role not in {"admin", "analyst"}:
            return Response(status=status.HTTP_403_FORBIDDEN)
        task = self._get_task(request, task_id)
        if not task:
            return Response(status=status.HTTP_404_NOT_FOUND)
        task.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AddTimelineNoteView(APIView):
    """Quickly add a note to an incident timeline."""

    permission_classes = [IsOrganisationScopedRole]

    def post(self, request: Request, incident_id: int) -> Response:
        if request.user.role not in {"admin", "analyst"}:
            return Response(status=status.HTTP_403_FORBIDDEN)
        try:
            incident = Incident.objects.get(id=incident_id, organisation=request.user.organisation)
        except Incident.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

        title = request.data.get("title", "").strip()
        if not title:
            return Response({"error": "title is required."}, status=status.HTTP_400_BAD_REQUEST)

        entry = IncidentTimelineEntry.objects.create(
            organisation=incident.organisation,
            incident=incident,
            entry_type=IncidentTimelineEntry.EntryType.NOTE_ADDED,
            title=title,
            description=request.data.get("description", ""),
            actor=request.user,
        )
        return Response(
            {"id": entry.id, "title": entry.title, "timestamp": entry.timestamp.isoformat()},
            status=status.HTTP_201_CREATED,
        )


class UpdateIncidentStatusView(APIView):
    """Update incident status and log a timeline entry."""

    permission_classes = [IsOrganisationScopedRole]

    def patch(self, request: Request, incident_id: int) -> Response:
        if request.user.role not in {"admin", "analyst"}:
            return Response(status=status.HTTP_403_FORBIDDEN)
        try:
            incident = Incident.objects.get(id=incident_id, organisation=request.user.organisation)
        except Incident.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

        new_status = request.data.get("status")
        valid_statuses = [s[0] for s in Incident.Status.choices]
        if not new_status or new_status not in valid_statuses:
            return Response(
                {"error": f"status must be one of: {', '.join(valid_statuses)}."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        old_status = incident.status
        incident.status = new_status
        from django.utils import timezone

        if new_status in {"resolved", "closed"} and not incident.closed_at:
            incident.closed_at = timezone.now()
        elif new_status not in {"resolved", "closed"}:
            incident.closed_at = None
        incident.save(update_fields=["status", "closed_at"])

        IncidentTimelineEntry.objects.create(
            organisation=incident.organisation,
            incident=incident,
            entry_type=IncidentTimelineEntry.EntryType.STATUS_CHANGED,
            title=f"Status changed: {old_status} → {new_status}",
            description=request.data.get("note", ""),
            actor=request.user,
        )

        return Response({"status": new_status, "incident_id": incident_id})


class IncidentReportView(APIView):
    """Generate and optionally download a Markdown incident report."""

    permission_classes = [IsAuthenticated]

    def get(self, request: Request, incident_id: int) -> Response:
        try:
            incident = Incident.objects.get(id=incident_id, organisation=request.user.organisation)
        except Incident.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

        report_md = generate_incident_report(incident)
        fmt = request.query_params.get("format", "json")

        if fmt == "markdown":
            return HttpResponse(
                report_md,
                content_type="text/markdown; charset=utf-8",
                headers={
                    "Content-Disposition": (
                        f'attachment; filename="incident-report-{incident.id}.md"'
                    )
                },
            )

        return Response({"report_markdown": report_md, "incident_id": incident_id})


urlpatterns = [
    path("playbooks/", PlaybookTemplateListView.as_view(), name="incidentflow-playbooks"),
    path(
        "incidents/<int:incident_id>/apply-playbook/",
        ApplyPlaybookView.as_view(),
        name="incidentflow-apply-playbook",
    ),
    path(
        "incidents/<int:incident_id>/tasks/",
        IncidentTaskListView.as_view(),
        name="incidentflow-tasks",
    ),
    path(
        "incidents/<int:incident_id>/add-note/",
        AddTimelineNoteView.as_view(),
        name="incidentflow-add-note",
    ),
    path(
        "incidents/<int:incident_id>/status/",
        UpdateIncidentStatusView.as_view(),
        name="incidentflow-status",
    ),
    path(
        "incidents/<int:incident_id>/report/",
        IncidentReportView.as_view(),
        name="incidentflow-report",
    ),
    path("tasks/<int:task_id>/", IncidentTaskDetailView.as_view(), name="incidentflow-task-detail"),
]
