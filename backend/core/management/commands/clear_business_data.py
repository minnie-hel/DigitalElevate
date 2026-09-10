"""Remove all operational records; login accounts are kept."""

from django.core.management.base import BaseCommand

from core.business_data import clear_business_data


class Command(BaseCommand):
    help = (
        "Delete clients, projects, tasks, invoices, payments, team members "
        "and activity logs. User accounts are not removed."
    )

    def handle(self, *args, **options):
        clear_business_data()
        self.stdout.write(self.style.SUCCESS("Business data cleared."))
