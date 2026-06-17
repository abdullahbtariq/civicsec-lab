"""Text cleaning and tokenisation utilities for the Observatory NLP pipeline."""

import re

# Common English stopwords (compact set for MVP)
STOPWORDS = frozenset(
    {
        "the", "a", "an", "is", "it", "in", "on", "at", "to", "for", "of", "and",
        "or", "but", "this", "that", "with", "as", "be", "was", "were", "are",
        "have", "has", "had", "will", "would", "could", "should", "from", "by",
        "not", "so", "if", "we", "they", "he", "she", "i", "you", "me", "him",
        "her", "us", "our", "their", "my", "your", "its", "do", "did", "does",
        "been", "being", "am", "no", "up", "out", "about", "than", "into", "can",
        "all", "more", "also", "just", "what", "when", "where", "who", "how",
        "there", "which", "re", "ve", "ll", "don", "didn", "won", "isn", "aren",
        "rt", "via", "de", "en", "la", "le", "les",
    }
)

_URL_RE = re.compile(r"https?://\S+|www\.\S+")
_MULTI_SPACE = re.compile(r"\s+")
# Allow word chars, whitespace, # and @
_NON_TOKEN = re.compile(r"[^\w\s#@]")


def clean_text(text: str) -> str:
    """Lowercase, strip URLs, normalise whitespace. Preserve #tags and @mentions."""
    if not text:
        return ""
    text = text.lower()
    text = _URL_RE.sub(" ", text)
    text = _NON_TOKEN.sub(" ", text)
    text = _MULTI_SPACE.sub(" ", text).strip()
    return text


def tokenize(text: str, remove_stopwords: bool = True) -> list[str]:
    """Split cleaned text into tokens, optionally removing stopwords."""
    tokens = text.lower().split()
    if remove_stopwords:
        tokens = [t for t in tokens if t not in STOPWORDS and len(t) > 2]
    return tokens


def extract_hashtags(text: str) -> list[str]:
    return re.findall(r"#(\w+)", text.lower())


def extract_mentions(text: str) -> list[str]:
    return re.findall(r"@(\w+)", text.lower())


def extract_domain(url: str) -> str | None:
    if not url:
        return None
    match = re.search(r"https?://([^/\s]+)", url)
    return match.group(1).lower() if match else None
