from django.contrib import admin

from .models import Client


@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    list_display = ("name", "contact_person", "email", "phone", "industry", "status")
    list_filter = ("status", "industry")
    search_fields = ("name", "contact_person", "email", "phone")
