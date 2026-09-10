import re
from decimal import Decimal

from django.core.validators import MinValueValidator
from django.db import models, transaction
from django.utils import timezone

from core.models import TimeStampedModel

ZERO = Decimal("0.00")
CENTS = Decimal("0.01")
INVOICE_PREFIX = "INV-"


class Invoice(TimeStampedModel):
    """
    A bill issued to a client, optionally tied to one project.

    Monetary totals are stored rather than computed on read, so reports can
    aggregate them in SQL. They are recalculated from the line items whenever
    those items change.
    """

    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        SENT = "sent", "Sent"
        PARTIALLY_PAID = "partially_paid", "Partially Paid"
        PAID = "paid", "Paid"
        OVERDUE = "overdue", "Overdue"
        CANCELLED = "cancelled", "Cancelled"

    # Statuses whose value is never automatically reinterpreted.
    LOCKED_STATUSES = (Status.DRAFT, Status.CANCELLED)

    client = models.ForeignKey(
        "clients.Client",
        on_delete=models.CASCADE,
        related_name="invoices",
    )
    project = models.ForeignKey(
        "projects.Project",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="invoices",
    )
    invoice_number = models.CharField(max_length=50, unique=True, blank=True)
    issue_date = models.DateField(default=timezone.localdate)
    due_date = models.DateField(null=True, blank=True)
    tax_rate = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal("18.00"),
        validators=[MinValueValidator(ZERO)],
        help_text="Percentage. Tanzanian VAT is 18%.",
    )
    subtotal_amount = models.DecimalField(max_digits=15, decimal_places=2, default=ZERO)
    tax_amount = models.DecimalField(max_digits=15, decimal_places=2, default=ZERO)
    total_amount = models.DecimalField(max_digits=15, decimal_places=2, default=ZERO)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ("-issue_date", "-id")
        indexes = [
            models.Index(fields=["status"]),
            models.Index(fields=["due_date"]),
        ]

    def __str__(self):
        return self.invoice_number or f"Invoice {self.pk}"

    # -- Numbering ------------------------------------------
    
    @classmethod
    def next_invoice_number(cls):
        """Next sequential number, e.g. INV-0001, INV-0002."""
        highest = 0
        for value in cls.objects.values_list("invoice_number", flat=True):
            match = re.search(r"(\d+)\s*$", value or "")
            if match:
                highest = max(highest, int(match.group(1)))
        return f"{INVOICE_PREFIX}{highest + 1:04d}"

    def save(self, *args, **kwargs):
        if not self.invoice_number:
            with transaction.atomic():
                candidate = self.next_invoice_number()
                # Guard against a colliding manual entry.
                while Invoice.objects.filter(invoice_number=candidate).exists():
                    number = int(re.search(r"(\d+)\s*$", candidate).group(1)) + 1
                    candidate = f"{INVOICE_PREFIX}{number:04d}"
                self.invoice_number = candidate
        super().save(*args, **kwargs)

    # -- Money ---------------------------------------------------------------

    @property
    def amount_paid(self):
        total = self.payments.aggregate(value=models.Sum("amount"))["value"]
        return (total or ZERO).quantize(CENTS)

    @property
    def balance(self):
        return (self.total_amount - self.amount_paid).quantize(CENTS)

    @property
    def is_overdue(self):
        if self.status in self.LOCKED_STATUSES or self.status == self.Status.PAID:
            return False
        if not self.due_date:
            return False
        return self.due_date < timezone.localdate() and self.balance > ZERO

    def recalculate_totals(self, save=True):
        """Rebuild subtotal, tax and total from the current line items."""
        subtotal = self.items.aggregate(value=models.Sum("line_total"))["value"] or ZERO
        self.subtotal_amount = subtotal.quantize(CENTS)
        self.tax_amount = (subtotal * self.tax_rate / Decimal("100")).quantize(CENTS)
        self.total_amount = (self.subtotal_amount + self.tax_amount).quantize(CENTS)
        if save:
            super().save(update_fields=["subtotal_amount", "tax_amount", "total_amount", "updated_at"])
        return self.total_amount

    def sync_status(self, save=True):
        """
        Derive status from money received and the due date.

        Drafts and cancelled invoices are left alone - those are deliberate
        human decisions, not consequences of payment.
        """
        if self.status in self.LOCKED_STATUSES:
            return self.status

        paid = self.amount_paid
        if self.total_amount > ZERO and paid >= self.total_amount:
            new_status = self.Status.PAID
        elif paid > ZERO:
            new_status = self.Status.PARTIALLY_PAID
        elif self.due_date and self.due_date < timezone.localdate():
            new_status = self.Status.OVERDUE
        else:
            new_status = self.Status.SENT

        if new_status != self.status:
            self.status = new_status
            if save:
                super().save(update_fields=["status", "updated_at"])
        return self.status


class InvoiceItem(models.Model):
    """A billable line on an invoice."""

    invoice = models.ForeignKey(
        Invoice,
        on_delete=models.CASCADE,
        related_name="items",
    )
    description = models.CharField(max_length=255)
    quantity = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal("1.00"),
        validators=[MinValueValidator(Decimal("0.01"))],
    )
    unit_price = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=ZERO,
        validators=[MinValueValidator(ZERO)],
    )
    line_total = models.DecimalField(max_digits=15, decimal_places=2, default=ZERO)

    class Meta:
        ordering = ("id",)

    def __str__(self):
        return f"{self.description} x{self.quantity}"

    def save(self, *args, **kwargs):
        self.line_total = (self.quantity * self.unit_price).quantize(CENTS)
        super().save(*args, **kwargs)
