"""
IncidentFlow — built-in playbook templates.

Call seed_builtin_playbooks() once (e.g. from a management command or migration)
to populate the system-level PlaybookTemplate + PlaybookStep records.
Idempotent: skips templates that already exist by name.
"""

from apps.incidents.models import PlaybookStep, PlaybookTemplate

BUILTIN_PLAYBOOKS = [
    {
        "name": "Vulnerability Exposure Response",
        "description": (
            "Standard response workflow for a discovered vulnerability affecting "
            "civic infrastructure or digital assets."
        ),
        "incident_type": "vulnerability_exposure",
        "steps": [
            {
                "order": 1,
                "title": "Confirm scope and affected assets",
                "description": (
                    "Identify all systems, services, and data stores potentially affected "
                    "by the vulnerability. Link relevant assets to this incident."
                ),
                "estimated_minutes": 30,
            },
            {
                "order": 2,
                "title": "Assess exploitability and impact",
                "description": (
                    "Review CVSS score, EPSS probability, and known exploitation status. "
                    "Determine if active exploitation is occurring."
                ),
                "estimated_minutes": 20,
            },
            {
                "order": 3,
                "title": "Apply patch or temporary mitigation",
                "description": (
                    "Apply vendor patch if available. If not, implement a temporary "
                    "workaround (WAF rule, network isolation, feature disable)."
                ),
                "estimated_minutes": 60,
            },
            {
                "order": 4,
                "title": "Verify remediation",
                "description": (
                    "Confirm the patch or mitigation is effective. Run a targeted scan "
                    "or review logs to verify the vulnerability is no longer exploitable."
                ),
                "estimated_minutes": 20,
            },
            {
                "order": 5,
                "title": "Notify stakeholders",
                "description": (
                    "Communicate status to relevant stakeholders: affected teams, "
                    "leadership, and any affected third parties if required."
                ),
                "estimated_minutes": 15,
            },
            {
                "order": 6,
                "title": "Document lessons learned and close",
                "description": (
                    "Record timeline summary, lessons learned, and any process "
                    "improvements. Update incident status to Resolved or Closed."
                ),
                "estimated_minutes": 20,
            },
        ],
    },
    {
        "name": "Suspected Account Compromise Response",
        "description": (
            "Response workflow for a suspected or confirmed compromise of a user "
            "account within a civic organisation."
        ),
        "incident_type": "suspected_account_compromise",
        "steps": [
            {
                "order": 1,
                "title": "Suspend or isolate the affected account",
                "description": (
                    "Immediately disable or lock the suspected account to prevent "
                    "further unauthorised access. Preserve audit logs."
                ),
                "estimated_minutes": 10,
            },
            {
                "order": 2,
                "title": "Review access and audit logs",
                "description": (
                    "Examine login history, accessed resources, and data exports. "
                    "Identify the initial compromise vector and any lateral movement."
                ),
                "estimated_minutes": 45,
            },
            {
                "order": 3,
                "title": "Reset credentials and revoke sessions",
                "description": (
                    "Force password reset, revoke all active sessions and API tokens, "
                    "and enforce MFA re-enrolment."
                ),
                "estimated_minutes": 15,
            },
            {
                "order": 4,
                "title": "Check for lateral movement",
                "description": (
                    "Determine if the attacker accessed other accounts, systems, "
                    "or exported sensitive data during the compromise window."
                ),
                "estimated_minutes": 30,
            },
            {
                "order": 5,
                "title": "Notify the affected user and relevant parties",
                "description": (
                    "Inform the account owner, HR, and leadership as appropriate. "
                    "Consider regulatory notification obligations if data was accessed."
                ),
                "estimated_minutes": 20,
            },
            {
                "order": 6,
                "title": "Harden defences and close",
                "description": (
                    "Review and tighten access controls, MFA policies, and anomaly "
                    "detection rules. Document findings and close incident."
                ),
                "estimated_minutes": 30,
            },
        ],
    },
    {
        "name": "Data Privacy Incident Response",
        "description": (
            "Response workflow for a data privacy issue, including potential "
            "personal data exposure or unlawful processing."
        ),
        "incident_type": "data_privacy_issue",
        "steps": [
            {
                "order": 1,
                "title": "Contain the exposure",
                "description": (
                    "Stop any ongoing data exposure: revoke access, remove public files, "
                    "or close the API endpoint responsible for the leak."
                ),
                "estimated_minutes": 20,
            },
            {
                "order": 2,
                "title": "Identify affected data and individuals",
                "description": (
                    "Determine the type of personal data involved, how many individuals "
                    "are affected, and the sensitivity of the data."
                ),
                "estimated_minutes": 40,
            },
            {
                "order": 3,
                "title": "Assess regulatory obligations",
                "description": (
                    "Determine if the incident triggers notification obligations under "
                    "GDPR, UK DPA, or other applicable data protection law. "
                    "72-hour clock may apply."
                ),
                "estimated_minutes": 30,
            },
            {
                "order": 4,
                "title": "Notify the Data Protection Officer",
                "description": (
                    "Brief the DPO with full incident details. "
                    "The DPO leads regulatory notification decisions."
                ),
                "estimated_minutes": 15,
            },
            {
                "order": 5,
                "title": "Draft and send notifications",
                "description": (
                    "If required, notify the supervisory authority and affected individuals "
                    "within required timeframes. Keep records of all notifications sent."
                ),
                "estimated_minutes": 60,
            },
            {
                "order": 6,
                "title": "Remediate root cause and close",
                "description": (
                    "Fix the technical or process failure that caused the incident. "
                    "Update the privacy impact assessment and document lessons learned."
                ),
                "estimated_minutes": 30,
            },
        ],
    },
    {
        "name": "Online Harm Escalation Response",
        "description": (
            "Response workflow for online harm affecting civic actors, staff, "
            "or communities (coordinated harassment, disinformation, threats)."
        ),
        "incident_type": "online_harm_escalation",
        "steps": [
            {
                "order": 1,
                "title": "Document and preserve evidence",
                "description": (
                    "Screenshot, archive, and hash all harmful content before it is "
                    "removed. Record URLs, accounts, timestamps, and engagement metrics."
                ),
                "estimated_minutes": 30,
            },
            {
                "order": 2,
                "title": "Assess scope and threat level",
                "description": (
                    "Determine whether the harm is isolated or coordinated, whether "
                    "physical safety is at risk, and how many people are affected."
                ),
                "estimated_minutes": 20,
            },
            {
                "order": 3,
                "title": "Report to platform and/or authorities",
                "description": (
                    "Submit platform reports for policy violations. If credible threats "
                    "exist, contact law enforcement. For disinformation, engage "
                    "fact-checking partners."
                ),
                "estimated_minutes": 45,
            },
            {
                "order": 4,
                "title": "Support affected individuals",
                "description": (
                    "Provide pastoral support, temporary comms guidance, and connect "
                    "affected staff or community members with appropriate resources."
                ),
                "estimated_minutes": 30,
            },
            {
                "order": 5,
                "title": "Review safeguarding policies",
                "description": (
                    "Assess whether existing safeguarding, social media, and crisis comms "
                    "policies were sufficient. Identify gaps."
                ),
                "estimated_minutes": 30,
            },
            {
                "order": 6,
                "title": "Document and close",
                "description": (
                    "Record outcome, platform/authority responses, policy changes made, "
                    "and lessons learned. Close incident when harm is resolved."
                ),
                "estimated_minutes": 20,
            },
        ],
    },
    {
        "name": "General Incident Response",
        "description": "A generic five-step response workflow for any type of incident.",
        "incident_type": "",
        "steps": [
            {
                "order": 1,
                "title": "Acknowledge, triage, and assign",
                "description": (
                    "Confirm the incident is real, assign an owner, set severity, "
                    "and notify relevant stakeholders."
                ),
                "estimated_minutes": 15,
            },
            {
                "order": 2,
                "title": "Investigate and scope",
                "description": (
                    "Gather evidence, identify affected systems or people, "
                    "and establish the timeline of events."
                ),
                "estimated_minutes": 60,
            },
            {
                "order": 3,
                "title": "Contain and mitigate",
                "description": (
                    "Take immediate action to prevent further impact. "
                    "Apply short-term fixes while longer remediation is planned."
                ),
                "estimated_minutes": 45,
            },
            {
                "order": 4,
                "title": "Communicate",
                "description": (
                    "Update stakeholders with findings and actions taken. "
                    "Communicate externally if required."
                ),
                "estimated_minutes": 20,
            },
            {
                "order": 5,
                "title": "Verify resolution and close",
                "description": (
                    "Confirm the incident is fully resolved. "
                    "Document timeline summary, lessons learned, and close."
                ),
                "estimated_minutes": 30,
            },
        ],
    },
]


def seed_builtin_playbooks() -> int:
    """
    Create built-in PlaybookTemplate + PlaybookStep records.
    Skips any template whose name already exists as a built-in.
    Returns the number of templates created.
    """
    existing = set(PlaybookTemplate.objects.filter(is_builtin=True).values_list("name", flat=True))
    created = 0
    for pb in BUILTIN_PLAYBOOKS:
        if pb["name"] in existing:
            continue
        template = PlaybookTemplate.objects.create(
            organisation=None,
            name=pb["name"],
            description=pb["description"],
            incident_type=pb["incident_type"],
            is_builtin=True,
        )
        PlaybookStep.objects.bulk_create(
            [PlaybookStep(template=template, **step) for step in pb["steps"]]
        )
        created += 1
    return created
