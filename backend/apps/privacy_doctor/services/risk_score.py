"""DataPrivacy Doctor — dataset privacy risk score formula."""

# ---------------------------------------------------------------------------
# Risk band thresholds
# ---------------------------------------------------------------------------

RISK_BANDS = [
    (71, "severe"),
    (46, "high"),
    (21, "moderate"),
    (0, "low"),
]

# Points contributed per column category (capped internally)
DIRECT_IDENTIFIER_POINTS = 20
QUASI_IDENTIFIER_POINTS = 5
SENSITIVE_ATTRIBUTE_POINTS = 12
FREE_TEXT_RISK_POINTS = 6

# Caps per category
DIRECT_ID_CAP = 60
QUASI_ID_CAP = 25
SENSITIVE_CAP = 20
FREE_TEXT_CAP = 10

# Bonus for findings
FINDING_POINTS = {
    "direct_identifier_detected": 0,  # already counted in column scores
    "quasi_identifier_combination": 15,
    "high_uniqueness_column": 5,
    "sensitive_attribute_detected": 0,  # already counted
    "risky_free_text": 5,
    "small_group_reidentification_risk": 15,
    "excessive_data_collection": 10,
}


def calculate_dataset_risk_score(
    profile_dicts: list[dict], finding_dicts: list[dict]
) -> tuple[int, str]:
    """
    Calculate an overall privacy risk score (0–100) and risk band.

    Formula:
        score = direct_id_score + quasi_id_score + sensitive_score + free_text_score
              + finding_bonus
    """
    direct_id_count = sum(1 for p in profile_dicts if p["privacy_category"] == "direct_identifier")
    quasi_id_count = sum(1 for p in profile_dicts if p["privacy_category"] == "quasi_identifier")
    sensitive_count = sum(
        1 for p in profile_dicts if p["privacy_category"] == "sensitive_attribute"
    )
    free_text_count = sum(1 for p in profile_dicts if p["privacy_category"] == "free_text_risk")

    direct_id_score = min(direct_id_count * DIRECT_IDENTIFIER_POINTS, DIRECT_ID_CAP)
    quasi_id_score = min(quasi_id_count * QUASI_IDENTIFIER_POINTS, QUASI_ID_CAP)
    sensitive_score = min(sensitive_count * SENSITIVE_ATTRIBUTE_POINTS, SENSITIVE_CAP)
    free_text_score = min(free_text_count * FREE_TEXT_RISK_POINTS, FREE_TEXT_CAP)

    finding_bonus = sum(FINDING_POINTS.get(f["finding_type"], 0) for f in finding_dicts)

    raw = direct_id_score + quasi_id_score + sensitive_score + free_text_score + finding_bonus
    score = min(100, raw)

    risk_band = _band(score)
    return score, risk_band


def _band(score: int) -> str:
    for threshold, band in RISK_BANDS:
        if score >= threshold:
            return band
    return "low"
