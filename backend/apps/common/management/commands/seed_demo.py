from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.accounts.models import User
from apps.assets.models import Asset
from apps.common.models import ProcessingJob
from apps.evidence.models import EvidenceItem
from apps.incidents.models import Incident, IncidentTimelineEntry
from apps.organisations.models import Organisation
from apps.risk.models import ActionRecommendation, RiskEvent


class Command(BaseCommand):
    help = "Seed the fictional Open Civic Aid demo workspace."

    def handle(self, *args, **options):
        organisation, _ = Organisation.objects.update_or_create(
            slug="open-civic-aid",
            defaults={
                "name": "Open Civic Aid",
                "description": "Fictional civic technology organisation for local demos.",
                "sector": "civic_technology",
                "country": "United Kingdom",
                "risk_profile": Organisation.RiskProfile.ELEVATED,
            },
        )

        users = self._seed_users(organisation)
        assets = self._seed_assets(organisation, users["admin@opencivicaid.test"])
        risk_events = self._seed_risk_events(organisation, users, assets)
        self._seed_evidence_and_recommendations(organisation, risk_events)
        self._seed_incidents(organisation, users, risk_events)

        ProcessingJob.objects.update_or_create(
            organisation=organisation,
            job_type=ProcessingJob.JobType.DEMO_SEED,
            defaults={
                "status": ProcessingJob.Status.COMPLETED,
                "started_at": timezone.now(),
                "finished_at": timezone.now(),
                "progress": 100,
                "metadata": {"seed": "open-civic-aid"},
            },
        )

        self.stdout.write(self.style.SUCCESS("Demo seed complete."))
        self.stdout.write(f"Organisation: {organisation.name} ({organisation.slug})")
        self.stdout.write("Demo users:")
        for email in users:
            self.stdout.write(f"- {email}")
        self.stdout.write(f"Assets: {Asset.objects.filter(organisation=organisation).count()}")
        self.stdout.write(
            f"Risk events: {RiskEvent.objects.filter(organisation=organisation).count()}"
        )
        self.stdout.write(
            f"Incidents: {Incident.objects.filter(organisation=organisation).count()}"
        )

    def _seed_users(self, organisation: Organisation) -> dict[str, User]:
        user_specs = [
            {
                "email": "admin@opencivicaid.test",
                "full_name": "Admin User",
                "role": User.Role.ADMIN,
                "is_staff": True,
            },
            {
                "email": "analyst@opencivicaid.test",
                "full_name": "Analyst User",
                "role": User.Role.ANALYST,
                "is_staff": False,
            },
            {
                "email": "viewer@opencivicaid.test",
                "full_name": "Viewer User",
                "role": User.Role.VIEWER,
                "is_staff": False,
            },
        ]
        users: dict[str, User] = {}

        for spec in user_specs:
            user, _ = User.objects.update_or_create(
                email=spec["email"],
                defaults={
                    "full_name": spec["full_name"],
                    "organisation": organisation,
                    "role": spec["role"],
                    "is_active": True,
                    "is_staff": spec["is_staff"],
                },
            )
            user.set_password("ChangeMe123!")
            user.save(update_fields=["password"])
            users[user.email] = user

        return users

    def _seed_assets(self, organisation: Organisation, created_by: User) -> dict[str, Asset]:
        asset_specs = [
            {
                "name": "Staff Portal",
                "asset_type": Asset.AssetType.WEB_APP,
                "internet_exposed": True,
                "criticality": Asset.Criticality.HIGH,
                "data_sensitivity": Asset.DataSensitivity.SENSITIVE,
                "vendor": "Django",
                "product": "Civic Staff Portal",
            },
            {
                "name": "Volunteer Database",
                "asset_type": Asset.AssetType.DATABASE,
                "internet_exposed": False,
                "criticality": Asset.Criticality.CRITICAL,
                "data_sensitivity": Asset.DataSensitivity.HIGHLY_SENSITIVE,
                "vendor": "",
                "product": "",
            },
            {
                "name": "Public Website",
                "asset_type": Asset.AssetType.WEB_APP,
                "internet_exposed": True,
                "criticality": Asset.Criticality.MEDIUM,
                "data_sensitivity": Asset.DataSensitivity.PUBLIC,
                "vendor": "",
                "product": "",
            },
            {
                "name": "Research Repository",
                "asset_type": Asset.AssetType.REPOSITORY,
                "internet_exposed": False,
                "criticality": Asset.Criticality.MEDIUM,
                "data_sensitivity": Asset.DataSensitivity.INTERNAL,
                "vendor": "",
                "product": "",
            },
            {
                "name": "Election Monitoring Dataset",
                "asset_type": Asset.AssetType.DATASET,
                "internet_exposed": False,
                "criticality": Asset.Criticality.HIGH,
                "data_sensitivity": Asset.DataSensitivity.SENSITIVE,
                "vendor": "",
                "product": "",
            },
        ]
        assets: dict[str, Asset] = {}

        for spec in asset_specs:
            asset, _ = Asset.objects.update_or_create(
                organisation=organisation,
                name=spec["name"],
                defaults={
                    **spec,
                    "created_by": created_by,
                    "description": "Fictional Open Civic Aid demo asset.",
                    "owner_name": "Open Civic Aid",
                    "version": "",
                    "tags": ["demo", "fictional"],
                },
            )
            assets[asset.name] = asset

        return assets

    def _seed_risk_events(
        self,
        organisation: Organisation,
        users: dict[str, User],
        assets: dict[str, Asset],
    ) -> dict[str, RiskEvent]:
        risk_specs = [
            {
                "title": "Suspicious login pattern requiring review",
                "event_type": "suspicious_login_pattern",
                "summary": (
                    "Fictional repeated failed logins followed by a successful "
                    "staff portal login."
                ),
                "severity": RiskEvent.Severity.HIGH,
                "confidence": 0.78,
                "status": RiskEvent.Status.TRIAGED,
                "affected_asset": assets["Staff Portal"],
                "affected_user": users["analyst@opencivicaid.test"],
                "risk_score": 76,
                "evidence_summary": "Synthetic login sequence resembles an account-risk signal.",
                "recommended_action_summary": (
                    "Review session details and reset credentials if needed."
                ),
                "tags": ["demo", "loglens"],
            },
            {
                "title": "High-risk dataset uploaded",
                "event_type": "privacy_review_required",
                "summary": (
                    "Fictional volunteer dataset contains direct identifiers and "
                    "quasi-identifiers."
                ),
                "severity": RiskEvent.Severity.HIGH,
                "confidence": 0.84,
                "status": RiskEvent.Status.NEW,
                "affected_asset": assets["Election Monitoring Dataset"],
                "affected_user": users["analyst@opencivicaid.test"],
                "risk_score": 72,
                "evidence_summary": (
                    "Sample fields include names, email-like values, city, and age band."
                ),
                "recommended_action_summary": "Mask direct identifiers before wider analysis.",
                "tags": ["demo", "privacy_doctor"],
            },
            {
                "title": "Known exploited vulnerability may affect public-facing asset",
                "event_type": "known_exploited_vulnerability_review",
                "summary": (
                    "Fictional advisory may affect the public website and needs "
                    "defensive triage."
                ),
                "severity": RiskEvent.Severity.CRITICAL,
                "confidence": 0.66,
                "status": RiskEvent.Status.NEW,
                "affected_asset": assets["Public Website"],
                "affected_user": None,
                "risk_score": 88,
                "evidence_summary": (
                    "Demo inventory links a public-facing asset to a fictional advisory."
                ),
                "recommended_action_summary": "Confirm product version and schedule patch review.",
                "tags": ["demo", "threatboard"],
            },
        ]
        risk_events: dict[str, RiskEvent] = {}

        for spec in risk_specs:
            risk_event, _ = RiskEvent.objects.update_or_create(
                organisation=organisation,
                title=spec["title"],
                defaults={
                    **spec,
                    "organisation": organisation,
                    "source_module": RiskEvent.SourceModule.MANUAL,
                    "mapped_frameworks": {"nist_csf": ["Detect", "Respond"]},
                    "first_seen_at": timezone.now(),
                    "last_seen_at": timezone.now(),
                },
            )
            risk_events[risk_event.title] = risk_event

        return risk_events

    def _seed_evidence_and_recommendations(
        self,
        organisation: Organisation,
        risk_events: dict[str, RiskEvent],
    ) -> None:
        evidence_specs = [
            (
                risk_events["Suspicious login pattern requiring review"],
                {
                    "evidence_type": EvidenceItem.EvidenceType.LOGIN_PATTERN,
                    "title": "Synthetic failed login burst",
                    "description": (
                        "Demo login logs show repeated failed attempts before a "
                        "successful login."
                    ),
                    "source": "sample-data/open-civic-aid/login_logs.csv",
                    "confidence": 0.78,
                },
                {
                    "title": "Review staff portal session and credentials",
                    "description": (
                        "Check the fictional session details and prepare a password "
                        "reset if needed."
                    ),
                    "priority": ActionRecommendation.Priority.HIGH,
                },
            ),
            (
                risk_events["High-risk dataset uploaded"],
                {
                    "evidence_type": EvidenceItem.EvidenceType.PII_DETECTION,
                    "title": "Direct identifiers detected in demo CSV",
                    "description": (
                        "The fictional volunteer dataset includes direct contact fields."
                    ),
                    "source": "sample-data/open-civic-aid/volunteer_contacts.csv",
                    "confidence": 0.84,
                },
                {
                    "title": "Mask direct identifiers before analysis",
                    "description": (
                        "Create a masked copy for demo analysis and document residual risk."
                    ),
                    "priority": ActionRecommendation.Priority.HIGH,
                },
            ),
            (
                risk_events["Known exploited vulnerability may affect public-facing asset"],
                {
                    "evidence_type": EvidenceItem.EvidenceType.KEV_MATCH,
                    "title": "Fictional advisory linked to public website",
                    "description": (
                        "The demo vulnerability inventory contains a public-facing " "asset match."
                    ),
                    "source": "sample-data/open-civic-aid/vulnerability_inventory.csv",
                    "confidence": 0.66,
                },
                {
                    "title": "Confirm version and schedule patch review",
                    "description": (
                        "Validate the fictional product version and document a "
                        "remediation owner."
                    ),
                    "priority": ActionRecommendation.Priority.URGENT,
                },
            ),
        ]

        for risk_event, evidence_defaults, recommendation_defaults in evidence_specs:
            EvidenceItem.objects.update_or_create(
                organisation=organisation,
                risk_event=risk_event,
                title=evidence_defaults["title"],
                defaults={
                    **evidence_defaults,
                    "organisation": organisation,
                    "risk_event": risk_event,
                    "observed_at": timezone.now(),
                    "raw_reference": "",
                    "metadata": {"fictional": True},
                },
            )
            ActionRecommendation.objects.update_or_create(
                organisation=organisation,
                risk_event=risk_event,
                title=recommendation_defaults["title"],
                defaults={
                    **recommendation_defaults,
                    "organisation": organisation,
                    "risk_event": risk_event,
                    "status": ActionRecommendation.Status.OPEN,
                    "framework_mapping": {"nist_csf": ["Respond"]},
                },
            )

    def _seed_incidents(
        self,
        organisation: Organisation,
        users: dict[str, User],
        risk_events: dict[str, RiskEvent],
    ) -> list[Incident]:
        linked_event = risk_events["Suspicious login pattern requiring review"]
        incident, _ = Incident.objects.update_or_create(
            organisation=organisation,
            title="Review suspicious staff portal login",
            defaults={
                "description": "Fictional incident for reviewing a suspicious staff portal login.",
                "severity": Incident.Severity.HIGH,
                "status": Incident.Status.INVESTIGATING,
                "incident_type": Incident.IncidentType.SUSPECTED_ACCOUNT_COMPROMISE,
                "owner": users["analyst@opencivicaid.test"],
                "timeline_summary": "Initial review opened from a demo risk event.",
                "lessons_learned": "",
            },
        )
        incident.linked_risk_events.set([linked_event])

        timeline_specs = [
            {
                "entry_type": IncidentTimelineEntry.EntryType.ALERT_CREATED,
                "title": "Risk event linked to incident",
                "description": "Suspicious login pattern was linked for analyst review.",
                "actor": users["analyst@opencivicaid.test"],
            },
            {
                "entry_type": IncidentTimelineEntry.EntryType.NOTE_ADDED,
                "title": "Initial review note added",
                "description": (
                    "Analyst will verify whether the login was expected in the " "demo scenario."
                ),
                "actor": users["analyst@opencivicaid.test"],
            },
        ]

        for spec in timeline_specs:
            IncidentTimelineEntry.objects.update_or_create(
                organisation=organisation,
                incident=incident,
                title=spec["title"],
                defaults={
                    **spec,
                    "organisation": organisation,
                    "incident": incident,
                    "timestamp": timezone.now(),
                    "metadata": {"fictional": True},
                },
            )

        return [incident]
