from django.contrib import admin

from apps.assets.models import Asset


@admin.register(Asset)
class AssetAdmin(admin.ModelAdmin):
    list_display = [
        "name",
        "organisation",
        "asset_type",
        "criticality",
        "internet_exposed",
        "data_sensitivity",
        "updated_at",
    ]
    list_filter = [
        "asset_type",
        "criticality",
        "internet_exposed",
        "data_sensitivity",
        "organisation",
    ]
    search_fields = ["name", "owner_name", "vendor", "product", "organisation__name"]
    readonly_fields = ["created_at", "updated_at"]
