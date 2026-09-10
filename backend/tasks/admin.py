from django.contrib import admin

from .models import Task


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ("title", "project", "assigned_to", "status", "priority", "due_date")
    list_filter = ("status", "priority")
    search_fields = ("title", "description", "project__name", "assigned_to__name")
    autocomplete_fields = ("project", "assigned_to")
