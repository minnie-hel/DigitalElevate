from decimal import Decimal

from rest_framework import serializers

from .models import Client

ZERO = Decimal("0.00")


class ClientSerializer(serializers.ModelSerializer):
    """List/write representation, including rollups annotated by the viewset."""

    status_display = serializers.CharField(source="get_status_display", read_only=True)
    total_projects = serializers.SerializerMethodField()
    active_projects = serializers.SerializerMethodField()
    total_invoiced = serializers.SerializerMethodField()
    total_paid = serializers.SerializerMethodField()
    outstanding = serializers.SerializerMethodField()

    class Meta:
        model = Client
        fields = (
            "id",
            "name",
            "contact_person",
            "email",
            "phone",
            "address",
            "industry",
            "status",
            "status_display",
            "notes",
            "total_projects",
            "active_projects",
            "total_invoiced",
            "total_paid",
            "outstanding",
            "created_at",
            "updated_at",
        )

    def _annotated(self, obj, attr, fallback_property):
        value = getattr(obj, attr, None)
        if value is not None:
            return value
        return getattr(obj, fallback_property)

    def get_total_projects(self, obj):
        return self._annotated(obj, "annotated_total_projects", "total_projects")

    def get_active_projects(self, obj):
        return self._annotated(obj, "annotated_active_projects", "active_projects")

    def get_total_invoiced(self, obj):
        value = self._annotated(obj, "annotated_total_invoiced", "total_invoiced")
        return str(value or ZERO)

    def get_total_paid(self, obj):
        value = self._annotated(obj, "annotated_total_paid", "total_paid")
        return str(value or ZERO)

    def get_outstanding(self, obj):
        invoiced = self._annotated(obj, "annotated_total_invoiced", "total_invoiced") or ZERO
        paid = self._annotated(obj, "annotated_total_paid", "total_paid") or ZERO
        return str(invoiced - paid)


class ClientSummarySerializer(serializers.ModelSerializer):
    """Compact shape for embedding inside project/invoice payloads."""

    class Meta:
        model = Client
        fields = ("id", "name", "contact_person", "email", "phone", "status")
