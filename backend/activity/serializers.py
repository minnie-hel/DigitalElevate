from rest_framework import serializers

from .models import ActivityLog


class ActivityLogSerializer(serializers.ModelSerializer):
    action_display = serializers.CharField(source="get_action_display", read_only=True)
    entity_display = serializers.CharField(source="get_entity_display", read_only=True)
    client_name = serializers.CharField(source="client.name", read_only=True)

    class Meta:
        model = ActivityLog
        fields = (
            "id",
            "actor",
            "actor_name",
            "action",
            "action_display",
            "entity",
            "entity_display",
            "entity_id",
            "entity_name",
            "description",
            "client",
            "client_name",
            "created_at",
        )
        read_only_fields = fields
