from django.contrib import admin

from .models import Payment


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ("invoice", "amount", "payment_date", "payment_method", "reference")
    list_filter = ("payment_method", "payment_date")
    search_fields = ("reference", "invoice__invoice_number", "invoice__client__name")
    autocomplete_fields = ("invoice",)
    date_hierarchy = "payment_date"
