from rest_framework import mixins, viewsets

from .models import ActivityLog
from .serializers import ActivityLogSerializer


class ActivityLogViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    """Read-only feed. Entries are written by the system, never by clients."""

    serializer_class = ActivityLogSerializer
    queryset = ActivityLog.objects.select_related("actor", "client")
    filterset_fields = ["entity", "action", "client", "actor"]
    search_fields = ["description", "entity_name", "actor_name"]
    ordering_fields = ["created_at"]
