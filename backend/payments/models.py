from decimal import Decimal

from django.core.validators import MinValueValidator
from django.db import models
from django.utils import timezone

from core.models import TimeStampedModel


class Payment(TimeStampedModel):
    """Money received against an invoice. An invoice may be paid in parts."""

    class Method(models.TextChoices):
        BANK = "bank", "Bank Transfer"
        MOBILE_MONEY = "mobile_money", "Mobile Money"
        CASH = "cash", "Cash"
        CARD = "card", "Card"
        OTHER = "other", "Other"

    invoice = models.ForeignKey(
        "invoices.Invoice",
        on_delete=models.CASCADE,
        related_name="payments",
    )
    amount = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        validators=[MinValueValidator(Decimal("0.01"))],
    )
    payment_date = models.DateField(default=timezone.localdate)
    payment_method = models.CharField(
        max_length=20,
        choices=Method.choices,
        default=Method.BANK,
    )
    reference = models.CharField(
        max_length=100,
        blank=True,
        help_text="Bank reference, mobile money transaction ID, receipt number.",
    )
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ("-payment_date", "-id")
        indexes = [models.Index(fields=["-payment_date"])]

    def __str__(self):
        return f"{self.amount} on {self.invoice}"
