from rest_framework import serializers

from clients.serializers import ClientSummarySerializer

from .models import Project


class ProjectSerializer(serializers.ModelSerializer):
    client_detail = ClientSummarySerializer(source="client", read_only=True)
    client_name = serializers.CharField(source="client.name", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    priority_display = serializers.CharField(source="get_priority_display", read_only=True)
    service_type_display = serializers.CharField(source="get_service_type_display", read_only=True)

    total_tasks = serializers.SerializerMethodField()
    completed_tasks = serializers.SerializerMethodField()
    progress = serializers.SerializerMethodField()
    is_overdue = serializers.BooleanField(read_only=True)

    class Meta:
        model = Project
        fields = (
            "id",
            "client",
            "client_name",
            "client_detail",
            "name",
            "description",
            "service_type",
            "service_type_display",
            "start_date",
            "due_date",
            "budget",
            "status",
            "status_display",
            "priority",
            "priority_display",
            "total_tasks",
            "completed_tasks",
            "progress",
            "is_overdue",
            "created_at",
            "updated_at",
        )

    def get_total_tasks(self, obj):
        annotated = getattr(obj, "annotated_total_tasks", None)
        return obj.total_tasks if annotated is None else annotated

    def get_completed_tasks(self, obj):
        annotated = getattr(obj, "annotated_completed_tasks", None)
        return obj.completed_tasks if annotated is None else annotated

    def get_progress(self, obj):
        if obj.status == Project.Status.COMPLETED:
            return 100
        total = self.get_total_tasks(obj)
        if not total:
            return 0
        return round(self.get_completed_tasks(obj) / total * 100)

    def validate_service_type(self, value):
        if not value:
            return Project.ServiceType.OTHER
        return value

    def validate(self, attrs):
        start_date = attrs.get("start_date", getattr(self.instance, "start_date", None))
        due_date = attrs.get("due_date", getattr(self.instance, "due_date", None))
        if start_date and due_date and due_date < start_date:
            raise serializers.ValidationError(
                {"due_date": "Due date cannot be earlier than the start date."}
            )
        return attrs


class ProjectSummarySerializer(serializers.ModelSerializer):
    """Compact shape for embedding inside task and invoice payloads."""

    class Meta:
        model = Project
        fields = ("id", "name", "status", "priority")
