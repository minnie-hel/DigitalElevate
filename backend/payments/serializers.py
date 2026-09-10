from decimal import Decimal

from rest_framework import serializers

from .models import Payment

ZERO = Decimal("0.00")


class PaymentSerializer(serializers.ModelSerializer):
    invoice_number = serializers.CharField(source="invoice.invoice_number", read_only=True)
    client_id = serializers.IntegerField(source="invoice.client_id", read_only=True)
    client_name = serializers.CharField(source="invoice.client.name", read_only=True)
    method_display = serializers.CharField(source="get_payment_method_display", read_only=True)
    invoice_total = serializers.DecimalField(
        source="invoice.total_amount",
        max_digits=15,
        decimal_places=2,
        read_only=True,
    )
    invoice_balance = serializers.SerializerMethodField()

    class Meta:
        model = Payment
        fields = (
            "id",
            "invoice",
            "invoice_number",
            "invoice_total",
            "invoice_balance",
            "client_id",
            "client_name",
            "amount",
            "payment_date",
            "payment_method",
            "method_display",
            "reference",
            "notes",
            "created_at",
            "updated_at",
        )

    def get_invoice_balance(self, obj):
        return str(obj.invoice.balance)

    def validate(self, attrs):
        invoice = attrs.get("invoice", getattr(self.instance, "invoice", None))
        amount = attrs.get("amount", getattr(self.instance, "amount", ZERO))

        if invoice is None:
            return attrs

        if invoice.status == invoice.Status.CANCELLED:
            raise serializers.ValidationError(
                {"invoice": "Payments cannot be recorded against a cancelled invoice."}
            )
        if invoice.status == invoice.Status.DRAFT:
            raise serializers.ValidationError(
                {"invoice": "Send the invoice before recording a payment against it."}
            )

        # Overpayment is almost always a data-entry error, so reject it while
        # allowing an edit to keep its own current amount in the calculation.
        already_paid = invoice.amount_paid
        if self.instance is not None:
            already_paid -= self.instance.amount
        if amount + already_paid > invoice.total_amount:
            remaining = invoice.total_amount - already_paid
            raise serializers.ValidationError(
                {
                    "amount": (
                        f"That exceeds the outstanding balance. "
                        f"At most {remaining} can be recorded."
                    )
                }
            )
        return attrs
