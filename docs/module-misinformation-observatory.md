# Misinformation Observatory

The Misinformation Observatory is CivicSec Lab's narrative and coordinated-signal monitoring module. It applies a natural language processing pipeline to user-supplied post datasets to surface narrative clusters, keyword bursts, and entity mentions for human review.

**Language note**: this module deliberately avoids the words "misinformation", "bot", and "troll" in its outputs. Outputs are labelled as "narrative clusters" and "coordinated-looking signals" because the module cannot determine intent or authenticity. All outputs require human review before action.

## Purpose

The Observatory answers:

- What groups of topically similar content appear in a dataset?
- Are any keywords spiking significantly above their recent baseline?
- Which public figures, organisations, or locations appear most frequently?
- What is the overall sentiment distribution of each narrative cluster?
- Which clusters warrant human review, and which can be set aside?

## Input Format

The Observatory accepts CSV files containing public post data with the following columns:

| Column | Description |
|---|---|
| `post_id` | Unique post identifier |
| `text` | Post text content |
| `author` | Author handle or pseudonym |
| `timestamp` | ISO 8601 datetime |
| `platform` | Platform name (e.g. Twitter, Reddit) |
| `url` | Original post URL (optional) |

Columns are validated on upload. Files with missing required text/timestamp columns are rejected.

## Models

- `UploadedDataset` — upload record with processing status and dataset metadata (Observatory-specific version in `apps.misinformation`).
- `DatasetColumnSample` — sample values from the dataset for preview.
- `NarrativeCluster` — a group of topically similar posts, with title, sentiment score, cluster size, top keywords, and status.
- `KeywordBurst` — a keyword whose frequency spiked above its rolling baseline in a given time window.
- `EntityMention` — a named entity (person, organisation, location) detected in the dataset with frequency count.

NarrativeCluster can generate shared platform records:
- `RiskEvent` (for escalated clusters)

## NLP Pipeline

The pipeline runs synchronously after CSV upload and proceeds in four stages:

### Stage 1: TF-IDF Vectorisation
Post text is cleaned (lowercased, whitespace-normalised) and converted to a TF-IDF sparse matrix. Stop words are removed. The resulting feature space captures the relative importance of terms across the dataset.

### Stage 2: MiniBatchKMeans Clustering
`k = min(8, max(2, int(sqrt(post_count))))` clusters are fitted. Each post is assigned to its nearest cluster centroid. Cluster labels are derived from the top-5 TF-IDF terms for that cluster.

### Stage 3: Keyword Burst Detection
Per-keyword post counts are computed in a 24-hour rolling window. A burst is flagged when:
- Current-window count ≥ 3× the 7-day rolling baseline count, and
- At least 5 posts contain the keyword in the current window.

Burst severity is classified by burst multiplier: low (3–5×), medium (5–10×), high (>10×).

### Stage 4: Named Entity Extraction
spaCy (`en_core_web_sm`) extracts named entities of types `PERSON`, `ORG`, `GPE`, and `LOC`. Entities with confidence below 0.5 are filtered. The top 30 entities by frequency per dataset are stored as `EntityMention` records.

### Sentiment Scoring
Each cluster is assigned a sentiment score (−1 to +1) using a domain-relevant lexicon covering civic, political, and security terminology. The score is the mean of per-post term-level scores, clipped to [−1, 1].

## Cluster Status Workflow

| Status | Meaning |
|---|---|
| `draft` | Newly created by the pipeline; not yet reviewed |
| `needs_review` | Flagged for analyst attention |
| `escalated` | Cluster escalated; a linked `RiskEvent` is created |
| `dismissed` | Reviewed and dismissed by an analyst |

Analysts can update cluster status via the API or frontend. Escalated clusters generate a `RiskEvent` with `source_module = "misinformation"`.

## API Endpoints

```text
GET  /api/observatory/overview/
GET  /api/observatory/datasets/
POST /api/observatory/datasets/                       (multipart/form-data)
GET  /api/observatory/datasets/{id}/
GET  /api/observatory/datasets/{id}/clusters/
GET  /api/observatory/datasets/{id}/bursts/
GET  /api/observatory/datasets/{id}/entities/
GET  /api/observatory/clusters/
GET  /api/observatory/clusters/{id}/
PATCH /api/observatory/clusters/{id}/
GET  /api/observatory/clusters/{id}/keywords/
GET  /api/observatory/clusters/{id}/entities/
```

## Frontend

Pages at `/modules/misinformation-observatory/`:

- **Overview**: total dataset count, cluster counts by status, recent escalated clusters.
- **Dataset List**: list of uploaded datasets with post count and processing status.
- **Upload**: CSV upload form with column validation feedback.
- **Dataset Detail**: cluster list with sentiment bars, keyword burst summary, and entity mention table.
- **Cluster List**: filterable list of all clusters across datasets with status badges.
- **Cluster Detail**: cluster metadata, top keywords, sentiment bar, entity mentions, status management controls, and link to the originating dataset.

## Safety Boundaries

- The module does not label individuals as malicious, coordinating, or inauthentic.
- No automated content takedown, reporting, or moderation decisions.
- No scraping of live platforms; all data is user-supplied.
- No private messages, DMs, or non-public content.
- Outputs explicitly require human review before action.
- The module must not be used to generate harassment lists or target individuals.

## Current Limitations

- English-language only (spaCy `en_core_web_sm`).
- No deduplication of near-duplicate posts.
- No account behaviour modelling (posting frequency, coordination patterns).
- No temporal sequence modelling beyond keyword burst detection.
- Clustering is non-deterministic (MiniBatchKMeans uses a random seed); results may vary across pipeline runs.
- Burst detection requires sufficient historical posts in the same dataset to establish a baseline.
- Processing is synchronous; large datasets may have slow upload responses. Async Celery task is future work.
