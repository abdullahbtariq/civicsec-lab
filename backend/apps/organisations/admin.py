from django.contrib import admin

from apps.organisations.models import Organisation


@admin.register(Organisation)
class OrganisationAdmin(admin.ModelAdmin):
    list_display = ["name", "slug", "sector", "country", "risk_profile", "created_at"]
    list_filter = ["risk_profile", "sector", "country"]
    search_fields = ["name", "slug", "sector", "country"]
    readonly_fields = ["created_at", "updated_at"]
    prepopulated_fields = {"slug": ("name",)}
