from django.apps import AppConfig


class PaymentsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "payments"

    def ready(self):
        # Connect the signals that keep invoice status in step with payments.
        from . import signals  # noqa: F401
