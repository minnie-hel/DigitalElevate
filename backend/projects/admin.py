from django.contrib import admin

from .models import Project


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ("name", "client", "status", "priority", "start_date", "due_date", "budget")
    list_filter = ("status", "priority")
    search_fields = ("name", "client__name")
    autocomplete_fields = ("client",)
    date_hierarchy = "due_date"
