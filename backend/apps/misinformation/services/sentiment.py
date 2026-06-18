"""
VADER-based sentiment and toxicity scoring for discourse analysis.

Uses NLTK VADER (Valence Aware Dictionary and sEntiment Reasoner), designed
specifically for social-media and short-form discourse text.

Advantages over simple word-counting:
  - Negation:      "not good"      → negative, not neutral
  - Intensifiers:  "very bad"      → more negative than "bad"
  - Capitalisation: "TERRIBLE"     → stronger negative signal
  - Punctuation:   "great!!!"      → stronger positive signal
  - Conjunctions:  "great but bad" → compound score weighs both sides
  - Coverage:      7,500+ word-feature rules vs. our 100-word fallback list

The lexicon fallback below is kept as a silent last resort in case the
NLTK data file is somehow missing at runtime — the pipeline will never
hard-fail, just degrade gracefully.
"""

from __future__ import annotations

import logging

logger = logging.getLogger(__name__)

# ── VADER singleton ──────────────────────────────────────────────────────────
# Loaded once per worker process; None if NLTK is unavailable.

_sia = None
_sia_loaded = False


def _load_sia():
    global _sia, _sia_loaded
    if _sia_loaded:
        return _sia
    _sia_loaded = True
    try:
        from nltk.sentiment.vader import SentimentIntensityAnalyzer  # type: ignore[import]

        _sia = SentimentIntensityAnalyzer()
        logger.info("VADER sentiment analyser loaded.")
    except ImportError:
        logger.error(
            "nltk is not installed — sentiment scoring falling back to lexicon. "
            "Add `nltk` to requirements.txt and rebuild the image."
        )
    except LookupError:
        logger.error(
            "VADER lexicon not found — sentiment scoring falling back to lexicon. "
            "Run: python -c \"import nltk; nltk.download('vader_lexicon')\""
        )
    return _sia


# ── Public API ───────────────────────────────────────────────────────────────


def score_sentiment(text: str) -> float:
    """
    Return a compound sentiment score in [-1.0, 1.0].

    VADER compound interpretation:
      >= +0.05  positive sentiment
      <= -0.05  negative / hostile framing
      in between  neutral

    Falls back to lexicon scoring if VADER is unavailable.
    """
    if not text:
        return 0.0

    sia = _load_sia()
    if sia is not None:
        return round(sia.polarity_scores(text)["compound"], 4)

    return _lexicon_sentiment(text)


def score_toxicity(text: str) -> float:
    """
    Return a toxicity signal in [0.0, 1.0].

    Derived from VADER's negative proportion score — the fraction of the
    text carrying negative valence. Scaled ×2 because VADER is conservative
    on short posts; this brings short hostile bursts to a visible level.

    Falls back to lexicon scoring if VADER is unavailable.
    """
    if not text:
        return 0.0

    sia = _load_sia()
    if sia is not None:
        neg_proportion = sia.polarity_scores(text)["neg"]
        return round(min(1.0, neg_proportion * 2.0), 4)

    return _lexicon_toxicity(text)


# ── Lexicon fallback ─────────────────────────────────────────────────────────
# Simple word-match scorer kept as a last resort when NLTK data is missing.

_POSITIVE = frozenset(
    {
        "good",
        "great",
        "excellent",
        "positive",
        "wonderful",
        "happy",
        "love",
        "best",
        "better",
        "hope",
        "hopeful",
        "support",
        "helping",
        "together",
        "peace",
        "freedom",
        "fair",
        "honest",
        "truth",
        "justice",
        "safe",
        "proud",
        "strong",
        "win",
        "victory",
        "right",
        "trust",
        "protect",
        "community",
        "unity",
        "care",
        "kind",
        "genuine",
        "real",
        "important",
        "meaningful",
        "vital",
        "welcome",
        "open",
        "inclusive",
        "equal",
        "democratic",
        "accountable",
        "transparent",
        "progress",
        "forward",
        "success",
        "building",
        "celebrate",
        "amazing",
        "respect",
        "dignity",
        "resilience",
        "solidarity",
        "empowered",
        "opportunity",
        "collaboration",
    }
)

_NEGATIVE = frozenset(
    {
        "bad",
        "wrong",
        "terrible",
        "horrible",
        "hate",
        "corrupt",
        "evil",
        "threat",
        "danger",
        "attack",
        "destroy",
        "enemy",
        "lie",
        "lies",
        "fake",
        "cheat",
        "stolen",
        "rigged",
        "fraud",
        "disgrace",
        "shameful",
        "criminal",
        "illegal",
        "violent",
        "violence",
        "dangerous",
        "fear",
        "scared",
        "angry",
        "outrage",
        "betrayal",
        "traitor",
        "conspiracy",
        "manipulate",
        "scam",
        "invasion",
        "takeover",
        "radical",
        "poison",
        "toxic",
        "mislead",
        "censorship",
        "silenced",
        "suppressed",
        "agenda",
        "hoax",
        "propaganda",
        "alarming",
        "alarmed",
        "exposed",
        "infiltrated",
        "controlled",
        "puppet",
        "regime",
        "collusion",
        "overthrow",
        "collapse",
        "catastrophe",
        "disaster",
        "horrific",
        "disgust",
        "reject",
        "refuse",
    }
)

_TOXIC = frozenset(
    {
        "trash",
        "garbage",
        "scum",
        "filth",
        "disgrace",
        "pathetic",
        "worthless",
        "stupid",
        "idiot",
        "moron",
        "coward",
        "parasite",
        "vermin",
        "rot",
        "despicable",
        "vile",
        "degenerate",
        "filthy",
        "loser",
    }
)


def _lexicon_sentiment(text: str) -> float:
    words = text.lower().split()
    if not words:
        return 0.0
    pos = sum(1 for w in words if w in _POSITIVE)
    neg = sum(1 for w in words if w in _NEGATIVE)
    total = pos + neg
    if total == 0:
        return 0.0
    return round((pos - neg) / total, 4)


def _lexicon_toxicity(text: str) -> float:
    words = text.lower().split()
    if not words:
        return 0.0
    toxic_count = sum(1 for w in words if w in _TOXIC)
    return round(min(1.0, toxic_count / max(1, len(words)) * 15), 4)
