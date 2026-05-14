from django.contrib import admin

from apps.common.models import ProcessingJob


@admin.register(ProcessingJob)
class ProcessingJobAdmin(admin.ModelAdmin):
    list_display = ["job_type", "organisation", "status", "progress", "started_at", "finished_at"]
    list_filter = ["job_type", "status", "organisation"]
    search_fields = ["job_type", "error_message", "organisation__name"]
    readonly_fields = ["created_at", "updated_at"]
