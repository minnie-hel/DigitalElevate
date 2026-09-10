from django_filters import rest_framework as filters
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from activity.services import log_activity
from core.permissions import IsAdminOrManager

from .models import Payment
from .serializers import PaymentSerializer


class PaymentFilter(filters.FilterSet):
    client = filters.NumberFilter(field_name="invoice__client_id")
    paid_after = filters.DateFilter(field_name="payment_date", lookup_expr="gte")
    paid_before = filters.DateFilter(field_name="payment_date", lookup_expr="lte")

    class Meta:
        model = Payment
        fields = ["invoice", "client", "payment_method", "paid_after", "paid_before"]


class PaymentViewSet(viewsets.ModelViewSet):
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated, IsAdminOrManager]
    filterset_class = PaymentFilter
    search_fields = ["reference", "invoice__invoice_number", "invoice__client__name", "notes"]
    ordering_fields = ["payment_date", "amount", "created_at"]

    def get_queryset(self):
        return Payment.objects.select_related("invoice", "invoice__client")

    def perform_create(self, serializer):
        payment = serializer.save()
        invoice = payment.invoice
        invoice.refresh_from_db()
        log_activity(
            actor=self.request.user,
            action="payment",
            entity="payment",
            entity_id=payment.pk,
            entity_name=invoice.invoice_number,
            description=(
                f"recorded a payment of {payment.amount} on invoice "
                f"{invoice.invoice_number}"
            ),
            client=invoice.client,
        )
        # A payment that clears the balance is worth its own line in the feed.
        if invoice.status == invoice.Status.PAID:
            log_activity(
                actor=self.request.user,
                action="status_changed",
                entity="invoice",
                entity_id=invoice.pk,
                entity_name=invoice.invoice_number,
                description=f"invoice {invoice.invoice_number} marked as paid",
                client=invoice.client,
            )

    def perform_update(self, serializer):
        payment = serializer.save()
        log_activity(
            actor=self.request.user,
            action="updated",
            entity="payment",
            entity_id=payment.pk,
            entity_name=payment.invoice.invoice_number,
            description=f"updated a payment on invoice {payment.invoice.invoice_number}",
            client=payment.invoice.client,
        )

    def perform_destroy(self, instance):
        invoice = instance.invoice
        amount, pk = instance.amount, instance.pk
        instance.delete()
        log_activity(
            actor=self.request.user,
            action="deleted",
            entity="payment",
            entity_id=pk,
            entity_name=invoice.invoice_number,
            description=(
                f"removed a payment of {amount} from invoice {invoice.invoice_number}"
            ),
            client=invoice.client,
        )
