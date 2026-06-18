"""
Language detection and translation for discourse text analysis.

Designed for short-form social-media posts. Defaults safely to English
wherever detection or translation fails so the calling pipeline never
hard-fails or raises.

Language is handled **per post**, not per corpus: each post is detected
individually and only the non-English posts are translated (the translator
auto-detects each one). This means a mixed FR/ES/EN file is translated
accurately post-by-post, instead of forcing every post through a single
corpus-level source language.

Public API
----------
prepare_for_sentiment(texts)
    Detect each post's language, translate non-English posts to English,
    return (prepared_texts, dominant_language_code).

detect_dataset_language(texts)
    Dominant ISO 639-1 code across the corpus (deterministic majority vote).

detect_languages(texts)
    Per-post ISO 639-1 codes, parallel to ``texts``.
"""

from __future__ import annotations

import logging
from collections import Counter

logger = logging.getLogger(__name__)

ENGLISH = "en"
_BATCH_SIZE = 50  # texts per translation request (avoids rate-limiting)
_MIN_DETECT_LEN = 10  # shorter texts are too noisy to detect — assume English

# langdetect is non-deterministic unless its RNG is seeded. Seed once at import
# so the same corpus always yields the same detection result.
try:
    from langdetect import DetectorFactory
    from langdetect import detect as _ld_detect

    DetectorFactory.seed = 0
    _LANGDETECT_AVAILABLE = True
except ImportError:  # pragma: no cover - exercised only when dependency missing
    _LANGDETECT_AVAILABLE = False
    logger.warning("langdetect not installed — assuming English for all posts.")


# ── Language detection ───────────────────────────────────────────────────────


def _detect_one(text: str) -> str:
    """Detect a single text's language; default to English on short text or failure."""
    if not _LANGDETECT_AVAILABLE or not text or len(text.strip()) < _MIN_DETECT_LEN:
        return ENGLISH
    try:
        code = _ld_detect(text[:500])  # limit to first 500 chars for speed
        return code if isinstance(code, str) else ENGLISH
    except Exception:
        return ENGLISH


def detect_languages(texts: list[str]) -> list[str]:
    """Return a per-post list of ISO 639-1 codes, parallel to ``texts``."""
    return [_detect_one(t) for t in texts]


def _dominant(langs: list[str]) -> str:
    """Most common non-empty language code; 'en' when nothing is detectable."""
    votes = Counter(lang for lang in langs if lang)
    if not votes:
        return ENGLISH
    return votes.most_common(1)[0][0]


def detect_dataset_language(texts: list[str]) -> str:
    """
    Dominant ISO 639-1 code across ``texts`` (deterministic majority vote).
    Falls back to 'en' if langdetect is missing or nothing is detectable.
    """
    if not texts:
        return ENGLISH
    return _dominant(detect_languages(texts))


# ── Translation ──────────────────────────────────────────────────────────────
# Uses `requests` (already a project dependency) to call the free Google
# Translate web endpoint directly. deep-translator was removed because its
# PyPI account was compromised (PYSEC-2022-252) and no clean release exists.

import requests as _requests  # noqa: E402 — imported here to keep top of file clean


def _google_translate_one(text: str, source_lang: str = "auto") -> str | None:
    """
    Translate a single text to English via the free Google Translate endpoint.

    Returns the translated string, or None on any failure — callers fall back
    to the original text so the NLP pipeline never hard-fails.
    """
    try:
        resp = _requests.get(
            "https://translate.googleapis.com/translate_a/single",
            params={
                "client": "gtx",
                "sl": source_lang,
                "tl": ENGLISH,
                "dt": "t",
                "q": text,
            },
            timeout=8,
        )
        resp.raise_for_status()
        data = resp.json()
        # Response shape: [[[translated_chunk, original_chunk, ...], ...], ...]
        return "".join(chunk[0] for chunk in data[0] if chunk and chunk[0])
    except Exception as exc:
        logger.debug("Translation failed for snippet '%.40s…': %s", text, exc)
        return None


def _translate_batch(texts: list[str], source_lang: str) -> list[str]:
    """Translate one batch of texts to English. Returns originals on error."""
    return [_google_translate_one(t, source_lang) or t for t in texts]


def translate_to_english(texts: list[str], source_lang: str = "auto") -> list[str]:
    """
    Translate all texts to English in batches of _BATCH_SIZE.

    ``source_lang`` defaults to ``"auto"`` so each text is auto-detected —
    correct for mixed-language corpora. Falls back to the original text for
    any text whose translation request fails (network error, rate limit, etc.).
    """
    if not texts:
        return texts

    results: list[str] = []
    for i in range(0, len(texts), _BATCH_SIZE):
        batch = texts[i : i + _BATCH_SIZE]
        results.extend(_translate_batch(batch, source_lang))

    return results


# ── Main entry point ─────────────────────────────────────────────────────────


def prepare_for_sentiment(texts: list[str]) -> tuple[list[str], str]:
    """
    Detect each post's language, translate the non-English posts to English,
    and return ``(prepared_texts, dominant_language_code)``.

    - Each non-English post is translated independently (translator auto-detects
      its language), so mixed-language files are handled correctly per post.
    - English posts are never sent to the translator: a fully-English corpus
      makes zero network calls and is returned unchanged.
    - On any translation failure the original text is kept so scoring still runs.
    """
    if not texts:
        return texts, ENGLISH

    langs = detect_languages(texts)
    dominant = _dominant(langs)

    non_en_idx = [i for i, lang in enumerate(langs) if lang != ENGLISH]
    if not non_en_idx:
        logger.debug("All posts detected as English — no translation needed.")
        return texts, dominant

    logger.info(
        "Translating %d/%d non-English posts to English (dominant=%s).",
        len(non_en_idx),
        len(texts),
        dominant,
    )

    subset = [texts[i] for i in non_en_idx]
    translated_subset = translate_to_english(subset, source_lang="auto")

    prepared = list(texts)
    for idx, translated in zip(non_en_idx, translated_subset, strict=False):
        prepared[idx] = translated

    return prepared, dominant
