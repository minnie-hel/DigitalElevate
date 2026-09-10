from decimal import Decimal

from django.db.models import Count, DecimalField, OuterRef, Q, Subquery, Sum, Value
from django.db.models.functions import Coalesce
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from activity.models import ActivityLog
from activity.serializers import ActivityLogSerializer
from activity.services import log_activity
from core.permissions import IsAdminOrManager

from .models import Client
from .serializers import ClientSerializer

MONEY = DecimalField(max_digits=15, decimal_places=2)
ZERO = Value(Decimal("0.00"), output_field=MONEY)


def invoiced_subquery():
    """Billed total per client, excluding drafts and cancelled invoices."""
    from invoices.models import Invoice

    return Subquery(
        Invoice.objects.filter(client=OuterRef("pk"))
        .exclude(status__in=["draft", "cancelled"])
        .values("client")
        .annotate(value=Sum("total_amount"))
        .values("value")[:1],
        output_field=MONEY,
    )


def paid_subquery():
    """Cash received per client across all of its invoices."""
    from payments.models import Payment

    return Subquery(
        Payment.objects.filter(invoice__client=OuterRef("pk"))
        .values("invoice__client")
        .annotate(value=Sum("amount"))
        .values("value")[:1],
        output_field=MONEY,
    )


class ClientViewSet(viewsets.ModelViewSet):
    serializer_class = ClientSerializer
    permission_classes = [IsAuthenticated, IsAdminOrManager]
    filterset_fields = ["status", "industry"]
    search_fields = ["name", "contact_person", "email", "phone", "industry"]
    ordering_fields = ["name", "created_at", "status"]

    def get_queryset(self):
        # Counts come from joins (safe with distinct); money comes from
        # subqueries so multiple joins cannot inflate the sums.
        return Client.objects.annotate(
            annotated_total_projects=Count("projects", distinct=True),
            annotated_active_projects=Count(
                "projects",
                filter=Q(projects__status__in=["planning", "in_progress"]),
                distinct=True,
            ),
            annotated_total_invoiced=Coalesce(invoiced_subquery(), ZERO),
            annotated_total_paid=Coalesce(paid_subquery(), ZERO),
        )

    def perform_create(self, serializer):
        client = serializer.save()
        log_activity(
            actor=self.request.user,
            action="created",
            entity="client",
            entity_id=client.pk,
            entity_name=client.name,
            description=f"added new client {client.name}",
            client=client,
        )

    def perform_update(self, serializer):
        client = serializer.save()
        log_activity(
            actor=self.request.user,
            action="updated",
            entity="client",
            entity_id=client.pk,
            entity_name=client.name,
            description=f"updated client {client.name}",
            client=client,
        )

    def perform_destroy(self, instance):
        name, pk = instance.name, instance.pk
        instance.delete()
        log_activity(
            actor=self.request.user,
            action="deleted",
            entity="client",
            entity_id=pk,
            entity_name=name,
            description=f"deleted client {name}",
        )

    # -- Detail page tabs ----------------------------------------------------

    @action(detail=True, methods=["get"])
    def projects(self, request, pk=None):
        from projects.serializers import ProjectSerializer

        client = self.get_object()
        queryset = client.projects.select_related("client").order_by("-created_at")
        return Response(
            ProjectSerializer(queryset, many=True, context=self.get_serializer_context()).data
        )

    @action(detail=True, methods=["get"])
    def tasks(self, request, pk=None):
        from tasks.models import Task
        from tasks.serializers import TaskSerializer

        client = self.get_object()
        queryset = (
            Task.objects.filter(project__client=client)
            .select_related("project", "assigned_to")
            .order_by("-created_at")
        )
        return Response(
            TaskSerializer(queryset, many=True, context=self.get_serializer_context()).data
        )

    @action(detail=True, methods=["get"])
    def invoices(self, request, pk=None):
        from invoices.serializers import InvoiceSerializer

        client = self.get_object()
        queryset = (
            client.invoices.select_related("client", "project")
            .prefetch_related("items", "payments")
            .order_by("-issue_date", "-id")
        )
        return Response(
            InvoiceSerializer(queryset, many=True, context=self.get_serializer_context()).data
        )

    @action(detail=True, methods=["get"])
    def payments(self, request, pk=None):
        from payments.models import Payment
        from payments.serializers import PaymentSerializer

        client = self.get_object()
        queryset = (
            Payment.objects.filter(invoice__client=client)
            .select_related("invoice", "invoice__client")
            .order_by("-payment_date", "-id")
        )
        return Response(
            PaymentSerializer(queryset, many=True, context=self.get_serializer_context()).data
        )

    @action(detail=True, methods=["get"])
    def activity(self, request, pk=None):
        client = self.get_object()
        queryset = ActivityLog.objects.filter(client=client).select_related("actor")[:100]
        return Response(
            ActivityLogSerializer(queryset, many=True, context=self.get_serializer_context()).data
        )

    @action(detail=True, methods=["get"])
    def overview(self, request, pk=None):
        """Headline numbers for the client's Overview tab."""
        from tasks.models import Task

        client = self.get_object()
        task_queryset = Task.objects.filter(project__client=client)
        return Response(
            {
                "client": self.get_serializer(client).data,
                "projects": {
                    "total": client.total_projects,
                    "active": client.active_projects,
                    "completed": client.projects.filter(status="completed").count(),
                },
                "tasks": {
                    "total": task_queryset.count(),
                    "completed": task_queryset.filter(status="completed").count(),
                    "open": task_queryset.exclude(status="completed").count(),
                },
                "finance": {
                    "total_invoiced": str(client.total_invoiced),
                    "total_paid": str(client.total_paid),
                    "outstanding": str(client.outstanding),
                },
            }
        )
