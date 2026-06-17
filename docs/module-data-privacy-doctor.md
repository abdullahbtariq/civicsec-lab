# DataPrivacy Doctor

DataPrivacy Doctor is CivicSec Lab's dataset privacy-risk scanning module. It helps civic organisations understand what personal data is present in a dataset before they analyse, share, or publish it, and flags high-risk datasets for review.

DataPrivacy Doctor is a decision-support tool. It does not guarantee anonymisation or certify legal compliance.

## Purpose

DataPrivacy Doctor answers:

- Does this dataset contain direct identifiers like names, emails, or ID numbers?
- Does it contain quasi-identifiers that could re-identify individuals when combined?
- How unique are the records — could rows identify specific people?
- What is the overall privacy risk, and should we review before sharing?
- Which specific columns are most sensitive?

## Input Format

DataPrivacy Doctor accepts CSV files up to 10 MB.

Column names are matched against a 14-category detection list:

| Category | Example column names | Type |
|---|---|---|
| Full name | `name`, `full_name`, `person_name` | Direct identifier |
| Email | `email`, `email_address` | Direct identifier |
| Phone | `phone`, `mobile`, `telephone` | Direct identifier |
| National ID | `ssn`, `national_id`, `passport`, `nhs_number` | Direct identifier |
| Username | `username`, `user_id`, `login` | Direct identifier |
| Date of birth | `dob`, `birth_date`, `date_of_birth` | Quasi-identifier |
| Age | `age`, `age_group` | Quasi-identifier |
| Postcode / ZIP | `postcode`, `zip_code`, `zip` | Quasi-identifier |
| Gender | `gender`, `sex` | Quasi-identifier |
| Ethnicity | `ethnicity`, `race` | Sensitive |
| Health | `diagnosis`, `condition`, `medication`, `health_status` | Sensitive |
| Income | `income`, `salary`, `wage`, `earnings` | Sensitive |
| Religion | `religion`, `faith` | Sensitive |
| Location | `address`, `street`, `city`, `latitude`, `longitude` | Quasi-identifier |

Detection is case-insensitive and matches partial column names.

## Models

- `UploadedDataset` — tracks the upload, processing status, risk score, risk band, and dataset metadata.
- `DatasetColumnProfile` — one record per column: inferred type, null rate, uniqueness rate, and masked sample values.

UploadedDataset also generates shared platform records:
- `RiskEvent` (for high and severe datasets)

## Processing Pipeline

1. File-type and size validation (CSV only, max 10 MB).
2. Column profiling: type inference, null rate, unique rate.
3. Sample value masking: values are stored as partially masked strings, never verbatim.
4. PII and quasi-identifier detection against the 14-category list.
5. Composite privacy risk score calculation.
6. Risk band assignment.
7. Original file deletion.
8. `RiskEvent` generation for high/severe datasets.

## Privacy Risk Score

The composite score (0–100) is calculated from five factors:

| Factor | Max contribution | Description |
|---|---|---|
| Identifier density | 30 | Direct-identifier columns ÷ total columns |
| Quasi-identifier density | 25 | Quasi-identifier columns ÷ total columns |
| Row uniqueness risk | 20 | Proportion of rows that are fully unique |
| Scale risk | 15 | Log-scaled row count (more rows = higher risk) |
| Sensitive category flag | 10 | Health, income, ethnicity, or religion columns present |

Risk bands:

| Band | Score range |
|---|---|
| Low | 0–25 |
| Medium | 26–50 |
| High | 51–75 |
| Severe | 76–100 |

Scores are decision-support indicators and should be reviewed by a person familiar with the dataset's use context.

## API Endpoints

```text
GET    /api/privacy-doctor/overview/
GET    /api/privacy-doctor/datasets/
POST   /api/privacy-doctor/datasets/           (multipart/form-data upload)
GET    /api/privacy-doctor/datasets/{id}/
DELETE /api/privacy-doctor/datasets/{id}/
GET    /api/privacy-doctor/datasets/{id}/columns/
```

## Frontend

Pages at `/modules/privacy-doctor/`:

- **Overview**: recent dataset count, risk band distribution, and high-risk dataset alert list.
- **Dataset List**: list of uploaded datasets with risk band badges and processing status.
- **Upload**: CSV upload form with file-type validation feedback.
- **Dataset Detail**: risk score, risk band, column-level findings table with PII type flags and masked samples.

## Safety Boundaries

- Uploaded files are processed and then deleted from disk; no raw data is retained after profiling.
- Column samples stored in the database are masked (e.g. `Jo** ****` not `John Smith`).
- DataPrivacy Doctor does not claim to certify GDPR compliance, anonymisation completeness, or legal data-sharing permission.
- No uploads to external services; processing is entirely local.
- Public demo instances must not receive real personal data.

## Current Limitations

- Detection is pattern-matched on column names only; column content is not semantically analysed.
- Masked samples are heuristic; very short values may be fully masked.
- No multi-column quasi-identifier combination analysis (k-anonymity).
- No retention-policy enforcement beyond deleting the original upload file.
- Processing is synchronous; large files may slow the upload response.
