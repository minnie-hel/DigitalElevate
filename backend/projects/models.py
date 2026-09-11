from decimal import Decimal

from django.core.validators import MinValueValidator
from django.db import models
from django.utils import timezone

from core.models import TimeStampedModel


class Project(TimeStampedModel):
    """A piece of work delivered for a client."""

    class Status(models.TextChoices):
        PLANNING = "planning", "Planning"
        IN_PROGRESS = "in_progress", "In Progress"
        ON_HOLD = "on_hold", "On Hold"
        COMPLETED = "completed", "Completed"
        CANCELLED = "cancelled", "Cancelled"

    class Priority(models.TextChoices):
        LOW = "low", "Low"
        MEDIUM = "medium", "Medium"
        HIGH = "high", "High"
        URGENT = "urgent", "Urgent"

    class ServiceType(models.TextChoices):
        WEBSITE = "website_development", "Website Development"
        SOCIAL_MEDIA = "social_media", "Social Media"
        BRANDING = "branding", "Branding"
        SEO = "seo", "SEO"
        ADVERTISING = "advertising", "Advertising"
        SOFTWARE = "software_development", "Software Development"
        MOBILE_APP = "mobile_app", "Mobile App"
        OTHER = "other", "Other"

    OPEN_STATUSES = (Status.PLANNING, Status.IN_PROGRESS)

    client = models.ForeignKey(
        "clients.Client",
        on_delete=models.CASCADE,
        related_name="projects",
    )
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    service_type = models.CharField(
        max_length=32,
        choices=ServiceType.choices,
        default=ServiceType.OTHER,
    )
    start_date = models.DateField(null=True, blank=True)
    due_date = models.DateField(null=True, blank=True)
    budget = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=Decimal("0.00"),
        validators=[MinValueValidator(Decimal("0.00"))],
    )
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PLANNING)
    priority = models.CharField(max_length=20, choices=Priority.choices, default=Priority.MEDIUM)

    class Meta:
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=["status"]),
            models.Index(fields=["due_date"]),
        ]

    def __str__(self):
        return f"{self.name} ({self.client.name})"

    @property
    def total_tasks(self):
        return self.tasks.count()

    @property
    def completed_tasks(self):
        return self.tasks.filter(status="completed").count()

    @property
    def progress(self):
        """
        Completion percentage derived from tasks, so nobody has to keep a
        number up to date by hand. A project with no tasks yet reports 0,
        except once it has been marked completed.
        """
        if self.status == self.Status.COMPLETED:
            return 100
        total = self.total_tasks
        if not total:
            return 0
        return round(self.completed_tasks / total * 100)

    @property
    def is_overdue(self):
        if not self.due_date:
            return False
        if self.status in (self.Status.COMPLETED, self.Status.CANCELLED):
            return False
        return self.due_date < timezone.localdate()
