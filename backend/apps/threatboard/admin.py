from django.contrib import admin

from apps.threatboard.models import (
    AssetVulnerabilityMatch,
    ThreatIngestionRun,
    Vulnerability,
    VulnerabilityScore,
)


@admin.register(Vulnerability)
class VulnerabilityAdmin(admin.ModelAdmin):
    list_display = [
        "cve_id",
        "title",
        "vendor",
        "product",
        "source",
        "date_added_to_kev",
        "due_date",
        "updated_at",
    ]
    search_fields = ["cve_id", "title", "vendor", "product", "description"]
    list_filter = ["source", "known_ransomware_campaign_use", "date_added_to_kev"]
    readonly_fields = ["created_at", "updated_at"]
    date_hierarchy = "date_added_to_kev"


@admin.register(VulnerabilityScore)
class VulnerabilityScoreAdmin(admin.ModelAdmin):
    list_display = [
        "vulnerability",
        "kev_known_exploited",
        "epss_score",
        "epss_percentile",
        "cvss_score",
        "cvss_severity",
        "last_epss_checked_at",
    ]
    search_fields = ["vulnerability__cve_id", "vulnerability__title"]
    list_filter = ["kev_known_exploited", "cvss_severity"]
    readonly_fields = ["created_at", "updated_at"]


@admin.register(AssetVulnerabilityMatch)
class AssetVulnerabilityMatchAdmin(admin.ModelAdmin):
    list_display = [
        "asset",
        "vulnerability",
        "organisation",
        "risk_band",
        "calculated_risk_score",
        "match_method",
        "remediation_status",
        "status",
        "last_seen_at",
    ]
    search_fields = [
        "asset__name",
        "vulnerability__cve_id",
        "vulnerability__title",
        "organisation__name",
    ]
    list_filter = ["risk_band", "status", "remediation_status", "match_method"]
    readonly_fields = ["created_at", "updated_at", "first_seen_at", "last_seen_at"]
    date_hierarchy = "last_seen_at"


@admin.register(ThreatIngestionRun)
class ThreatIngestionRunAdmin(admin.ModelAdmin):
    list_display = [
        "run_type",
        "status",
        "source",
        "organisation",
        "records_seen",
        "records_created",
        "records_updated",
        "records_failed",
        "started_at",
    ]
    search_fields = ["organisation__name", "error_message"]
    list_filter = ["run_type", "status", "source"]
    readonly_fields = ["created_at", "updated_at", "started_at", "finished_at"]
    date_hierarchy = "started_at"
