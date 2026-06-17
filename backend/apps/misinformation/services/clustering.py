"""TF-IDF + KMeans narrative clustering. Requires scikit-learn."""

from __future__ import annotations

import logging
import math

from apps.misinformation.services.text_processing import clean_text

logger = logging.getLogger(__name__)

try:
    from sklearn.cluster import MiniBatchKMeans
    from sklearn.feature_extraction.text import TfidfVectorizer

    _SKLEARN_AVAILABLE = True
except ImportError:  # pragma: no cover
    _SKLEARN_AVAILABLE = False
    logger.warning("scikit-learn not available — clustering will produce a single cluster")


def _num_clusters(n: int) -> int:
    """Heuristic: sqrt(n/2) clamped to [2, 20]."""
    if n < 4:
        return max(1, n)
    return max(2, min(20, int(math.sqrt(n / 2))))


def cluster_posts(texts: list[str]) -> list[dict]:
    """
    Cluster ``texts`` using TF-IDF + MiniBatchKMeans.

    Returns a list of dicts:
        {
            "label": int,
            "indices": [int, ...],   # indices into ``texts``
            "top_terms": [str, ...],
        }
    """
    if not texts:
        return []

    if len(texts) == 1:
        return [{"label": 0, "indices": [0], "top_terms": []}]

    cleaned = [clean_text(t) for t in texts]

    if not _SKLEARN_AVAILABLE:
        return [{"label": 0, "indices": list(range(len(texts))), "top_terms": []}]

    vectorizer = TfidfVectorizer(
        max_features=2000,
        min_df=2,
        ngram_range=(1, 2),
        stop_words="english",
    )
    try:
        tfidf_matrix = vectorizer.fit_transform(cleaned)
    except ValueError:
        # Happens when all documents are empty after preprocessing
        return [{"label": 0, "indices": list(range(len(texts))), "top_terms": []}]

    k = _num_clusters(len(texts))
    model = MiniBatchKMeans(n_clusters=k, random_state=42, n_init=3, max_iter=300)
    labels = model.fit_predict(tfidf_matrix).tolist()

    feature_names = vectorizer.get_feature_names_out()
    order_centroids = model.cluster_centers_.argsort()[:, ::-1]

    clusters: dict[int, dict] = {}
    for idx, label in enumerate(labels):
        if label not in clusters:
            top_indices = order_centroids[label, :15].tolist()
            top_terms = [str(feature_names[i]) for i in top_indices]
            clusters[label] = {"label": label, "indices": [], "top_terms": top_terms}
        clusters[label]["indices"].append(idx)

    return list(clusters.values())
