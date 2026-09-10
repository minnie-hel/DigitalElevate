"""
Aggregated read-only endpoints powering the dashboard and Reports screen.

Everything here is computed in the database rather than in Python, so these
stay fast as the dataset grows.
"""

from datetime import date
from decimal import Decimal

from django.db.models import Count, DecimalField, OuterRef, Q, Subquery, Sum
from django.db.models.functions import TruncMonth
from django.utils import timezone
from rest_framework.decorators import api_view
from rest_framework.response import Response

from accounts.models import TeamMember
from activity.models import ActivityLog
from activity.serializers import ActivityLogSerializer
from clients.models import Client
from invoices.models import Invoice
from payments.models import Payment
from projects.models import Project
from tasks.models import Task

ZERO = Decimal("0.00")

# Invoice statuses that represent money actually billed to a client.
BILLED = ["sent", "partially_paid", "paid", "overdue"]
UNPAID = ["sent", "partially_paid", "overdue"]


def money(value):
    """Serialise a monetary aggregate as a plain string, never null."""
    return str((value or ZERO).quantize(Decimal("0.01")))


def month_range(months_back=11):
    """First day of the month `months_back` months ago, through today."""
    today = timezone.localdate()
    year = today.year
    month = today.month - months_back
    while month <= 0:
        month += 12
        year -= 1
    return date(year, month, 1), today


@api_view(["GET"])
def dashboard(request):
    """The KPI block, progress bars and activity feed on the dashboard."""
    today = timezone.localdate()

    client_stats = Client.objects.aggregate(
        total=Count("id"),
        active=Count("id", filter=Q(status="active")),
        inactive=Count("id", filter=Q(status="inactive")),
        prospects=Count("id", filter=Q(status="prospect")),
    )

    project_stats = Project.objects.aggregate(
        total=Count("id"),
        active=Count("id", filter=Q(status__in=["planning", "in_progress"])),
        completed=Count("id", filter=Q(status="completed")),
        on_hold=Count("id", filter=Q(status="on_hold")),
        overdue=Count(
            "id",
            filter=Q(due_date__lt=today) & ~Q(status__in=["completed", "cancelled"]),
        ),
    )

    task_stats = Task.objects.aggregate(
        total=Count("id"),
        completed=Count("id", filter=Q(status="completed")),
        pending=Count("id", filter=~Q(status="completed")),
        blocked=Count("id", filter=Q(status="blocked")),
        overdue=Count("id", filter=Q(due_date__lt=today) & ~Q(status="completed")),
    )

    invoice_stats = Invoice.objects.aggregate(
        total_invoiced=Sum("total_amount", filter=Q(status__in=BILLED)),
        unpaid_count=Count("id", filter=Q(status__in=UNPAID)),
        overdue_count=Count("id", filter=Q(status="overdue")),
        draft_count=Count("id", filter=Q(status="draft")),
    )

    total_paid = Payment.objects.aggregate(value=Sum("amount"))["value"] or ZERO
    total_invoiced = invoice_stats["total_invoiced"] or ZERO

    # Outstanding is billed-but-unreceived, restricted to unpaid invoices so
    # fully settled ones cannot drag the figure around.
    unpaid_invoiced = (
        Invoice.objects.filter(status__in=UNPAID).aggregate(value=Sum("total_amount"))["value"]
        or ZERO
    )
    unpaid_received = (
        Payment.objects.filter(invoice__status__in=UNPAID).aggregate(value=Sum("amount"))["value"]
        or ZERO
    )
    outstanding = unpaid_invoiced - unpaid_received

    # Progress bars for the projects currently in flight.
    active_projects = (
        Project.objects.filter(status__in=["planning", "in_progress"])
        .select_related("client")
        .annotate(
            # Prefixed because Project already exposes `total_tasks` as a
            # read-only property, which an annotation cannot assign to.
            annotated_total_tasks=Count("tasks", distinct=True),
            annotated_done_tasks=Count(
                "tasks", filter=Q(tasks__status="completed"), distinct=True
            ),
        )
        .order_by("due_date")[:8]
    )
    progress = [
        {
            "id": project.id,
            "name": project.name,
            "client_name": project.client.name,
            "status": project.status,
            "due_date": project.due_date,
            "progress": (
                round(project.annotated_done_tasks / project.annotated_total_tasks * 100)
                if project.annotated_total_tasks
                else 0
            ),
        }
        for project in active_projects
    ]

    recent_activity = ActivityLog.objects.select_related("actor", "client")[:10]

    return Response(
        {
            "clients": client_stats,
            "projects": project_stats,
            "tasks": task_stats,
            "finance": {
                "total_invoiced": money(total_invoiced),
                "total_paid": money(total_paid),
                "outstanding": money(outstanding),
                "unpaid_invoices": invoice_stats["unpaid_count"],
                "overdue_invoices": invoice_stats["overdue_count"],
                "draft_invoices": invoice_stats["draft_count"],
            },
            "team": {
                "total": TeamMember.objects.count(),
                "active": TeamMember.objects.filter(status="active").count(),
            },
            "project_progress": progress,
            "recent_activity": ActivityLogSerializer(recent_activity, many=True).data,
        }
    )


@api_view(["GET"])
def revenue(request):
    """Invoiced vs received per month for the last 12 months."""
    start, _ = month_range(11)

    invoiced_rows = (
        Invoice.objects.filter(issue_date__gte=start, status__in=BILLED)
        .annotate(month=TruncMonth("issue_date"))
        .values("month")
        .annotate(value=Sum("total_amount"))
    )
    paid_rows = (
        Payment.objects.filter(payment_date__gte=start)
        .annotate(month=TruncMonth("payment_date"))
        .values("month")
        .annotate(value=Sum("amount"))
    )

    invoiced_by_month = {row["month"]: row["value"] for row in invoiced_rows}
    paid_by_month = {row["month"]: row["value"] for row in paid_rows}

    # Emit every month in the window, including empty ones, so the chart has
    # a continuous x-axis.
    series = []
    year, month = start.year, start.month
    today = timezone.localdate()
    while (year, month) <= (today.year, today.month):
        key = date(year, month, 1)
        series.append(
            {
                "month": key.strftime("%Y-%m"),
                "label": key.strftime("%b %Y"),
                "invoiced": money(invoiced_by_month.get(key)),
                "paid": money(paid_by_month.get(key)),
            }
        )
        month += 1
        if month > 12:
            month = 1
            year += 1

    return Response(series)


@api_view(["GET"])
def project_report(request):
    """Project counts by status and priority, plus the overdue list."""
    today = timezone.localdate()

    by_status = list(
        Project.objects.values("status").annotate(count=Count("id")).order_by("status")
    )
    by_priority = list(
        Project.objects.values("priority").annotate(count=Count("id")).order_by("priority")
    )

    overdue = (
        Project.objects.filter(due_date__lt=today)
        .exclude(status__in=["completed", "cancelled"])
        .select_related("client")
        .order_by("due_date")[:20]
    )

    return Response(
        {
            "by_status": by_status,
            "by_priority": by_priority,
            "totals": Project.objects.aggregate(
                total=Count("id"),
                completed=Count("id", filter=Q(status="completed")),
                in_progress=Count("id", filter=Q(status="in_progress")),
                cancelled=Count("id", filter=Q(status="cancelled")),
            ),
            "overdue": [
                {
                    "id": project.id,
                    "name": project.name,
                    "client_name": project.client.name,
                    "due_date": project.due_date,
                    "days_overdue": (today - project.due_date).days,
                    "status": project.status,
                }
                for project in overdue
            ],
        }
    )


@api_view(["GET"])
def client_report(request):
    """Client counts plus the highest-billing clients."""
    start_of_month = timezone.localdate().replace(day=1)

    totals = Client.objects.aggregate(
        total=Count("id"),
        active=Count("id", filter=Q(status="active")),
        inactive=Count("id", filter=Q(status="inactive")),
        prospects=Count("id", filter=Q(status="prospect")),
        new_this_month=Count("id", filter=Q(created_at__date__gte=start_of_month)),
    )

    # The invoiced total comes from a subquery: summing across the invoices
    # join while also counting projects would multiply the money by the
    # number of projects.
    invoiced_per_client = Subquery(
        Invoice.objects.filter(client=OuterRef("pk"), status__in=BILLED)
        .values("client")
        .annotate(value=Sum("total_amount"))
        .values("value")[:1],
        output_field=DecimalField(max_digits=15, decimal_places=2),
    )

    top_clients = (
        Client.objects.annotate(
            invoiced=invoiced_per_client,
            project_count=Count("projects", distinct=True),
        )
        .filter(invoiced__isnull=False)
        .order_by("-invoiced")[:10]
    )

    by_industry = list(
        Client.objects.exclude(industry="")
        .values("industry")
        .annotate(count=Count("id"))
        .order_by("-count")
    )

    return Response(
        {
            "totals": totals,
            "by_industry": by_industry,
            "top_clients": [
                {
                    "id": client.id,
                    "name": client.name,
                    "projects": client.project_count,
                    "invoiced": money(client.invoiced),
                }
                for client in top_clients
            ],
        }
    )


@api_view(["GET"])
def financial_report(request):
    """Invoiced, received and outstanding, broken down by status and method."""
    total_invoiced = (
        Invoice.objects.filter(status__in=BILLED).aggregate(value=Sum("total_amount"))["value"]
        or ZERO
    )
    total_paid = Payment.objects.aggregate(value=Sum("amount"))["value"] or ZERO

    unpaid_invoiced = (
        Invoice.objects.filter(status__in=UNPAID).aggregate(value=Sum("total_amount"))["value"]
        or ZERO
    )
    unpaid_received = (
        Payment.objects.filter(invoice__status__in=UNPAID).aggregate(value=Sum("amount"))["value"]
        or ZERO
    )

    by_status = list(
        Invoice.objects.values("status")
        .annotate(count=Count("id"), value=Sum("total_amount"))
        .order_by("status")
    )
    by_method = list(
        Payment.objects.values("payment_method")
        .annotate(count=Count("id"), value=Sum("amount"))
        .order_by("-value")
    )

    return Response(
        {
            "summary": {
                "total_invoiced": money(total_invoiced),
                "total_paid": money(total_paid),
                "outstanding": money(unpaid_invoiced - unpaid_received),
                "collection_rate": (
                    round(float(total_paid / total_invoiced) * 100, 1)
                    if total_invoiced
                    else 0.0
                ),
            },
            "invoices_by_status": [
                {
                    "status": row["status"],
                    "count": row["count"],
                    "value": money(row["value"]),
                }
                for row in by_status
            ],
            "payments_by_method": [
                {
                    "method": row["payment_method"],
                    "count": row["count"],
                    "value": money(row["value"]),
                }
                for row in by_method
            ],
        }
    )


@api_view(["GET"])
def task_report(request):
    """Task counts by status and per assignee, for the Reports screen."""
    today = timezone.localdate()

    by_status = list(Task.objects.values("status").annotate(count=Count("id")).order_by("status"))

    by_member = (
        TeamMember.objects.annotate(
            open_tasks=Count("tasks", filter=~Q(tasks__status="completed"), distinct=True),
            done_tasks=Count("tasks", filter=Q(tasks__status="completed"), distinct=True),
        )
        .filter(status="active")
        .order_by("-open_tasks")[:15]
    )

    return Response(
        {
            "by_status": by_status,
            "totals": Task.objects.aggregate(
                total=Count("id"),
                completed=Count("id", filter=Q(status="completed")),
                pending=Count("id", filter=~Q(status="completed")),
                overdue=Count("id", filter=Q(due_date__lt=today) & ~Q(status="completed")),
            ),
            "by_member": [
                {
                    "id": member.id,
                    "name": member.name,
                    "role": member.role,
                    "open_tasks": member.open_tasks,
                    "completed_tasks": member.done_tasks,
                }
                for member in by_member
            ],
        }
    )
