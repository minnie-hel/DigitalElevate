from django.db import models


class ActivityLog(models.Model):
    """
    A human-readable record of what happened in the system.

    Entities are referenced loosely (type + id + name) rather than through a
    generic foreign key, so a log line survives deletion of the thing it
    describes. `client` is denormalised to power the per-client activity tab.
    """

    class Action(models.TextChoices):
        CREATED = "created", "Created"
        UPDATED = "updated", "Updated"
        DELETED = "deleted", "Deleted"
        STATUS_CHANGED = "status_changed", "Status Changed"
        COMPLETED = "completed", "Completed"
        PAYMENT = "payment", "Payment Recorded"

    class Entity(models.TextChoices):
        CLIENT = "client", "Client"
        PROJECT = "project", "Project"
        TASK = "task", "Task"
        TEAM_MEMBER = "team_member", "Team Member"
        INVOICE = "invoice", "Invoice"
        PAYMENT = "payment", "Payment"

    actor = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="activities",
    )
    actor_name = models.CharField(
        max_length=255,
        blank=True,
        help_text="Snapshot of the actor's name, kept if the account is removed.",
    )
    action = models.CharField(max_length=30, choices=Action.choices)
    entity = models.CharField(max_length=30, choices=Entity.choices)
    entity_id = models.PositiveIntegerField(null=True, blank=True)
    entity_name = models.CharField(max_length=255, blank=True)
    description = models.CharField(max_length=500)
    client = models.ForeignKey(
        "clients.Client",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="activities",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-created_at", "-id")
        indexes = [
            models.Index(fields=["-created_at"]),
            models.Index(fields=["entity", "entity_id"]),
        ]

    def __str__(self):
        return f"{self.actor_name or 'System'} {self.description}"
