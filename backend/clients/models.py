from decimal import Decimal

from django.db import models

from core.models import TimeStampedModel

ZERO = Decimal("0.00")


class Client(TimeStampedModel):
    """A company Elevate Digital does business with."""

    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        INACTIVE = "inactive", "Inactive"
        PROSPECT = "prospect", "Prospect"

    name = models.CharField("company name", max_length=255)
    contact_person = models.CharField(max_length=255, blank=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=30, blank=True)
    address = models.TextField(blank=True)
    industry = models.CharField(max_length=120, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ("name",)
        indexes = [models.Index(fields=["status"])]

    def __str__(self):
        return self.name

    # -- Relationship rollups ------------------------------------------------
    # Used on the client detail screen. List endpoints annotate these values
    # in the queryset instead, to avoid a query per row.

    @property
    def total_projects(self):
        return self.projects.count()

    @property
    def active_projects(self):
        return self.projects.filter(status__in=["planning", "in_progress"]).count()

    @property
    def total_invoiced(self):
        total = self.invoices.exclude(status__in=["draft", "cancelled"]).aggregate(
            value=models.Sum("total_amount")
        )["value"]
        return total or ZERO

    @property
    def total_paid(self):
        from payments.models import Payment

        total = Payment.objects.filter(invoice__client=self).aggregate(
            value=models.Sum("amount")
        )["value"]
        return total or ZERO

    @property
    def outstanding(self):
        return self.total_invoiced - self.total_paid
