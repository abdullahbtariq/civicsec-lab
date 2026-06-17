"""
Tests for Misinformation Observatory — pipeline basics and API permissions.
All tests use SQLite in-memory via civicsec.settings.test.
"""

import pytest
from django.contrib.auth import get_user_model

from apps.misinformation.models import (
    DiscourseDataset,
    EntityMention,
    KeywordBurst,
    NarrativeCluster,
    PublicPost,
)
from apps.misinformation.services.keyword_burst import detect_keyword_bursts
from apps.misinformation.services.pipeline import process_dataset
from apps.misinformation.services.sentiment import score_sentiment, score_toxicity
from apps.misinformation.services.text_processing import (
    clean_text,
    extract_domain,
    extract_hashtags,
    extract_mentions,
    tokenize,
)

User = get_user_model()

# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest.fixture
def org(db):
    from apps.organisations.models import Organisation

    return Organisation.objects.create(name="Test Org", slug="test-org")


@pytest.fixture
def admin_user(db, org):
    return User.objects.create_user(
        email="admin@test.org",
        password="pass",
        role="admin",
        organisation=org,
    )


@pytest.fixture
def analyst_user(db, org):
    return User.objects.create_user(
        email="analyst@test.org",
        password="pass",
        role="analyst",
        organisation=org,
    )


@pytest.fixture
def viewer_user(db, org):
    return User.objects.create_user(
        email="viewer@test.org",
        password="pass",
        role="viewer",
        organisation=org,
    )


@pytest.fixture
def dataset(db, org, admin_user):
    return DiscourseDataset.objects.create(
        organisation=org,
        uploaded_by=admin_user,
        original_filename="test_posts.csv",
    )


@pytest.fixture
def populated_dataset(db, dataset):
    """Dataset with 20 posts split into two narrative groups."""
    from datetime import datetime, timezone, timedelta

    base = datetime(2025, 1, 1, tzinfo=timezone.utc)

    positive_posts = [
        "Community coming together to support the new initiative. Great progress and hope ahead.",
        "Positive changes in civic engagement. Trust and transparency are improving.",
        "Good outcomes for the community project. We are building something meaningful together.",
        "The democratic process is working well. Accountability and openness matter.",
        "Volunteers making a real difference. Community spirit is strong and resilient.",
        "The commission released its report. Independent observers confirmed the results.",
        "Progress on civic inclusion. Equal access to the process is improving.",
        "Community leaders support the findings. Transparency builds public trust.",
        "Citizens engaged positively with the process. Democracy requires participation.",
        "Hopeful signs for the community. Coming together to solve shared problems.",
    ]

    hostile_posts = [
        "The whole thing is a scam and a lie. They are rigging everything against us. #Fraud",
        "Criminal conspiracy exposed. They destroyed the evidence. Outrage. #Stolen",
        "They are lying and cheating. The whole system is corrupt and rigged. #Fraud",
        "Traitors manipulating the public. Evil agenda being suppressed. Wake up. #Stolen",
        "Fraud and illegal activity confirmed. They stole everything. Fight back. #Fraud",
        "The conspiracy runs deep. They are hiding the truth from us. Dangerous lies.",
        "Our community was betrayed. They are toxic enemies of democracy. Criminal.",
        "The propaganda machine is in full swing. Do not believe their lies. #Stolen",
        "They destroyed evidence of massive fraud. We have proof. Share this now. #Fraud",
        "The regime is suppressing the truth. Outrage. Criminal behaviour. Wake up.",
    ]

    posts = []
    for i, text in enumerate(positive_posts):
        posts.append(
            PublicPost(
                dataset=dataset,
                post_id=f"p{i:04d}",
                timestamp=base + timedelta(hours=i),
                text=text,
                platform="TestPlatform",
            )
        )
    for i, text in enumerate(hostile_posts):
        posts.append(
            PublicPost(
                dataset=dataset,
                post_id=f"h{i:04d}",
                timestamp=base + timedelta(hours=10 + i),
                text=text,
                platform="HostileForum",
                engagement_count=50 + i * 10,
            )
        )

    PublicPost.objects.bulk_create(posts)
    dataset.row_count = len(posts)
    dataset.save(update_fields=["row_count"])
    return dataset


# ---------------------------------------------------------------------------
# Text processing
# ---------------------------------------------------------------------------


class TestTextProcessing:
    def test_clean_text_lowercases(self):
        assert clean_text("Hello World") == "hello world"

    def test_clean_text_removes_urls(self):
        result = clean_text("Check https://example.com for details")
        assert "https" not in result
        assert "example.com" not in result

    def test_clean_text_preserves_hashtags(self):
        result = clean_text("Join us #CivicAction today")
        assert "#civicaction" in result

    def test_clean_text_preserves_mentions(self):
        result = clean_text("Message @civic_org for help")
        assert "@civic_org" in result

    def test_tokenize_removes_stopwords(self):
        tokens = tokenize("the community is coming together for the greater good")
        assert "the" not in tokens
        assert "is" not in tokens
        assert "community" in tokens

    def test_extract_hashtags(self):
        tags = extract_hashtags("This is #important and #urgent too")
        assert "important" in tags
        assert "urgent" in tags

    def test_extract_mentions(self):
        mentions = extract_mentions("Reply to @alice and @bob")
        assert "alice" in mentions
        assert "bob" in mentions

    def test_extract_domain(self):
        assert extract_domain("https://example.org/path") == "example.org"
        assert extract_domain("") is None


# ---------------------------------------------------------------------------
# Sentiment scoring
# ---------------------------------------------------------------------------


class TestSentiment:
    def test_positive_text(self):
        score = score_sentiment("great community support hope trust freedom")
        assert score > 0

    def test_negative_text(self):
        score = score_sentiment("corrupt fraud lies dangerous conspiracy enemy")
        assert score < 0

    def test_empty_text(self):
        assert score_sentiment("") == 0.0

    def test_neutral_text(self):
        score = score_sentiment("the cat sat on the mat")
        assert score == 0.0

    def test_toxicity_zero_for_clean_text(self):
        assert score_toxicity("community working together peacefully") == 0.0

    def test_toxicity_elevated_for_hostile(self):
        score = score_toxicity("these idiots and morons are complete trash and garbage")
        assert score > 0.0


# ---------------------------------------------------------------------------
# Keyword burst detection
# ---------------------------------------------------------------------------


class TestKeywordBurst:
    def test_detects_burst(self, db, dataset):
        from datetime import datetime, timezone, timedelta

        base = datetime(2025, 1, 1, tzinfo=timezone.utc)
        posts = []
        # Baseline: 2 mentions of "fraud"
        for i in range(10):
            text = "fraud is happening" if i < 2 else "regular civic discussion today"
            posts.append(
                PublicPost(
                    dataset=dataset,
                    post_id=f"b{i}",
                    timestamp=base + timedelta(hours=i),
                    text=text,
                )
            )
        # Recent: 8 mentions of "fraud"
        for i in range(10, 20):
            text = "fraud fraud fraud everywhere" if i < 18 else "other discussion"
            posts.append(
                PublicPost(
                    dataset=dataset,
                    post_id=f"r{i}",
                    timestamp=base + timedelta(hours=i),
                    text=text,
                )
            )
        PublicPost.objects.bulk_create(posts)

        bursts = detect_keyword_bursts(PublicPost.objects.filter(dataset=dataset))
        keywords = [b["keyword"] for b in bursts]
        assert "fraud" in keywords

    def test_empty_posts(self):
        assert detect_keyword_bursts([]) == []


# ---------------------------------------------------------------------------
# Full pipeline
# ---------------------------------------------------------------------------


class TestPipeline:
    def test_pipeline_completes(self, db, populated_dataset):
        process_dataset(populated_dataset.id)
        populated_dataset.refresh_from_db()
        assert populated_dataset.processing_status == DiscourseDataset.ProcessingStatus.COMPLETE

    def test_pipeline_creates_clusters(self, db, populated_dataset):
        process_dataset(populated_dataset.id)
        assert NarrativeCluster.objects.filter(dataset=populated_dataset).count() >= 1

    def test_pipeline_flags_hostile_cluster(self, db, populated_dataset):
        process_dataset(populated_dataset.id)
        hostile = NarrativeCluster.objects.filter(
            dataset=populated_dataset,
            status=NarrativeCluster.ClusterStatus.NEEDS_REVIEW,
        )
        assert hostile.exists()

    def test_pipeline_cleans_post_text(self, db, populated_dataset):
        process_dataset(populated_dataset.id)
        posts = PublicPost.objects.filter(dataset=populated_dataset)
        for post in posts:
            assert post.cleaned_text != ""

    def test_pipeline_on_empty_dataset(self, db, dataset):
        """Pipeline should not crash on dataset with no posts."""
        process_dataset(dataset.id)
        dataset.refresh_from_db()
        assert dataset.processing_status == DiscourseDataset.ProcessingStatus.COMPLETE

    def test_pipeline_generates_risk_events(self, db, populated_dataset):
        from apps.risk.models import RiskEvent

        process_dataset(populated_dataset.id)
        risk_events = RiskEvent.objects.filter(
            organisation=populated_dataset.organisation,
            source_module="misinformation_observatory",
        )
        assert risk_events.exists()


# ---------------------------------------------------------------------------
# API — permissions
# ---------------------------------------------------------------------------


@pytest.mark.django_db
class TestObservatoryOverviewAPI:
    def test_authenticated_can_access(self, client, admin_user):
        client.force_login(admin_user)
        resp = client.get("/api/observatory/overview/")
        assert resp.status_code == 200

    def test_unauthenticated_blocked(self, client):
        resp = client.get("/api/observatory/overview/")
        assert resp.status_code in {401, 403}

    def test_returns_expected_keys(self, client, admin_user):
        client.force_login(admin_user)
        resp = client.get("/api/observatory/overview/")
        data = resp.json()
        assert "total_datasets" in data
        assert "total_clusters" in data
        assert "needs_review" in data


@pytest.mark.django_db
class TestDatasetUploadAPI:
    def test_admin_can_upload(self, client, admin_user):
        import io

        client.force_login(admin_user)
        csv_content = b"post_id,timestamp,author_id,platform,text\n1,2025-01-01T00:00:00Z,u1,TestNet,Hello civic world\n"
        f = io.BytesIO(csv_content)
        f.name = "test.csv"
        resp = client.post(
            "/api/observatory/datasets/",
            {"file": f},
            format="multipart",
        )
        assert resp.status_code == 201
        assert resp.json()["original_filename"] == "test.csv"

    def test_viewer_cannot_upload(self, client, viewer_user):
        import io

        client.force_login(viewer_user)
        csv_content = b"post_id,text\n1,Hello world\n"
        f = io.BytesIO(csv_content)
        f.name = "test.csv"
        resp = client.post(
            "/api/observatory/datasets/",
            {"file": f},
            format="multipart",
        )
        assert resp.status_code == 403

    def test_non_csv_rejected(self, client, admin_user):
        import io

        client.force_login(admin_user)
        f = io.BytesIO(b"not a csv")
        f.name = "test.txt"
        resp = client.post(
            "/api/observatory/datasets/",
            {"file": f},
            format="multipart",
        )
        assert resp.status_code == 400


@pytest.mark.django_db
class TestClusterReviewAPI:
    def test_analyst_can_review(self, client, analyst_user, db, populated_dataset):
        process_dataset(populated_dataset.id)
        cluster = NarrativeCluster.objects.filter(dataset=populated_dataset).first()
        assert cluster is not None
        client.force_login(analyst_user)
        resp = client.patch(
            f"/api/observatory/clusters/{cluster.id}/review/",
            {"status": "reviewed_benign", "review_notes": "No credible concern found."},
            content_type="application/json",
        )
        assert resp.status_code == 200
        cluster.refresh_from_db()
        assert cluster.status == NarrativeCluster.ClusterStatus.REVIEWED_BENIGN

    def test_viewer_cannot_review(self, client, viewer_user, db, populated_dataset):
        process_dataset(populated_dataset.id)
        cluster = NarrativeCluster.objects.filter(dataset=populated_dataset).first()
        assert cluster is not None
        client.force_login(viewer_user)
        resp = client.patch(
            f"/api/observatory/clusters/{cluster.id}/review/",
            {"status": "reviewed_benign"},
            content_type="application/json",
        )
        assert resp.status_code == 403

    def test_cross_org_cluster_not_accessible(self, client, db):
        from apps.organisations.models import Organisation

        other_org = Organisation.objects.create(name="Other Org", slug="other-org")
        other_user = User.objects.create_user(
            email="other@test.org", password="pass", role="admin", organisation=other_org
        )
        other_dataset = DiscourseDataset.objects.create(
            organisation=other_org,
            original_filename="other.csv",
        )
        other_cluster = NarrativeCluster.objects.create(
            dataset=other_dataset,
            title="Other cluster",
            cluster_size=5,
        )

        # Admin from first org should not be able to review other org's cluster
        from apps.organisations.models import Organisation as Org

        own_org = Org.objects.create(name="Own Org", slug="own-org")
        own_user = User.objects.create_user(
            email="own@test.org", password="pass", role="admin", organisation=own_org
        )
        client.force_login(own_user)
        resp = client.patch(
            f"/api/observatory/clusters/{other_cluster.id}/review/",
            {"status": "reviewed_benign"},
            content_type="application/json",
        )
        assert resp.status_code in {403, 404}


# ---------------------------------------------------------------------------
# Multilingual handling (language detection + translation routing)
# ---------------------------------------------------------------------------


class TestMultilingual:
    """
    The pipeline detects each post's language and translates only the
    non-English posts (the translator auto-detects each). These tests lock that
    routing in without hitting the network — translation itself is monkeypatched.
    """

    _FR = "Le gouvernement nous ment et cache la vérité au public chaque jour."
    _ES = "El gobierno nos miente y oculta la verdad al público todos los días."
    _EN = "The government is lying to us and hiding the truth from everyone."

    def test_detect_dominant_language(self):
        pytest.importorskip("langdetect")
        from apps.misinformation.services.language import detect_dataset_language

        assert detect_dataset_language([self._FR, self._FR, self._EN]) == "fr"
        assert detect_dataset_language([self._ES, self._ES, self._EN]) == "es"
        assert detect_dataset_language([self._EN, self._EN]) == "en"

    def test_detect_is_deterministic(self):
        pytest.importorskip("langdetect")
        from apps.misinformation.services.language import detect_languages

        corpus = [self._FR, self._ES, self._EN]
        assert detect_languages(corpus) == detect_languages(corpus)

    def test_english_corpus_makes_no_translation_call(self, monkeypatch):
        from apps.misinformation.services import language

        def fail(*args, **kwargs):
            raise AssertionError("English corpus must not be translated")

        monkeypatch.setattr(language, "translate_to_english", fail)
        prepared, dominant = language.prepare_for_sentiment([self._EN, self._EN])
        assert dominant == "en"
        assert prepared == [self._EN, self._EN]

    def test_mixed_corpus_translates_only_non_english(self, monkeypatch):
        pytest.importorskip("langdetect")
        from apps.misinformation.services import language

        captured = {}

        def fake_translate(texts, source_lang="auto"):
            captured["texts"] = list(texts)
            captured["source"] = source_lang
            return [f"TRANSLATED::{t}" for t in texts]

        monkeypatch.setattr(language, "translate_to_english", fake_translate)
        prepared, dominant = language.prepare_for_sentiment([self._EN, self._FR, self._ES])

        # English post untouched; the two non-English posts routed through translation.
        assert prepared[0] == self._EN
        assert prepared[1] == f"TRANSLATED::{self._FR}"
        assert prepared[2] == f"TRANSLATED::{self._ES}"
        # "auto" source lets the translator detect each post independently.
        assert captured["source"] == "auto"
        assert captured["texts"] == [self._FR, self._ES]
