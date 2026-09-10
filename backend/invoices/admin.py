from django.contrib import admin

from .models import Invoice, InvoiceItem


class InvoiceItemInline(admin.TabularInline):
    model = InvoiceItem
    extra = 1
    readonly_fields = ("line_total",)


@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = (
        "invoice_number",
        "client",
        "project",
        "issue_date",
        "due_date",
        "total_amount",
        "status",
    )
    list_filter = ("status", "issue_date")
    search_fields = ("invoice_number", "client__name", "project__name")
    autocomplete_fields = ("client", "project")
    readonly_fields = ("invoice_number", "subtotal_amount", "tax_amount", "total_amount")
    inlines = [InvoiceItemInline]

    def save_related(self, request, form, formsets, change):
        super().save_related(request, form, formsets, change)
        invoice = form.instance
        invoice.recalculate_totals()
        invoice.sync_status()
