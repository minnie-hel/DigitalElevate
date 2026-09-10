"""Helpers for wiping operational data while keeping login accounts."""

from django.db import transaction

from activity.models import ActivityLog
from clients.models import Client
from invoices.models import Invoice, InvoiceItem
from payments.models import Payment
from projects.models import Project
from tasks.models import Task

from accounts.models import TeamMember


@transaction.atomic
def clear_business_data():
    """
    Remove clients, delivery work, finance records, team profiles and the
    activity log. User accounts are kept so administrators can sign in again.
    """
    ActivityLog.objects.all().delete()
    Payment.objects.all().delete()
    InvoiceItem.objects.all().delete()
    Invoice.objects.all().delete()
    Task.objects.all().delete()
    Project.objects.all().delete()
    Client.objects.all().delete()
    TeamMember.objects.all().delete()
