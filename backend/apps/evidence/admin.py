from django.contrib import admin

from apps.evidence.models import EvidenceItem


@admin.register(EvidenceItem)
class EvidenceItemAdmin(admin.ModelAdmin):
    list_display = [
        "title",
        "organisation",
        "risk_event",
        "evidence_type",
        "confidence",
        "created_at",
    ]
    list_filter = ["evidence_type", "organisation"]
    search_fields = ["title", "description", "source", "risk_event__title", "organisation__name"]
    readonly_fields = ["created_at"]
