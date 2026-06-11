"""
DataPrivacy Doctor — dataset profiler.

Orchestrates: column profiling → detection → risk scoring → finding creation.
"""

import csv
import io

from django.utils import timezone

from apps.privacy_doctor.models import DatasetColumnProfile, PrivacyFinding, UploadedDataset
from apps.privacy_doctor.services.detection import (
    classify_column,
    detect_direct_identifiers,
    detect_excessive_data_collection,
    detect_high_uniqueness,
    detect_quasi_identifier_combination,
    detect_risky_free_text,
    detect_sensitive_attributes,
    infer_column_type,
    mask_value,
)
from apps.privacy_doctor.services.risk_score import calculate_dataset_risk_score

MAX_SAMPLE_VALUES = 5


def scan_dataset(dataset: UploadedDataset, csv_bytes: bytes) -> dict:
    """
    Profile a dataset from its raw CSV bytes.

    - Creates DatasetColumnProfile records for each column.
    - Creates PrivacyFinding records for detected issues.
    - Updates dataset privacy_risk_score, risk_band, processing_status.
    - Deletes file if retention_policy is delete_after_processing.

    Returns a summary dict.
    """
    dataset.processing_status = UploadedDataset.ProcessingStatus.PROCESSING
    dataset.save(update_fields=["processing_status"])

    try:
        reader = csv.DictReader(io.StringIO(csv_bytes.decode("utf-8", errors="replace")))
        rows = list(reader)
        columns = reader.fieldnames or []
    except Exception as exc:
        dataset.processing_status = UploadedDataset.ProcessingStatus.FAILED
        dataset.save(update_fields=["processing_status"])
        raise ValueError(f"Could not parse CSV: {exc}") from exc

    row_count = len(rows)
    column_count = len(columns)

    # --- Build per-column profiles ---
    profile_dicts = []
    for col in columns:
        all_values = [str(r.get(col, "") or "") for r in rows]
        non_empty = [v for v in all_values if v.strip()]
        uniqueness_ratio = len(set(non_empty)) / len(all_values) if all_values else 0.0
        missingness_ratio = (
            (len(all_values) - len(non_empty)) / len(all_values) if all_values else 0.0
        )

        sample_raw = non_empty[:MAX_SAMPLE_VALUES]
        inferred_type = infer_column_type(col, sample_raw)
        classification = classify_column(col, inferred_type, sample_raw)

        sample_masked = [mask_value(v, inferred_type) for v in sample_raw]

        profile_dicts.append(
            {
                "column_name": col,
                "inferred_type": inferred_type,
                "privacy_category": classification["privacy_category"],
                "uniqueness_ratio": round(uniqueness_ratio, 4),
                "missingness_ratio": round(missingness_ratio, 4),
                "sample_values_masked": sample_masked,
                "risk_score": classification["risk_score"],
                "recommended_transformation": classification["recommended_transformation"],
                "notes": classification["notes"],
            }
        )

    # Bulk-create column profiles (delete any stale ones first)
    dataset.column_profiles.all().delete()
    DatasetColumnProfile.objects.bulk_create(
        [DatasetColumnProfile(dataset=dataset, **p) for p in profile_dicts]
    )

    # --- Generate findings ---
    finding_dicts = []
    finding_dicts.extend(detect_direct_identifiers(profile_dicts))
    finding_dicts.extend(detect_quasi_identifier_combination(profile_dicts))
    finding_dicts.extend(detect_high_uniqueness(profile_dicts))
    finding_dicts.extend(detect_sensitive_attributes(profile_dicts))
    finding_dicts.extend(detect_risky_free_text(profile_dicts))
    finding_dicts.extend(detect_excessive_data_collection(profile_dicts, row_count))

    dataset.findings.all().delete()
    PrivacyFinding.objects.bulk_create(
        [PrivacyFinding(dataset=dataset, **f) for f in finding_dicts]
    )

    # --- Risk score ---
    risk_score, risk_band = calculate_dataset_risk_score(profile_dicts, finding_dicts)

    dataset.row_count = row_count
    dataset.column_count = column_count
    dataset.privacy_risk_score = risk_score
    dataset.risk_band = risk_band
    dataset.processing_status = UploadedDataset.ProcessingStatus.COMPLETE
    dataset.processed_at = timezone.now()
    dataset.save(
        update_fields=[
            "row_count",
            "column_count",
            "privacy_risk_score",
            "risk_band",
            "processing_status",
            "processed_at",
        ]
    )

    # --- Honour retention policy ---
    if (
        dataset.retention_policy == UploadedDataset.RetentionPolicy.DELETE_AFTER_PROCESSING
        and not dataset.original_file_deleted
    ):
        _delete_stored_file(dataset)

    return {
        "dataset_id": dataset.id,
        "row_count": row_count,
        "column_count": column_count,
        "privacy_risk_score": risk_score,
        "risk_band": risk_band,
        "findings_created": len(finding_dicts),
        "direct_identifier_count": sum(
            1 for p in profile_dicts if p["privacy_category"] == "direct_identifier"
        ),
        "quasi_identifier_count": sum(
            1 for p in profile_dicts if p["privacy_category"] == "quasi_identifier"
        ),
        "sensitive_attribute_count": sum(
            1 for p in profile_dicts if p["privacy_category"] == "sensitive_attribute"
        ),
    }


def _delete_stored_file(dataset: UploadedDataset) -> None:
    """Delete the stored CSV file from disk and mark the dataset accordingly."""
    import os

    if dataset.stored_file_path:
        try:
            if os.path.exists(dataset.stored_file_path):
                os.remove(dataset.stored_file_path)
        except OSError:
            pass
    dataset.original_file_deleted = True
    dataset.stored_file_path = ""
    dataset.save(update_fields=["original_file_deleted", "stored_file_path"])
