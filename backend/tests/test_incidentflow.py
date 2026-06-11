"""
Tests for Phase 5 — IncidentFlow:
playbook seeding, apply_playbook service, report generation, and API endpoints.
"""

import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from apps.incidents.models import (
    Incident,
    IncidentTask,
    IncidentTimelineEntry,
    PlaybookTemplate,
)
from apps.incidents.services.apply_playbook import apply_playbook
from apps.incidents.services.report import generate_incident_report
from apps.incidents.services.seed_playbooks import BUILTIN_PLAYBOOKS, seed_builtin_playbooks
from apps.organisations.models import Organisation

User = get_user_model()

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def make_org(name="Test Org", slug="test-org"):
    return Organisation.objects.create(name=name, slug=slug)


def make_user(org, role="admin"):
    return User.objects.create_user(
        email=f"{role}@{org.slug}.test",
        password="testpass",
        role=role,
        organisation=org,
    )


def auth_client(user):
    c = APIClient()
    c.force_authenticate(user=user)
    return c


def make_incident(org, user=None, **kwargs):
    return Incident.objects.create(
        organisation=org,
        title=kwargs.pop("title", "Test Incident"),
        owner=user,
        **kwargs,
    )


# ---------------------------------------------------------------------------
# Playbook seeding
# ---------------------------------------------------------------------------


class TestSeedPlaybooks:
    def test_seeds_all_builtin_templates(self, db):
        created = seed_builtin_playbooks()
        assert created == len(BUILTIN_PLAYBOOKS)

    def test_seeding_is_idempotent(self, db):
        seed_builtin_playbooks()
        created_again = seed_builtin_playbooks()
        assert created_again == 0

    def test_each_template_has_steps(self, db):
        seed_builtin_playbooks()
        for template in PlaybookTemplate.objects.filter(is_builtin=True):
            assert template.steps.count() > 0, f"{template.name} has no steps"

    def test_builtin_templates_have_no_organisation(self, db):
        seed_builtin_playbooks()
        assert PlaybookTemplate.objects.filter(is_builtin=True, organisation__isnull=False).count() == 0


# ---------------------------------------------------------------------------
# apply_playbook service
# ---------------------------------------------------------------------------


class TestApplyPlaybook:
    def test_creates_tasks_from_steps(self, db):
        seed_builtin_playbooks()
        org = make_org()
        user = make_user(org)
        incident = make_incident(org, user)
        template = PlaybookTemplate.objects.filter(is_builtin=True).first()

        tasks_created = apply_playbook(incident, template, applied_by=user)

        assert tasks_created == template.steps.count()
        assert IncidentTask.objects.filter(incident=incident).count() == tasks_created

    def test_creates_timeline_entry(self, db):
        seed_builtin_playbooks()
        org = make_org()
        user = make_user(org)
        incident = make_incident(org, user)
        template = PlaybookTemplate.objects.filter(is_builtin=True).first()

        apply_playbook(incident, template, applied_by=user)

        entries = IncidentTimelineEntry.objects.filter(incident=incident)
        assert entries.count() == 1
        assert "Playbook applied" in entries.first().title

    def test_tasks_linked_to_playbook_steps(self, db):
        seed_builtin_playbooks()
        org = make_org()
        user = make_user(org)
        incident = make_incident(org, user)
        template = PlaybookTemplate.objects.filter(is_builtin=True).first()

        apply_playbook(incident, template)

        for task in IncidentTask.objects.filter(incident=incident):
            assert task.playbook_step is not None

    def test_empty_template_creates_no_tasks(self, db):
        org = make_org()
        user = make_user(org)
        incident = make_incident(org, user)
        empty_template = PlaybookTemplate.objects.create(
            name="Empty", organisation=org, is_builtin=False
        )
        count = apply_playbook(incident, empty_template)
        assert count == 0


# ---------------------------------------------------------------------------
# Report generation
# ---------------------------------------------------------------------------


class TestReportGeneration:
    def test_report_contains_incident_title(self, db):
        org = make_org()
        user = make_user(org)
        incident = make_incident(org, user, title="Civic Data Breach")
        report = generate_incident_report(incident)
        assert "Civic Data Breach" in report

    def test_report_contains_tasks_section(self, db):
        seed_builtin_playbooks()
        org = make_org()
        user = make_user(org)
        incident = make_incident(org, user)
        template = PlaybookTemplate.objects.filter(is_builtin=True).first()
        apply_playbook(incident, template)
        report = generate_incident_report(incident)
        assert "## Response Tasks" in report
        assert "✅" in report or "⬜" in report

    def test_report_contains_timeline_section(self, db):
        org = make_org()
        user = make_user(org)
        incident = make_incident(org, user)
        IncidentTimelineEntry.objects.create(
            organisation=org,
            incident=incident,
            title="Initial alert",
            entry_type=IncidentTimelineEntry.EntryType.ALERT_CREATED,
        )
        report = generate_incident_report(incident)
        assert "## Timeline" in report
        assert "Initial alert" in report

    def test_report_is_markdown_string(self, db):
        org = make_org()
        incident = make_incident(org)
        report = generate_incident_report(incident)
        assert isinstance(report, str)
        assert report.startswith("# Incident Report")


# ---------------------------------------------------------------------------
# API: playbook list
# ---------------------------------------------------------------------------


class TestPlaybookListAPI:
    def test_list_playbooks_authenticated(self, db):
        seed_builtin_playbooks()
        org = make_org()
        user = make_user(org)
        response = auth_client(user).get("/api/incidentflow/playbooks/")
        assert response.status_code == 200
        assert len(response.data) == len(BUILTIN_PLAYBOOKS)

    def test_list_playbooks_unauthenticated(self, db):
        response = APIClient().get("/api/incidentflow/playbooks/")
        assert response.status_code in (401, 403)

    def test_each_playbook_has_steps(self, db):
        seed_builtin_playbooks()
        org = make_org()
        user = make_user(org)
        response = auth_client(user).get("/api/incidentflow/playbooks/")
        for pb in response.data:
            assert len(pb["steps"]) > 0


# ---------------------------------------------------------------------------
# API: apply playbook
# ---------------------------------------------------------------------------


class TestApplyPlaybookAPI:
    def test_apply_playbook_creates_tasks(self, db):
        seed_builtin_playbooks()
        org = make_org()
        user = make_user(org)
        incident = make_incident(org, user)
        template = PlaybookTemplate.objects.filter(is_builtin=True).first()

        response = auth_client(user).post(
            f"/api/incidentflow/incidents/{incident.id}/apply-playbook/",
            {"template_id": template.id},
        )
        assert response.status_code == 201
        assert response.data["tasks_created"] > 0

    def test_viewer_cannot_apply_playbook(self, db):
        seed_builtin_playbooks()
        org = make_org()
        viewer = make_user(org, "viewer")
        incident = make_incident(org)
        template = PlaybookTemplate.objects.filter(is_builtin=True).first()

        response = auth_client(viewer).post(
            f"/api/incidentflow/incidents/{incident.id}/apply-playbook/",
            {"template_id": template.id},
        )
        assert response.status_code == 403

    def test_cross_org_incident_blocked(self, db):
        seed_builtin_playbooks()
        org_a = make_org("Org A", "org-a")
        org_b = make_org("Org B", "org-b")
        user_a = make_user(org_a)
        incident_b = make_incident(org_b)
        template = PlaybookTemplate.objects.filter(is_builtin=True).first()

        response = auth_client(user_a).post(
            f"/api/incidentflow/incidents/{incident_b.id}/apply-playbook/",
            {"template_id": template.id},
        )
        assert response.status_code == 404


# ---------------------------------------------------------------------------
# API: tasks
# ---------------------------------------------------------------------------


class TestIncidentTaskAPI:
    def test_list_tasks(self, db):
        org = make_org()
        user = make_user(org)
        incident = make_incident(org, user)
        IncidentTask.objects.create(
            organisation=org, incident=incident, title="Task 1", order=1
        )
        response = auth_client(user).get(f"/api/incidentflow/incidents/{incident.id}/tasks/")
        assert response.status_code == 200
        assert len(response.data) == 1

    def test_create_task(self, db):
        org = make_org()
        user = make_user(org)
        incident = make_incident(org, user)
        response = auth_client(user).post(
            f"/api/incidentflow/incidents/{incident.id}/tasks/",
            {"title": "New task", "description": "Do this"},
        )
        assert response.status_code == 201
        assert response.data["title"] == "New task"

    def test_update_task_status(self, db):
        org = make_org()
        user = make_user(org)
        incident = make_incident(org, user)
        task = IncidentTask.objects.create(
            organisation=org, incident=incident, title="Task", order=1
        )
        response = auth_client(user).patch(
            f"/api/incidentflow/tasks/{task.id}/", {"status": "done"}
        )
        assert response.status_code == 200
        assert response.data["status"] == "done"
        task.refresh_from_db()
        assert task.completed_at is not None

    def test_delete_task(self, db):
        org = make_org()
        user = make_user(org)
        incident = make_incident(org, user)
        task = IncidentTask.objects.create(
            organisation=org, incident=incident, title="Task", order=1
        )
        response = auth_client(user).delete(f"/api/incidentflow/tasks/{task.id}/")
        assert response.status_code == 204
        assert not IncidentTask.objects.filter(id=task.id).exists()


# ---------------------------------------------------------------------------
# API: timeline note + status update
# ---------------------------------------------------------------------------


class TestTimelineAndStatusAPI:
    def test_add_timeline_note(self, db):
        org = make_org()
        user = make_user(org)
        incident = make_incident(org, user)
        response = auth_client(user).post(
            f"/api/incidentflow/incidents/{incident.id}/add-note/",
            {"title": "Checked logs", "description": "Nothing unusual found."},
        )
        assert response.status_code == 201
        assert response.data["title"] == "Checked logs"

    def test_update_incident_status(self, db):
        org = make_org()
        user = make_user(org)
        incident = make_incident(org, user)
        response = auth_client(user).patch(
            f"/api/incidentflow/incidents/{incident.id}/status/", {"status": "investigating"}
        )
        assert response.status_code == 200
        incident.refresh_from_db()
        assert incident.status == "investigating"

    def test_status_change_creates_timeline_entry(self, db):
        org = make_org()
        user = make_user(org)
        incident = make_incident(org, user)
        auth_client(user).patch(
            f"/api/incidentflow/incidents/{incident.id}/status/", {"status": "contained"}
        )
        entries = IncidentTimelineEntry.objects.filter(
            incident=incident, entry_type=IncidentTimelineEntry.EntryType.STATUS_CHANGED
        )
        assert entries.count() == 1


# ---------------------------------------------------------------------------
# API: report
# ---------------------------------------------------------------------------


class TestReportAPI:
    def test_get_report_json(self, db):
        org = make_org()
        user = make_user(org)
        incident = make_incident(org, user)
        response = auth_client(user).get(f"/api/incidentflow/incidents/{incident.id}/report/")
        assert response.status_code == 200
        assert "report_markdown" in response.data
        assert "# Incident Report" in response.data["report_markdown"]

    def test_cross_org_report_blocked(self, db):
        org_a = make_org("A", "a")
        org_b = make_org("B", "b")
        user_a = make_user(org_a)
        incident_b = make_incident(org_b)
        response = auth_client(user_a).get(
            f"/api/incidentflow/incidents/{incident_b.id}/report/"
        )
        assert response.status_code == 404
