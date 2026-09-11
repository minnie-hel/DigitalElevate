from django.db.models import Count, Q
from django.utils import timezone
from django_filters import rest_framework as filters
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from activity.services import log_activity
from core.permissions import IsAdminOrManager

from .models import Project
from .serializers import ProjectSerializer


class ProjectFilter(filters.FilterSet):
    """Adds range and overdue filters on top of plain field matching."""

    due_before = filters.DateFilter(field_name="due_date", lookup_expr="lte")
    due_after = filters.DateFilter(field_name="due_date", lookup_expr="gte")
    overdue = filters.BooleanFilter(method="filter_overdue")

    class Meta:
        model = Project
        fields = ["client", "status", "priority", "service_type", "due_before", "due_after", "overdue"]

    def filter_overdue(self, queryset, name, value):
        today = timezone.localdate()
        if value:
            return queryset.filter(due_date__lt=today).exclude(
                status__in=["completed", "cancelled"]
            )
        return queryset.exclude(
            Q(due_date__lt=today) & ~Q(status__in=["completed", "cancelled"])
        )


class ProjectViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated, IsAdminOrManager]
    filterset_class = ProjectFilter
    search_fields = ["name", "description", "client__name"]
    ordering_fields = ["name", "due_date", "start_date", "budget", "status", "created_at"]

    def get_queryset(self):
        return (
            Project.objects.select_related("client")
            .annotate(
                annotated_total_tasks=Count("tasks", distinct=True),
                annotated_completed_tasks=Count(
                    "tasks",
                    filter=Q(tasks__status="completed"),
                    distinct=True,
                ),
            )
            .order_by("-created_at")
        )

    def perform_create(self, serializer):
        project = serializer.save()
        log_activity(
            actor=self.request.user,
            action="created",
            entity="project",
            entity_id=project.pk,
            entity_name=project.name,
            description=f"created a new project {project.name}",
            client=project.client,
        )

    def perform_update(self, serializer):
        previous_status = serializer.instance.status
        project = serializer.save()
        if previous_status != project.status:
            log_activity(
                actor=self.request.user,
                action="status_changed",
                entity="project",
                entity_id=project.pk,
                entity_name=project.name,
                description=(
                    f"moved project {project.name} to {project.get_status_display()}"
                ),
                client=project.client,
            )
        else:
            log_activity(
                actor=self.request.user,
                action="updated",
                entity="project",
                entity_id=project.pk,
                entity_name=project.name,
                description=f"updated project {project.name}",
                client=project.client,
            )

    def perform_destroy(self, instance):
        name, pk, client = instance.name, instance.pk, instance.client
        instance.delete()
        log_activity(
            actor=self.request.user,
            action="deleted",
            entity="project",
            entity_id=pk,
            entity_name=name,
            description=f"deleted project {name}",
            client=client,
        )

    @action(detail=True, methods=["get"])
    def tasks(self, request, pk=None):
        from tasks.serializers import TaskSerializer

        project = self.get_object()
        queryset = project.tasks.select_related("assigned_to", "project").order_by(
            "status", "due_date"
        )
        return Response(
            TaskSerializer(queryset, many=True, context=self.get_serializer_context()).data
        )

    @action(detail=True, methods=["get"])
    def progress(self, request, pk=None):
        """The task breakdown behind the progress bar."""
        project = self.get_object()
        tasks = project.tasks.all()
        return Response(
            {
                "project": project.name,
                "total_tasks": tasks.count(),
                "completed": tasks.filter(status="completed").count(),
                "in_progress": tasks.filter(status="in_progress").count(),
                "review": tasks.filter(status="review").count(),
                "blocked": tasks.filter(status="blocked").count(),
                "pending": tasks.filter(status="todo").count(),
                "progress": project.progress,
            }
        )
