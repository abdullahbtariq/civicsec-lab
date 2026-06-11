"""
CSV login log upload parser for LogLens.

Validates the uploaded file, parses rows, and creates LoginEvent objects.
Original file is NOT retained after parsing.
"""

import csv
import io
import uuid
from datetime import datetime

from django.utils import timezone
from django.utils.dateparse import parse_datetime

from apps.loglens.models import LoginEvent

REQUIRED_COLUMNS = {"user_email", "timestamp", "event_type", "success"}
OPTIONAL_COLUMNS = {
    "ip_address",
    "country",
    "city",
    "device_id",
    "user_agent",
    "resource_accessed",
}
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB
MAX_ROWS = 50_000

VALID_EVENT_TYPES = {choice[0] for choice in LoginEvent.EventType.choices}


class CSVUploadError(Exception):
    pass


def _parse_bool(value: str) -> bool:
    return value.strip().lower() in {"true", "1", "yes", "success"}


def _parse_timestamp(value: str) -> datetime:
    dt = parse_datetime(value.strip())
    if dt is None:
        # Try ISO-like formats
        for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%dT%H:%M:%S", "%d/%m/%Y %H:%M"):
            try:
                dt = datetime.strptime(value.strip(), fmt)
                break
            except ValueError:
                continue
    if dt is None:
        raise CSVUploadError(f"Cannot parse timestamp: '{value}'")
    if timezone.is_naive(dt):
        dt = timezone.make_aware(dt)
    return dt


def parse_and_save_csv(
    organisation,
    file_obj,
    filename: str,
    file_size: int,
) -> dict:
    """
    Parse a CSV login log file and create LoginEvent objects.

    Returns a summary dict. The raw file content is not stored.
    """
    if file_size > MAX_FILE_SIZE_BYTES:
        raise CSVUploadError(
            f"File too large ({file_size / 1024 / 1024:.1f} MB). Maximum is 10 MB."
        )

    content = file_obj.read()
    if isinstance(content, bytes):
        try:
            text = content.decode("utf-8")
        except UnicodeDecodeError:
            text = content.decode("latin-1")
    else:
        text = content

    reader = csv.DictReader(io.StringIO(text))
    if reader.fieldnames is None:
        raise CSVUploadError("File appears to be empty or has no header row.")

    columns = {c.strip().lower() for c in reader.fieldnames}
    missing = REQUIRED_COLUMNS - columns
    if missing:
        raise CSVUploadError(
            f"CSV is missing required columns: {', '.join(sorted(missing))}. "
            f"Required: {', '.join(sorted(REQUIRED_COLUMNS))}."
        )

    batch_id = str(uuid.uuid4())[:8]
    events: list[LoginEvent] = []
    errors: list[str] = []
    row_num = 0

    for row_num, row in enumerate(reader, start=2):  # start=2 because row 1 is header
        if row_num > MAX_ROWS + 1:
            errors.append(f"File exceeds {MAX_ROWS} row limit — truncated.")
            break
        try:
            # Normalise column names
            row = {k.strip().lower(): v.strip() for k, v in row.items() if k}

            user_id = row.get("user_email", "").strip()
            if not user_id:
                errors.append(f"Row {row_num}: missing user_email — skipped.")
                continue

            raw_ts = row.get("timestamp", "")
            if not raw_ts:
                errors.append(f"Row {row_num}: missing timestamp — skipped.")
                continue
            ts = _parse_timestamp(raw_ts)

            raw_event_type = row.get("event_type", "login_success").lower().strip()
            if raw_event_type not in VALID_EVENT_TYPES:
                raw_event_type = LoginEvent.EventType.LOGIN_SUCCESS

            success = _parse_bool(row.get("success", "true"))

            events.append(
                LoginEvent(
                    organisation=organisation,
                    user_identifier=user_id,
                    timestamp=ts,
                    ip_address=row.get("ip_address") or None,
                    country=row.get("country", ""),
                    city=row.get("city", ""),
                    device_id=row.get("device_id", ""),
                    user_agent=row.get("user_agent", ""),
                    event_type=raw_event_type,
                    success=success,
                    resource_accessed=row.get("resource_accessed", ""),
                    upload_batch=batch_id,
                )
            )
        except CSVUploadError as exc:
            errors.append(f"Row {row_num}: {exc}")
        except Exception as exc:  # noqa: BLE001
            errors.append(f"Row {row_num}: unexpected error — {exc}")

    if not events:
        raise CSVUploadError(
            "No valid events could be parsed from the file. "
            + (" ".join(errors) if errors else "Check the file format.")
        )

    LoginEvent.objects.bulk_create(events)

    return {
        "batch_id": batch_id,
        "filename": filename,
        "rows_parsed": row_num - 1,
        "events_created": len(events),
        "errors": errors[:20],  # cap error list for response
    }
