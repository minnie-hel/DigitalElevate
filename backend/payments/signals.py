"""
Keeps invoice totals and status truthful whenever payments change.

Doing this with signals rather than in the view means status stays correct no
matter how the payment was created - API, admin, shell or seed command.
"""

from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from .models import Payment


@receiver(post_save, sender=Payment)
def payment_saved(sender, instance, **kwargs):
    instance.invoice.sync_status()


@receiver(post_delete, sender=Payment)
def payment_deleted(sender, instance, **kwargs):
    invoice_id = instance.invoice_id
    if invoice_id is None:
        return

    from invoices.models import Invoice

    # The invoice itself may be mid-deletion, in which case there is nothing
    # left to reconcile.
    invoice = Invoice.objects.filter(pk=invoice_id).first()
    if invoice is not None:
        invoice.sync_status()
