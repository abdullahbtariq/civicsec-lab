from django.contrib import admin

from apps.auditlog.models import AuditLog


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ["action", "organisation", "actor", "object_type", "object_id", "created_at"]
    list_filter = ["action", "object_type", "organisation"]
    search_fields = ["action", "object_type", "object_id", "actor__email", "organisation__name"]
    readonly_fields = [
        "organisation",
        "actor",
        "action",
        "object_type",
        "object_id",
        "ip_address",
        "user_agent",
        "metadata",
        "created_at",
    ]
