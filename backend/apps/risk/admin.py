from django.contrib import admin

from apps.risk.models import ActionRecommendation, RiskEvent


@admin.register(RiskEvent)
class RiskEventAdmin(admin.ModelAdmin):
    list_display = [
        "title",
        "organisation",
        "source_module",
        "severity",
        "status",
        "risk_score",
        "confidence",
        "created_at",
    ]
    list_filter = ["source_module", "severity", "status", "organisation"]
    search_fields = ["title", "summary", "event_type", "organisation__name"]
    readonly_fields = ["created_at", "updated_at", "severity_rank", "confidence_band", "is_open"]


@admin.register(ActionRecommendation)
class ActionRecommendationAdmin(admin.ModelAdmin):
    list_display = [
        "title",
        "organisation",
        "risk_event",
        "priority",
        "status",
        "owner",
        "updated_at",
    ]
    list_filter = ["priority", "status", "organisation"]
    search_fields = ["title", "description", "risk_event__title", "organisation__name"]
    readonly_fields = ["created_at", "updated_at"]
