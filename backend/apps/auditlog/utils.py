from typing import Any

from apps.auditlog.models import AuditLog


def record_audit_event(
    *,
    action: str,
    actor=None,
    organisation=None,
    object_type: str = "",
    object_id: str = "",
    ip_address: str = "",
    user_agent: str = "",
    metadata: dict[str, Any] | None = None,
) -> AuditLog:
    return AuditLog.objects.create(
        actor=actor,
        organisation=organisation,
        action=action,
        object_type=object_type,
        object_id=str(object_id) if object_id is not None else "",
        ip_address=ip_address or None,
        user_agent=user_agent,
        metadata=metadata or {},
    )
