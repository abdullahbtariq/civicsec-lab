"""
Synthetic login log generator for LogLens.

Generates realistic-looking but entirely fictional login event data
for the Open Civic Aid demo organisation. All identifiers, IPs,
locations, and patterns are fabricated.
"""

import random
import uuid
from datetime import timedelta

from django.utils import timezone

from apps.loglens.models import LoginEvent

# ---------------------------------------------------------------------------
# Fictional demo data — no real people, IPs, or organisations
# ---------------------------------------------------------------------------

DEMO_USERS = [
    "alice.morgan@opencivicaid.test",
    "ben.okafor@opencivicaid.test",
    "carla.reyes@opencivicaid.test",
    "dan.novak@opencivicaid.test",
    "elena.walsh@opencivicaid.test",
]

DEMO_DEVICES = {
    "alice.morgan@opencivicaid.test": ["device-a1", "device-a2"],
    "ben.okafor@opencivicaid.test": ["device-b1"],
    "carla.reyes@opencivicaid.test": ["device-c1", "device-c2"],
    "dan.novak@opencivicaid.test": ["device-d1"],
    "elena.walsh@opencivicaid.test": ["device-e1"],
}

NORMAL_LOCATIONS = {
    "alice.morgan@opencivicaid.test": ("GB", "London"),
    "ben.okafor@opencivicaid.test": ("NG", "Lagos"),
    "carla.reyes@opencivicaid.test": ("ES", "Madrid"),
    "dan.novak@opencivicaid.test": ("CZ", "Prague"),
    "elena.walsh@opencivicaid.test": ("US", "New York"),
}

SENSITIVE_RESOURCES = [
    "election-monitoring-dataset",
    "volunteer-database",
    "internal-research-repo",
]

NORMAL_RESOURCES = [
    "staff-portal-dashboard",
    "email-client",
    "public-website-cms",
    "shared-calendar",
]

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 14) AppleWebKit/605.1 Safari/604.1",
    "Mozilla/5.0 (X11; Linux x86_64; rv:121.0) Gecko/20100101 Firefox/121.0",
]


def _random_ip(country: str) -> str:
    """Return a fictional IP-looking string for the given country."""
    prefixes = {"GB": "82.", "NG": "197.", "ES": "83.", "CZ": "89.", "US": "104.", "RU": "91."}
    prefix = prefixes.get(country, "10.")
    return f"{prefix}{random.randint(1, 254)}.{random.randint(1, 254)}.{random.randint(1, 254)}"


def _normal_event(
    organisation,
    user: str,
    base_time,
    batch_id: str,
    offset_minutes: int = 0,
) -> LoginEvent:
    country, city = NORMAL_LOCATIONS[user]
    device = random.choice(DEMO_DEVICES[user])
    ts = base_time + timedelta(minutes=offset_minutes)
    return LoginEvent(
        organisation=organisation,
        user_identifier=user,
        timestamp=ts,
        ip_address=_random_ip(country),
        country=country,
        city=city,
        device_id=device,
        user_agent=random.choice(USER_AGENTS),
        event_type=LoginEvent.EventType.LOGIN_SUCCESS,
        success=True,
        resource_accessed=random.choice(NORMAL_RESOURCES),
        upload_batch=batch_id,
    )


# ---------------------------------------------------------------------------
# Scenario generators — each plants a detectable anomaly pattern
# ---------------------------------------------------------------------------


def _scenario_failed_burst(organisation, base_time: object, batch_id: str) -> list[LoginEvent]:
    """Plant: 6 failed logins for carla.reyes within 8 minutes, then success."""
    user = "carla.reyes@opencivicaid.test"
    country, city = NORMAL_LOCATIONS[user]
    device = DEMO_DEVICES[user][0]
    events = []
    for i in range(6):
        events.append(
            LoginEvent(
                organisation=organisation,
                user_identifier=user,
                timestamp=base_time + timedelta(minutes=i * 1.3),
                ip_address="185.220.101.55",  # fictional attacker IP
                country="NL",
                city="Amsterdam",
                device_id="unknown-device-x",
                user_agent=USER_AGENTS[0],
                event_type=LoginEvent.EventType.LOGIN_FAILED,
                success=False,
                resource_accessed="",
                upload_batch=batch_id,
            )
        )
    # Successful login shortly after from normal location
    events.append(
        LoginEvent(
            organisation=organisation,
            user_identifier=user,
            timestamp=base_time + timedelta(minutes=10),
            ip_address=_random_ip(country),
            country=country,
            city=city,
            device_id=device,
            user_agent=USER_AGENTS[1],
            event_type=LoginEvent.EventType.LOGIN_SUCCESS,
            success=True,
            resource_accessed=SENSITIVE_RESOURCES[1],
            upload_batch=batch_id,
        )
    )
    return events


def _scenario_impossible_travel(organisation, base_time: object, batch_id: str) -> list[LoginEvent]:
    """Plant: ben.okafor logs in from Lagos then from Moscow 45 minutes later."""
    user = "ben.okafor@opencivicaid.test"
    device = DEMO_DEVICES[user][0]
    events = [
        LoginEvent(
            organisation=organisation,
            user_identifier=user,
            timestamp=base_time,
            ip_address=_random_ip("NG"),
            country="NG",
            city="Lagos",
            device_id=device,
            user_agent=USER_AGENTS[0],
            event_type=LoginEvent.EventType.LOGIN_SUCCESS,
            success=True,
            resource_accessed="staff-portal-dashboard",
            upload_batch=batch_id,
        ),
        LoginEvent(
            organisation=organisation,
            user_identifier=user,
            timestamp=base_time + timedelta(minutes=45),
            ip_address=_random_ip("RU"),
            country="RU",
            city="Moscow",
            device_id="device-unknown-ru",
            user_agent=USER_AGENTS[2],
            event_type=LoginEvent.EventType.LOGIN_SUCCESS,
            success=True,
            resource_accessed=SENSITIVE_RESOURCES[0],
            upload_batch=batch_id,
        ),
    ]
    return events


def _scenario_new_device(organisation, base_time: object, batch_id: str) -> list[LoginEvent]:
    """Plant: dan.novak logs in from a brand-new device at an unusual hour."""
    user = "dan.novak@opencivicaid.test"
    country, city = NORMAL_LOCATIONS[user]
    return [
        LoginEvent(
            organisation=organisation,
            user_identifier=user,
            timestamp=base_time.replace(hour=3, minute=17),
            ip_address=_random_ip(country),
            country=country,
            city=city,
            device_id="device-new-unknown-99",
            user_agent=USER_AGENTS[2],
            event_type=LoginEvent.EventType.LOGIN_SUCCESS,
            success=True,
            resource_accessed="staff-portal-dashboard",
            upload_batch=batch_id,
        )
    ]


def _scenario_unusual_time(organisation, base_time: object, batch_id: str) -> list[LoginEvent]:
    """Plant: alice.morgan logs in at 02:45 local time."""
    user = "alice.morgan@opencivicaid.test"
    country, city = NORMAL_LOCATIONS[user]
    device = DEMO_DEVICES[user][0]
    return [
        LoginEvent(
            organisation=organisation,
            user_identifier=user,
            timestamp=base_time.replace(hour=2, minute=45),
            ip_address=_random_ip(country),
            country=country,
            city=city,
            device_id=device,
            user_agent=USER_AGENTS[0],
            event_type=LoginEvent.EventType.LOGIN_SUCCESS,
            success=True,
            resource_accessed=random.choice(SENSITIVE_RESOURCES),
            upload_batch=batch_id,
        )
    ]


# ---------------------------------------------------------------------------
# Public entry point
# ---------------------------------------------------------------------------


def generate_synthetic_logs(
    organisation,
    days_back: int = 7,
    clear_existing: bool = False,
) -> dict:
    """
    Generate a batch of synthetic login events for the given organisation.

    Returns a summary dict with counts by scenario.
    """
    if clear_existing:
        LoginEvent.objects.filter(organisation=organisation).delete()

    batch_id = str(uuid.uuid4())[:8]
    now = timezone.now()
    events: list[LoginEvent] = []

    # Normal baseline — each user logs in once per day over the period
    for day_offset in range(days_back):
        base = now - timedelta(days=day_offset)
        # Pick a working hour between 8am and 6pm
        hour = random.randint(8, 18)
        base = base.replace(hour=hour, minute=random.randint(0, 59), second=0, microsecond=0)
        for user in DEMO_USERS:
            events.append(_normal_event(organisation, user, base, batch_id))

    # Anomaly scenarios — seeded 2 days ago
    scenario_base = now - timedelta(days=2)
    scenario_base = scenario_base.replace(hour=14, minute=0, second=0, microsecond=0)

    burst_events = _scenario_failed_burst(organisation, scenario_base, batch_id)
    travel_events = _scenario_impossible_travel(
        organisation, scenario_base + timedelta(hours=1), batch_id
    )
    device_events = _scenario_new_device(organisation, scenario_base + timedelta(hours=2), batch_id)
    time_events = _scenario_unusual_time(organisation, scenario_base + timedelta(hours=3), batch_id)

    events.extend(burst_events)
    events.extend(travel_events)
    events.extend(device_events)
    events.extend(time_events)

    LoginEvent.objects.bulk_create(events)

    return {
        "batch_id": batch_id,
        "total_created": len(events),
        "normal_events": len(events)
        - len(burst_events)
        - len(travel_events)
        - len(device_events)
        - len(time_events),
        "scenario_failed_burst": len(burst_events),
        "scenario_impossible_travel": len(travel_events),
        "scenario_new_device": len(device_events),
        "scenario_unusual_time": len(time_events),
    }
