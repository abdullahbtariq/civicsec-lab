"""
Management command: seed_observatory

Creates a fictional DiscourseDataset for the demo organisation
("Open Civic Aid") with realistic-looking but entirely fictional posts,
then runs the NLP pipeline on it.

Usage:
    python manage.py seed_observatory
    python manage.py seed_observatory --clear   # delete existing demo dataset first
"""

import csv
import io
import random
from datetime import UTC, datetime, timedelta

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from apps.misinformation.models import DiscourseDataset
from apps.misinformation.services.csv_ingest import ingest_csv
from apps.misinformation.services.pipeline import process_dataset
from apps.organisations.models import Organisation

User = get_user_model()

# ---------------------------------------------------------------------------
# Fictional post corpus — entirely made-up scenario:
# "Northgate Election Integrity Commission" (NEIC) — a fictional civic body
# announcing election results that triggers a surge of hostile discourse.
# ---------------------------------------------------------------------------

_PLATFORMS = ["TownSquare", "CivicSpace", "NorthNet", "PublicForum", "CivicTalk"]

_AUTHOR_IDS = [f"user_{i:04d}" for i in range(1, 80)]

# Cluster A: general civic discussion (neutral / positive)
_CLUSTER_A = [
    "The Northgate Election Integrity Commission has released its preliminary report today.",
    "NEIC annual report out — transparency is improving according to independent observers.",
    "Looking forward to reviewing the NEIC findings on ballot access and voter turnout.",
    "Community organisations welcome the NEIC report and call for continued engagement.",
    "Good to see the NEIC publishing full audit trails. Democracy needs this kind of accountability.",
    "Civic groups praise the NEIC for its open consultation process this cycle.",
    "The commission's public portal is live. Everyone should review the findings.",
    "Fair elections depend on independent verification. Thank you NEIC for the report.",
    "Transparency in electoral processes builds public trust. NEIC doing important work.",
    "Volunteers who helped with the NEIC observation process deserve recognition.",
    "The NEIC report highlights areas for improvement — a healthy democratic signal.",
    "Important civic milestone: NEIC confirms no material irregularities in the count.",
    "Cross-party observers signed off on the NEIC process. This matters.",
    "Access to the ballot should be equal for everyone. NEIC report confirms progress.",
    "Reading through the NEIC report — detailed and reassuring.",
    "Community trust in the process strengthens democratic resilience.",
    "NEIC independent auditors confirmed the count accuracy to four decimal places.",
    "Open Civic Aid shares the NEIC report summary with its network.",
    "Civic education is key. More people should read the NEIC report.",
    "The NEIC public dashboard is a great step toward electoral transparency.",
]

# Cluster B: hostile narrative around the NEIC ("stolen", "rigged", growing rapidly)
_CLUSTER_B = [
    "The NEIC report is a cover-up. They are hiding the real numbers. #NEICSham",
    "How can anyone trust the NEIC? This election was stolen from the people. #StopTheSteal",
    "NEIC rigged the count. We have proof. Share this before it gets censored. #NEICSham",
    "The regime's puppet commission published fake results again. Outrage. #NEICSham",
    "Do not believe the NEIC lies. They silenced our observers. Criminal fraud. #StopTheSteal",
    "NEIC = corrupt conspiracy. The real vote totals are being suppressed. Wake up! #NEICSham",
    "They destroyed the ballots. The NEIC is part of the coverup. Traitors. #NEICSham",
    "Share everywhere: NEIC rigged results exposed. The truth is being suppressed. #StopTheSteal",
    "Our community was targeted. The NEIC silenced legitimate voters. Outrage. #NEICSham",
    "The NEIC propaganda machine is in full operation. We reject their fraudulent report.",
    "Stolen election — NEIC colluding with bad actors. The evidence is overwhelming. #StopTheSteal",
    "NEIC report is dangerous hoax. They are manipulating the public. #NEICSham",
    "The takeover is complete. NEIC destroyed democracy today. Fight back. #StopTheSteal",
    "Regime infiltrated the NEIC long ago. This is their final betrayal. #NEICSham",
    "Criminal NEIC members should be prosecuted. This is fraud. Illegal. #StopTheSteal",
    "I watched the count. It was rigged. NEIC is lying to everyone. #NEICSham",
    "The conspiracy runs deep. NEIC is just the latest puppet body. Wake up people.",
    "Share this: NEIC ballot destruction confirmed by anonymous source. Spread the word. #NEICSham",
    "Our voices were stolen. The NEIC is covering it up. This is an invasion of democracy.",
    "NEIC propaganda. Every word is a lie. The election was completely rigged. #StopTheSteal",
    "This is the most corrupt commission in history. NEIC must be disbanded. #NEICSham",
    "Anonymous whistleblower says NEIC shredded thousands of ballots. Share now.",
    "The NEIC report was written before votes were counted. Pure fabrication. Outrage.",
]

# Cluster C: coordinated-looking repetitive messages (keyword burst on "#CivicAlert")
_CLUSTER_C = [
    "URGENT: Share this #CivicAlert — NEIC observers blocked from counting rooms.",
    "This is a #CivicAlert — demand transparency from NEIC immediately.",
    "#CivicAlert spreading fast — observers confirm irregularities in district 7.",
    "Have you seen the #CivicAlert from district 12? Share before censored.",
    "#CivicAlert level 3 — coordinated blocking of legitimate vote watchers.",
    "Repost this #CivicAlert immediately. Time is running out.",
    "#CivicAlert confirmed by three independent sources. The cover-up is real.",
    "Spreading #CivicAlert — mass vote suppression happening now.",
    "NEIC shutting down #CivicAlert accounts. Proof of censorship.",
    "#CivicAlert this is not a drill. Share with everyone in your network.",
    "Don't let them silence the #CivicAlert movement. We see what's happening.",
    "#CivicAlert: anonymous tip says results will be changed overnight.",
    "The #CivicAlert cannot be stopped. Truth will come out.",
    "#CivicAlert being suppressed on platforms. Share while you can.",
    "Our #CivicAlert network is growing. The truth is spreading.",
]

# Cluster D: calls for calm / counter-narrative (positive / factual)
_CLUSTER_D = [
    "Please verify information before sharing. The NEIC results have been independently audited.",
    "Fact check: no evidence of ballot destruction. Multiple independent observers confirmed the count.",
    "Spreading unverified claims about elections can harm communities. Please check sources.",
    "The NEIC process was observed by all parties. Claims of fraud have been reviewed and rejected.",
    "Community leaders urge calm. The electoral process was transparent and properly documented.",
    "Independent media reviewed the NEIC audit trail. The claims circulating online are inaccurate.",
    "Before sharing viral posts about the election, please check if they have been fact-checked.",
    "Election integrity matters — and so does accurate information. Check the NEIC official site.",
    "Unverified viral claims are damaging community trust. Share verified information only.",
    "Multiple civic organisations have confirmed the NEIC findings are accurate.",
    "Open Civic Aid urges followers to rely on verified sources during this period.",
    "The democratic process depends on accurate information. Do not spread unverified claims.",
]


def _random_ts(base: datetime, delta_hours: float) -> str:
    jitter = random.uniform(0, delta_hours * 3600)
    dt = base + timedelta(seconds=jitter)
    return dt.strftime("%Y-%m-%dT%H:%M:%SZ")


def _build_csv() -> bytes:
    """Generate a fictional public_posts CSV as bytes."""
    random.seed(42)
    base_ts = datetime(2025, 10, 14, 8, 0, 0, tzinfo=UTC)
    rows: list[dict] = []
    post_counter = 1

    def add_cluster(posts, count, platform_bias, ts_delta, engagement_range):
        nonlocal post_counter
        for _ in range(count):
            text = random.choice(posts)
            # Add some variation
            if random.random() < 0.3:
                text = text + " " + random.choice(["Thoughts?", "Discuss.", "Share widely.", "Important!"])
            rows.append(
                {
                    "post_id": f"p{post_counter:06d}",
                    "timestamp": _random_ts(base_ts, ts_delta),
                    "author_id": random.choice(_AUTHOR_IDS),
                    "platform": random.choice(platform_bias),
                    "text": text,
                    "url": "",
                    "engagement_count": random.randint(*engagement_range),
                    "reply_to": "",
                    "shared_url": "",
                }
            )
            post_counter += 1

    # Cluster A: early phase, broad platform spread
    add_cluster(_CLUSTER_A, 40, _PLATFORMS, 4, (1, 20))
    # Cluster B: hostile narrative — grows rapidly in second half of timeline
    add_cluster(_CLUSTER_B, 25, ["TownSquare", "NorthNet"], 6, (10, 200))
    add_cluster(_CLUSTER_B, 35, ["TownSquare", "CivicTalk"], 10, (20, 500))  # burst
    # Cluster C: coordinated-looking repeated phrases — spike in later period
    add_cluster(_CLUSTER_C, 10, ["NorthNet"], 8, (5, 50))
    add_cluster(_CLUSTER_C, 30, ["NorthNet", "CivicTalk"], 11, (5, 80))  # burst
    # Cluster D: counter-narrative, calmer tone
    add_cluster(_CLUSTER_D, 30, _PLATFORMS, 12, (1, 30))

    # Shuffle
    random.shuffle(rows)

    buf = io.StringIO()
    writer = csv.DictWriter(
        buf,
        fieldnames=["post_id", "timestamp", "author_id", "platform", "text",
                    "url", "engagement_count", "reply_to", "shared_url"],
    )
    writer.writeheader()
    writer.writerows(rows)
    return buf.getvalue().encode("utf-8")


class Command(BaseCommand):
    help = "Seed a fictional DiscourseDataset for the demo organisation and run the Observatory pipeline."

    def add_arguments(self, parser):
        parser.add_argument("--clear", action="store_true", help="Delete existing demo dataset before seeding.")
        parser.add_argument("--org-slug", default="open-civic-aid", help="Organisation slug (default: open-civic-aid).")

    def handle(self, *args, **options):
        try:
            org = Organisation.objects.get(slug=options["org_slug"])
        except Organisation.DoesNotExist:
            self.stderr.write(f"Organisation '{options['org_slug']}' not found. Run seed_demo first.")
            return

        if options["clear"]:
            deleted, _ = DiscourseDataset.objects.filter(
                organisation=org, original_filename="public_posts_demo.csv"
            ).delete()
            self.stdout.write(f"Cleared {deleted} existing demo dataset(s).")

        if DiscourseDataset.objects.filter(
            organisation=org, original_filename="public_posts_demo.csv"
        ).exists():
            self.stdout.write("Demo dataset already exists. Use --clear to re-seed.")
            return

        admin_user = User.objects.filter(organisation=org, role="admin").first()

        self.stdout.write("Building fictional public_posts_demo.csv …")
        csv_bytes = _build_csv()

        dataset = DiscourseDataset.objects.create(
            organisation=org,
            uploaded_by=admin_user,
            original_filename="public_posts_demo.csv",
            description=(
                "Fictional demo dataset: public discourse around the Northgate Election "
                "Integrity Commission (NEIC) report. All posts, authors, and events are "
                "entirely fictional and created for demonstration purposes."
            ),
            retention_policy=DiscourseDataset.RetentionPolicy.MEDIUM,
        )

        row_count = ingest_csv(dataset, csv_bytes)
        self.stdout.write(f"Ingested {row_count} fictional posts.")

        self.stdout.write("Running NLP pipeline …")
        process_dataset(dataset.id)
        dataset.refresh_from_db()

        self.stdout.write(
            self.style.SUCCESS(
                f"Observatory seeded: dataset #{dataset.id} | "
                f"{row_count} posts | "
                f"{dataset.clusters.count()} clusters | "
                f"{dataset.keyword_bursts.count()} keyword bursts"
            )
        )
