from django.contrib import admin

from apps.incidents.models import Incident, IncidentTimelineEntry


class IncidentTimelineEntryInline(admin.TabularInline):
    model = IncidentTimelineEntry
    extra = 0
    readonly_fields = ["created_at"]


@admin.register(Incident)
class IncidentAdmin(admin.ModelAdmin):
    list_display = [
        "title",
        "organisation",
        "incident_type",
        "severity",
        "status",
        "owner",
        "opened_at",
    ]
    list_filter = ["incident_type", "severity", "status", "organisation"]
    search_fields = ["title", "description", "organisation__name", "owner__email"]
    readonly_fields = ["created_at", "updated_at"]
    filter_horizontal = ["linked_risk_events"]
    inlines = [IncidentTimelineEntryInline]


@admin.register(IncidentTimelineEntry)
class IncidentTimelineEntryAdmin(admin.ModelAdmin):
    list_display = ["title", "organisation", "incident", "entry_type", "actor", "timestamp"]
    list_filter = ["entry_type", "organisation"]
    search_fields = [
        "title",
        "description",
        "incident__title",
        "actor__email",
        "organisation__name",
    ]
    readonly_fields = ["created_at"]
