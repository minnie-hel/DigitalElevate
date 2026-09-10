from django.utils import timezone
from django_filters import rest_framework as filters
from rest_framework import status as http_status
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from activity.services import log_activity
from core.permissions import IsAdminOrManager

from .models import Invoice
from .serializers import InvoiceSerializer


class InvoiceFilter(filters.FilterSet):
    issued_after = filters.DateFilter(field_name="issue_date", lookup_expr="gte")
    issued_before = filters.DateFilter(field_name="issue_date", lookup_expr="lte")
    due_before = filters.DateFilter(field_name="due_date", lookup_expr="lte")
    unpaid = filters.BooleanFilter(method="filter_unpaid")

    class Meta:
        model = Invoice
        fields = [
            "client",
            "project",
            "status",
            "issued_after",
            "issued_before",
            "due_before",
            "unpaid",
        ]

    def filter_unpaid(self, queryset, name, value):
        unpaid_statuses = ["sent", "partially_paid", "overdue"]
        if value:
            return queryset.filter(status__in=unpaid_statuses)
        return queryset.exclude(status__in=unpaid_statuses)


class InvoiceViewSet(viewsets.ModelViewSet):
    serializer_class = InvoiceSerializer
    permission_classes = [IsAuthenticated, IsAdminOrManager]
    filterset_class = InvoiceFilter
    search_fields = ["invoice_number", "client__name", "project__name", "notes"]
    ordering_fields = ["issue_date", "due_date", "total_amount", "status", "invoice_number"]

    def get_queryset(self):
        return Invoice.objects.select_related("client", "project").prefetch_related(
            "items", "payments"
        )

    def perform_create(self, serializer):
        invoice = serializer.save()
        log_activity(
            actor=self.request.user,
            action="created",
            entity="invoice",
            entity_id=invoice.pk,
            entity_name=invoice.invoice_number,
            description=f"raised invoice {invoice.invoice_number} for {invoice.client.name}",
            client=invoice.client,
        )

    def perform_update(self, serializer):
        previous_status = serializer.instance.status
        invoice = serializer.save()
        if previous_status != invoice.status:
            log_activity(
                actor=self.request.user,
                action="status_changed",
                entity="invoice",
                entity_id=invoice.pk,
                entity_name=invoice.invoice_number,
                description=(
                    f"marked invoice {invoice.invoice_number} as "
                    f"{invoice.get_status_display()}"
                ),
                client=invoice.client,
            )
        else:
            log_activity(
                actor=self.request.user,
                action="updated",
                entity="invoice",
                entity_id=invoice.pk,
                entity_name=invoice.invoice_number,
                description=f"updated invoice {invoice.invoice_number}",
                client=invoice.client,
            )

    def perform_destroy(self, instance):
        number, pk, client = instance.invoice_number, instance.pk, instance.client
        instance.delete()
        log_activity(
            actor=self.request.user,
            action="deleted",
            entity="invoice",
            entity_id=pk,
            entity_name=number,
            description=f"deleted invoice {number}",
            client=client,
        )

    @action(detail=True, methods=["post"])
    def send(self, request, pk=None):
        """Move a draft to Sent so it starts counting as billed revenue."""
        invoice = self.get_object()
        if invoice.status != Invoice.Status.DRAFT:
            return Response(
                {"detail": "Only draft invoices can be sent."},
                status=http_status.HTTP_400_BAD_REQUEST,
            )
        invoice.status = Invoice.Status.SENT
        invoice.save(update_fields=["status", "updated_at"])
        invoice.sync_status()
        log_activity(
            actor=request.user,
            action="status_changed",
            entity="invoice",
            entity_id=invoice.pk,
            entity_name=invoice.invoice_number,
            description=f"sent invoice {invoice.invoice_number} to {invoice.client.name}",
            client=invoice.client,
        )
        return Response(self.get_serializer(invoice).data)

    @action(detail=True, methods=["post"])
    def cancel(self, request, pk=None):
        invoice = self.get_object()
        if invoice.status == Invoice.Status.PAID:
            return Response(
                {"detail": "A paid invoice cannot be cancelled."},
                status=http_status.HTTP_400_BAD_REQUEST,
            )
        invoice.status = Invoice.Status.CANCELLED
        invoice.save(update_fields=["status", "updated_at"])
        log_activity(
            actor=request.user,
            action="status_changed",
            entity="invoice",
            entity_id=invoice.pk,
            entity_name=invoice.invoice_number,
            description=f"cancelled invoice {invoice.invoice_number}",
            client=invoice.client,
        )
        return Response(self.get_serializer(invoice).data)

    @action(detail=False, methods=["post"])
    def refresh_overdue(self, request):
        """
        Flip any past-due unpaid invoice to Overdue.

        Called by the dashboard on load; in production this would also run on
        a daily schedule.
        """
        today = timezone.localdate()
        candidates = Invoice.objects.filter(
            due_date__lt=today,
            status__in=[Invoice.Status.SENT, Invoice.Status.PARTIALLY_PAID],
        )
        changed = 0
        for invoice in candidates:
            if invoice.balance > 0 and invoice.status != Invoice.Status.OVERDUE:
                invoice.status = Invoice.Status.OVERDUE
                invoice.save(update_fields=["status", "updated_at"])
                changed += 1
        return Response({"updated": changed})
