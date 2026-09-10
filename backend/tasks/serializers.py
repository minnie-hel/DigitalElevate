from rest_framework import serializers

from .models import Task


class TaskSerializer(serializers.ModelSerializer):
    project_name = serializers.CharField(source="project.name", read_only=True)
    client_id = serializers.IntegerField(source="project.client_id", read_only=True)
    client_name = serializers.CharField(source="project.client.name", read_only=True)
    assigned_to_name = serializers.CharField(source="assigned_to.name", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    priority_display = serializers.CharField(source="get_priority_display", read_only=True)
    is_overdue = serializers.BooleanField(read_only=True)

    class Meta:
        model = Task
        fields = (
            "id",
            "project",
            "project_name",
            "client_id",
            "client_name",
            "title",
            "description",
            "assigned_to",
            "assigned_to_name",
            "status",
            "status_display",
            "priority",
            "priority_display",
            "start_date",
            "due_date",
            "estimated_hours",
            "actual_hours",
            "completion",
            "completed_at",
            "is_overdue",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("completed_at",)

    def validate(self, attrs):
        start_date = attrs.get("start_date", getattr(self.instance, "start_date", None))
        due_date = attrs.get("due_date", getattr(self.instance, "due_date", None))
        if start_date and due_date and due_date < start_date:
            raise serializers.ValidationError(
                {"due_date": "Due date cannot be earlier than the start date."}
            )
        return attrs
