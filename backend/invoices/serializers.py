from django.db import transaction
from rest_framework import serializers

from .models import Invoice, InvoiceItem


class InvoiceItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = InvoiceItem
        fields = ("id", "description", "quantity", "unit_price", "line_total")
        read_only_fields = ("line_total",)


class InvoiceSerializer(serializers.ModelSerializer):
    """
    Invoices are written together with their line items in one request, so
    totals are always consistent with what the user submitted.
    """

    items = InvoiceItemSerializer(many=True, required=False)
    client_name = serializers.CharField(source="client.name", read_only=True)
    project_name = serializers.CharField(source="project.name", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    amount_paid = serializers.DecimalField(
        max_digits=15, decimal_places=2, read_only=True
    )
    balance = serializers.DecimalField(max_digits=15, decimal_places=2, read_only=True)
    is_overdue = serializers.BooleanField(read_only=True)

    class Meta:
        model = Invoice
        fields = (
            "id",
            "invoice_number",
            "client",
            "client_name",
            "project",
            "project_name",
            "issue_date",
            "due_date",
            "tax_rate",
            "subtotal_amount",
            "tax_amount",
            "total_amount",
            "amount_paid",
            "balance",
            "status",
            "status_display",
            "is_overdue",
            "notes",
            "items",
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "invoice_number",
            "subtotal_amount",
            "tax_amount",
            "total_amount",
        )

    def validate(self, attrs):
        issue_date = attrs.get("issue_date", getattr(self.instance, "issue_date", None))
        due_date = attrs.get("due_date", getattr(self.instance, "due_date", None))
        if issue_date and due_date and due_date < issue_date:
            raise serializers.ValidationError(
                {"due_date": "Due date cannot be earlier than the issue date."}
            )

        project = attrs.get("project", getattr(self.instance, "project", None))
        client = attrs.get("client", getattr(self.instance, "client", None))
        if project and client and project.client_id != client.id:
            raise serializers.ValidationError(
                {"project": "That project belongs to a different client."}
            )
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        items = validated_data.pop("items", [])
        invoice = Invoice.objects.create(**validated_data)
        for item in items:
            InvoiceItem.objects.create(invoice=invoice, **item)
        invoice.recalculate_totals()
        invoice.sync_status()
        return invoice

    @transaction.atomic
    def update(self, instance, validated_data):
        items = validated_data.pop("items", None)
        for field, value in validated_data.items():
            setattr(instance, field, value)
        instance.save()

        if items is not None:
            # Replace the whole set: line items are only ever edited as part
            # of the invoice they belong to.
            instance.items.all().delete()
            for item in items:
                InvoiceItem.objects.create(invoice=instance, **item)

        instance.recalculate_totals()
        instance.sync_status()
        return instance


class InvoiceSummarySerializer(serializers.ModelSerializer):
    """Compact shape for embedding inside payment payloads."""

    client_name = serializers.CharField(source="client.name", read_only=True)

    class Meta:
        model = Invoice
        fields = (
            "id",
            "invoice_number",
            "client",
            "client_name",
            "total_amount",
            "status",
            "due_date",
        )
