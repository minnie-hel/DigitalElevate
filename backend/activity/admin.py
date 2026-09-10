from django.contrib import admin

from .models import ActivityLog


@admin.register(ActivityLog)
class ActivityLogAdmin(admin.ModelAdmin):
    list_display = ("created_at", "actor_name", "action", "entity", "entity_name")
    list_filter = ("action", "entity")
    search_fields = ("description", "entity_name", "actor_name")
    date_hierarchy = "created_at"

    def has_add_permission(self, request):
        return False
