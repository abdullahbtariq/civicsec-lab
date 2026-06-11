"""
DataPrivacy Doctor — column-level privacy detection rules.

Each function examines a column's name, inferred type, and sample values,
returning a (privacy_category, inferred_type, risk_score, recommendation, notes) tuple.
"""

import re

# ---------------------------------------------------------------------------
# Column-name keyword sets
# ---------------------------------------------------------------------------

DIRECT_IDENTIFIER_NAMES = {
    "email",
    "email_address",
    "mail",
    "phone",
    "phone_number",
    "mobile",
    "telephone",
    "tel",
    "full_name",
    "name",
    "first_name",
    "last_name",
    "surname",
    "forename",
    "national_id",
    "passport",
    "passport_number",
    "ssn",
    "nhs_number",
    "tax_id",
    "id_number",
    "ip_address",
    "ip",
    "mac_address",
    "url",
    "profile_url",
    "username",
    "user_id",
    "account_id",
    "cookie",
    "device_id",
    "imei",
    "date_of_birth",
    "dob",
    "birthdate",
    "birth_date",
    "postcode",
    "zip_code",
    "zip",
    "address",
    "street_address",
    "home_address",
    "location",
    "gps",
    "latitude",
    "longitude",
    "coordinates",
    "biometric",
    "fingerprint",
    "face_id",
    "bank_account",
    "iban",
    "credit_card",
    "card_number",
}

QUASI_IDENTIFIER_NAMES = {
    "age",
    "age_band",
    "age_group",
    "year_of_birth",
    "birth_year",
    "city",
    "town",
    "county",
    "region",
    "country",
    "gender",
    "sex",
    "occupation",
    "job_title",
    "role",
    "profession",
    "employer",
    "company",
    "organisation",
    "organization",
    "industry",
    "education",
    "qualification",
    "marital_status",
    "nationality",
    "language",
    "ethnicity_broad",
    "income_band",
    "salary_band",
    "household_size",
    "dependants",
}

SENSITIVE_ATTRIBUTE_NAMES = {
    "religion",
    "faith",
    "belief",
    "ethnicity",
    "race",
    "ethnic_group",
    "political",
    "political_affiliation",
    "political_party",
    "political_opinion",
    "health",
    "health_condition",
    "health_conditions",
    "medical",
    "diagnosis",
    "medication",
    "disability",
    "disability_status",
    "mental_health",
    "sexuality",
    "sexual_orientation",
    "gender_identity",
    "union",
    "trade_union",
    "union_membership",
    "criminal",
    "criminal_record",
    "conviction",
    "offence",
    "immigration",
    "visa_status",
    "refugee",
    "asylum",
    "victim",
    "survivor",
    "abuse",
    "trauma",
    "hiv",
    "aids",
    "pregnancy",
    "maternity",
}

FREE_TEXT_NAMES = {
    "notes",
    "note",
    "comments",
    "comment",
    "description",
    "details",
    "remarks",
    "feedback",
    "message",
    "bio",
    "biography",
    "summary",
    "narrative",
    "case_notes",
    "observations",
    "additional_info",
    "other",
}

# ---------------------------------------------------------------------------
# Value-level regex patterns (for sample-value scanning)
# ---------------------------------------------------------------------------

EMAIL_RE = re.compile(r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}", re.IGNORECASE)
PHONE_RE = re.compile(
    r"(\+?\d[\d\s\-().]{6,}\d)",
    re.IGNORECASE,
)
URL_RE = re.compile(r"https?://\S+|www\.\S+", re.IGNORECASE)
POSTCODE_UK_RE = re.compile(r"\b[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}\b", re.IGNORECASE)

HIGH_UNIQUENESS_THRESHOLD = 0.9
HIGH_MISSINGNESS_THRESHOLD = 0.8

# ---------------------------------------------------------------------------
# Type inference
# ---------------------------------------------------------------------------


def infer_column_type(col_name: str, sample_values: list[str]) -> str:
    """Infer the likely data type from the column name and sample values."""
    name = col_name.lower().strip()

    if name in {"email", "email_address", "mail"} or _matches_pattern(sample_values, EMAIL_RE):
        return "email"
    # Date check must precede phone — ISO date strings (e.g. 1990-05-15) match PHONE_RE
    if any(k in name for k in ("date", "dob", "birth", "joined", "created", "updated", "at")):
        return "date"
    if name in {"phone", "phone_number", "mobile", "telephone", "tel"} or _matches_pattern(
        sample_values, PHONE_RE
    ):
        return "phone"
    if name in {"url", "profile_url", "website"} or _matches_pattern(sample_values, URL_RE):
        return "text"  # url subtype still text
    if any(k in name for k in ("id", "number", "code", "ref", "key", "uuid")) and not any(
        k in name for k in ("country", "gender")
    ):
        return "identifier"
    if any(k in name for k in ("name", "surname", "forename")):
        return "name"
    if any(k in name for k in ("address", "street", "postcode", "zip")):
        return "address"
    if name in FREE_TEXT_NAMES or _is_long_text(sample_values):
        return "free_text"
    if _is_numeric(sample_values):
        return "numeric"
    if _is_low_cardinality(sample_values):
        return "category"
    return "text"


def classify_column(col_name: str, inferred_type: str, sample_values: list[str]) -> dict:
    """
    Return privacy classification for a single column.

    Returns:
        {
            "privacy_category": str,
            "risk_score": int (0-100),
            "recommended_transformation": str,
            "notes": str,
        }
    """
    name = col_name.lower().strip()

    # --- Direct identifiers ---
    if name in DIRECT_IDENTIFIER_NAMES or inferred_type in {"email", "phone", "identifier"}:
        return {
            "privacy_category": "direct_identifier",
            "risk_score": 85,
            "recommended_transformation": "remove column or hash value",
            "notes": "Likely directly identifies an individual. Remove or irreversibly pseudonymise before sharing.",
        }

    # --- Check values for direct-identifier patterns ---
    if _matches_pattern(sample_values, EMAIL_RE):
        return {
            "privacy_category": "direct_identifier",
            "risk_score": 80,
            "recommended_transformation": "remove column or hash value",
            "notes": "Email addresses detected in values — direct identifier.",
        }
    if _matches_pattern(sample_values, PHONE_RE, threshold=0.3):
        return {
            "privacy_category": "direct_identifier",
            "risk_score": 75,
            "recommended_transformation": "remove column or mask value",
            "notes": "Phone-like patterns detected in values — likely direct identifier.",
        }

    # --- Sensitive attributes ---
    if name in SENSITIVE_ATTRIBUTE_NAMES:
        return {
            "privacy_category": "sensitive_attribute",
            "risk_score": 70,
            "recommended_transformation": "remove column or aggregate into broad categories",
            "notes": "Column name suggests a special-category attribute under data protection law.",
        }

    # --- Quasi-identifiers ---
    if name in QUASI_IDENTIFIER_NAMES:
        return {
            "privacy_category": "quasi_identifier",
            "risk_score": 40,
            "recommended_transformation": "generalise value (e.g. age band, broad region)",
            "notes": "May contribute to re-identification when combined with other quasi-identifiers.",
        }

    # --- Free-text risk ---
    if inferred_type == "free_text" or name in FREE_TEXT_NAMES:
        has_pii_in_text = _scan_free_text_for_pii(sample_values)
        if has_pii_in_text:
            return {
                "privacy_category": "free_text_risk",
                "risk_score": 60,
                "recommended_transformation": "redact identifiers from free text",
                "notes": "Free-text column appears to contain embedded PII (emails, phones, or names).",
            }
        return {
            "privacy_category": "free_text_risk",
            "risk_score": 25,
            "recommended_transformation": "review manually for embedded personal data",
            "notes": "Free-text fields may contain personal information not detectable by automated scanning.",
        }

    # --- Name column (name type but not in direct identifier set) ---
    if inferred_type == "name":
        return {
            "privacy_category": "direct_identifier",
            "risk_score": 70,
            "recommended_transformation": "remove column or pseudonymise",
            "notes": "Column inferred as a name field — likely a direct identifier.",
        }

    # --- Default: low risk ---
    return {
        "privacy_category": "low_risk",
        "risk_score": 5,
        "recommended_transformation": "no action required",
        "notes": "",
    }


# ---------------------------------------------------------------------------
# Dataset-level finding generators
# ---------------------------------------------------------------------------


def detect_direct_identifiers(profiles) -> list[dict]:
    """Return finding dicts for each direct identifier column."""
    findings = []
    direct_cols = [p for p in profiles if p["privacy_category"] == "direct_identifier"]
    for col in direct_cols:
        findings.append(
            {
                "finding_type": "direct_identifier_detected",
                "title": f"Direct identifier column: {col['column_name']}",
                "description": (
                    f"The column '{col['column_name']}' (inferred type: {col['inferred_type']}) "
                    "appears to contain values that can directly identify individuals. "
                    "This likely constitutes personal data under applicable data protection law. "
                    "Human verification is recommended."
                ),
                "severity": "high",
                "confidence": 0.85,
                "affected_columns": [col["column_name"]],
                "evidence": {
                    "inferred_type": col["inferred_type"],
                    "uniqueness_ratio": col["uniqueness_ratio"],
                    "sample_values_masked": col["sample_values_masked"],
                },
                "recommendation": col["recommended_transformation"],
            }
        )
    return findings


def detect_quasi_identifier_combination(profiles) -> list[dict]:
    """Flag when 3+ quasi-identifiers are present together."""
    quasi_cols = [p for p in profiles if p["privacy_category"] == "quasi_identifier"]
    if len(quasi_cols) < 3:
        return []
    col_names = [p["column_name"] for p in quasi_cols]
    return [
        {
            "finding_type": "quasi_identifier_combination",
            "title": f"{len(quasi_cols)} quasi-identifiers present — potential re-identification risk",
            "description": (
                f"The dataset contains {len(quasi_cols)} quasi-identifier columns "
                f"({', '.join(col_names)}). "
                "When combined, these attributes may allow individuals to be re-identified "
                "even without direct identifiers. This risk increases in small datasets. "
                "Human verification is recommended."
            ),
            "severity": "high" if len(quasi_cols) >= 4 else "medium",
            "confidence": 0.75,
            "affected_columns": col_names,
            "evidence": {"quasi_identifier_count": len(quasi_cols), "columns": col_names},
            "recommendation": (
                "Consider generalising values (e.g. age bands, broad regions), "
                "suppressing rare combinations, or removing the least-necessary quasi-identifiers."
            ),
        }
    ]


def detect_high_uniqueness(profiles) -> list[dict]:
    """Flag non-identifier columns with very high uniqueness ratios."""
    findings = []
    for p in profiles:
        if (
            p["uniqueness_ratio"] >= HIGH_UNIQUENESS_THRESHOLD
            and p["privacy_category"] not in {"direct_identifier"}
            and p["inferred_type"] not in {"identifier", "email", "phone"}
        ):
            findings.append(
                {
                    "finding_type": "high_uniqueness_column",
                    "title": f"High-uniqueness column: {p['column_name']}",
                    "description": (
                        f"Column '{p['column_name']}' has a uniqueness ratio of "
                        f"{p['uniqueness_ratio']:.0%}, meaning nearly every row has a distinct value. "
                        "High uniqueness may indicate an undeclared identifier or a column that "
                        "can distinguish individuals. Review required."
                    ),
                    "severity": "medium",
                    "confidence": 0.7,
                    "affected_columns": [p["column_name"]],
                    "evidence": {"uniqueness_ratio": p["uniqueness_ratio"]},
                    "recommendation": (
                        "Assess whether this column is an identifier in disguise. "
                        "If so, remove or pseudonymise it."
                    ),
                }
            )
    return findings


def detect_sensitive_attributes(profiles) -> list[dict]:
    """Return one combined finding if sensitive attributes are present."""
    sensitive_cols = [p for p in profiles if p["privacy_category"] == "sensitive_attribute"]
    if not sensitive_cols:
        return []
    col_names = [p["column_name"] for p in sensitive_cols]
    return [
        {
            "finding_type": "sensitive_attribute_detected",
            "title": f"Possible special-category data in {len(sensitive_cols)} column(s)",
            "description": (
                f"The following column(s) may contain special-category personal data "
                f"(e.g. health, religion, ethnicity, political views): {', '.join(col_names)}. "
                "Processing such data typically requires a higher legal basis and stricter controls. "
                "Human verification is strongly recommended."
            ),
            "severity": "high",
            "confidence": 0.8,
            "affected_columns": col_names,
            "evidence": {"column_count": len(sensitive_cols)},
            "recommendation": (
                "Confirm necessity for each sensitive attribute. "
                "Where not strictly required, remove the column before sharing. "
                "Ensure appropriate legal basis and data processing agreements are in place."
            ),
        }
    ]


def detect_risky_free_text(profiles) -> list[dict]:
    """Flag free-text columns that contain embedded PII."""
    findings = []
    for p in profiles:
        if p["privacy_category"] == "free_text_risk" and p["risk_score"] >= 50:
            findings.append(
                {
                    "finding_type": "risky_free_text",
                    "title": f"Possible embedded PII in free-text column: {p['column_name']}",
                    "description": (
                        f"Automated scanning of sample values in '{p['column_name']}' "
                        "detected patterns consistent with embedded personal data "
                        "(email addresses, phone numbers, or other identifiers within text). "
                        "Free-text fields often accumulate personal data that is not visible in column headers."
                    ),
                    "severity": "medium",
                    "confidence": 0.65,
                    "affected_columns": [p["column_name"]],
                    "evidence": {"sample_values_masked": p["sample_values_masked"]},
                    "recommendation": (
                        "Review free-text values manually. "
                        "Use automated redaction tools to remove embedded identifiers before sharing."
                    ),
                }
            )
    return findings


def detect_excessive_data_collection(profiles, row_count: int) -> list[dict]:
    """Flag when there are many direct identifiers relative to dataset size."""
    direct_cols = [p for p in profiles if p["privacy_category"] == "direct_identifier"]
    if len(direct_cols) < 3:
        return []
    return [
        {
            "finding_type": "excessive_data_collection",
            "title": f"Potentially excessive personal data collection ({len(direct_cols)} identifier columns)",
            "description": (
                f"This dataset contains {len(direct_cols)} direct identifier columns "
                f"across {row_count} records. "
                "Collecting more personal data than strictly necessary may breach data minimisation principles. "
                "Consider whether all identifier columns are required for the stated purpose."
            ),
            "severity": "medium",
            "confidence": 0.7,
            "affected_columns": [p["column_name"] for p in direct_cols],
            "evidence": {
                "direct_identifier_count": len(direct_cols),
                "row_count": row_count,
            },
            "recommendation": (
                "Apply the data minimisation principle: retain only the personal data fields "
                "strictly necessary for your purpose. Remove or suppress the rest before sharing."
            ),
        }
    ]


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------


def _matches_pattern(values: list[str], pattern: re.Pattern, threshold: float = 0.2) -> bool:
    if not values:
        return False
    matches = sum(1 for v in values if v and pattern.search(str(v)))
    return (matches / len(values)) >= threshold


def _is_long_text(values: list[str], min_avg_words: int = 5) -> bool:
    if not values:
        return False
    word_counts = [len(str(v).split()) for v in values if v]
    if not word_counts:
        return False
    return (sum(word_counts) / len(word_counts)) >= min_avg_words


def _is_numeric(values: list[str]) -> bool:
    if not values:
        return False
    numeric = 0
    for v in values:
        try:
            float(str(v).replace(",", ""))
            numeric += 1
        except (ValueError, TypeError):
            pass
    return numeric / len(values) >= 0.8


def _is_low_cardinality(values: list[str], max_unique_ratio: float = 0.1) -> bool:
    if len(values) < 5:
        return False
    unique_count = len(set(str(v).lower() for v in values if v))
    return (unique_count / len(values)) <= max_unique_ratio


def _scan_free_text_for_pii(values: list[str]) -> bool:
    text = " ".join(str(v) for v in values if v)
    return bool(EMAIL_RE.search(text) or PHONE_RE.search(text))


def mask_value(value: str, inferred_type: str) -> str:
    """Return a masked/redacted representation safe to show in the UI."""
    if not value:
        return ""
    v = str(value)
    if inferred_type == "email":
        parts = v.split("@")
        if len(parts) == 2:
            return f"{parts[0][:2]}***@{parts[1]}"
    if inferred_type in {"phone", "identifier"}:
        return v[:3] + "***" + v[-2:] if len(v) > 5 else "***"
    if inferred_type == "name":
        words = v.split()
        return " ".join(w[0] + "***" for w in words)
    # Generic: keep first 3 chars
    return v[:3] + "…" if len(v) > 3 else "…"
