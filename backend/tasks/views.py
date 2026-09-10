from django.db.models import Q
from django.utils import timezone
from django_filters import rest_framework as filters
from rest_framework import status as http_status
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from activity.services import log_activity

from .models import Task
from .serializers import TaskSerializer


class TaskFilter(filters.FilterSet):
    client = filters.NumberFilter(field_name="project__client_id")
    due_before = filters.DateFilter(field_name="due_date", lookup_expr="lte")
    due_after = filters.DateFilter(field_name="due_date", lookup_expr="gte")
    overdue = filters.BooleanFilter(method="filter_overdue")

    class Meta:
        model = Task
        fields = [
            "project",
            "client",
            "assigned_to",
            "status",
            "priority",
            "due_before",
            "due_after",
            "overdue",
        ]

    def filter_overdue(self, queryset, name, value):
        today = timezone.localdate()
        overdue = Q(due_date__lt=today) & ~Q(status="completed")
        return queryset.filter(overdue) if value else queryset.exclude(overdue)


class TaskViewSet(viewsets.ModelViewSet):
    """
    Tasks are writable by any authenticated staff member, since assignees
    need to move their own work forward.
    """

    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]
    filterset_class = TaskFilter
    search_fields = ["title", "description", "project__name", "assigned_to__name"]
    ordering_fields = ["due_date", "priority", "status", "created_at", "title"]

    def get_queryset(self):
        return Task.objects.select_related(
            "project", "project__client", "assigned_to"
        ).order_by("-created_at")

    def perform_create(self, serializer):
        task = serializer.save()
        log_activity(
            actor=self.request.user,
            action="created",
            entity="task",
            entity_id=task.pk,
            entity_name=task.title,
            description=f'added task "{task.title}" to {task.project.name}',
            client=task.project.client,
        )

    def perform_update(self, serializer):
        previous_status = serializer.instance.status
        task = serializer.save()
        if previous_status != task.status:
            completed = task.status == Task.Status.COMPLETED
            log_activity(
                actor=self.request.user,
                action="completed" if completed else "status_changed",
                entity="task",
                entity_id=task.pk,
                entity_name=task.title,
                description=(
                    f'completed "{task.title}"'
                    if completed
                    else f'moved "{task.title}" to {task.get_status_display()}'
                ),
                client=task.project.client,
            )
        else:
            log_activity(
                actor=self.request.user,
                action="updated",
                entity="task",
                entity_id=task.pk,
                entity_name=task.title,
                description=f'updated task "{task.title}"',
                client=task.project.client,
            )

    def perform_destroy(self, instance):
        title, pk, client = instance.title, instance.pk, instance.project.client
        instance.delete()
        log_activity(
            actor=self.request.user,
            action="deleted",
            entity="task",
            entity_id=pk,
            entity_name=title,
            description=f'deleted task "{title}"',
            client=client,
        )

    @action(detail=True, methods=["post"])
    def set_status(self, request, pk=None):
        """Lightweight status transition used by the task board and checkboxes."""
        task = self.get_object()
        new_status = request.data.get("status")
        valid = dict(Task.Status.choices)
        if new_status not in valid:
            return Response(
                {"status": f"Must be one of: {', '.join(valid)}"},
                status=http_status.HTTP_400_BAD_REQUEST,
            )

        previous_status = task.status
        task.status = new_status
        task.save()

        if previous_status != task.status:
            completed = task.status == Task.Status.COMPLETED
            log_activity(
                actor=request.user,
                action="completed" if completed else "status_changed",
                entity="task",
                entity_id=task.pk,
                entity_name=task.title,
                description=(
                    f'completed "{task.title}"'
                    if completed
                    else f'moved "{task.title}" to {task.get_status_display()}'
                ),
                client=task.project.client,
            )

        return Response(self.get_serializer(task).data)

    @action(detail=False, methods=["get"])
    def board(self, request):
        """Tasks grouped by status, for a kanban-style view."""
        queryset = self.filter_queryset(self.get_queryset())
        grouped = {key: [] for key, _ in Task.Status.choices}
        for task in queryset:
            grouped[task.status].append(self.get_serializer(task).data)
        return Response(grouped)
