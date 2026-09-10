"""Create or reset an administrator login stored in the database."""

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError

User = get_user_model()


class Command(BaseCommand):
    help = (
        "Create a new administrator account or reset an existing user's password. "
        "Use python3 manage.py create_admin (see --help)."
    )

    def add_arguments(self, parser):
        parser.add_argument("--email", required=True, help="Sign-in email address.")
        parser.add_argument(
            "--password",
            required=True,
            help="Password (minimum 8 characters).",
        )
        parser.add_argument("--first-name", default="", dest="first_name")
        parser.add_argument("--last-name", default="", dest="last_name")

    def handle(self, *args, **options):
        email = User.objects.normalize_email(options["email"])
        password = options["password"]

        if len(password) < 8:
            raise CommandError("Password must be at least 8 characters.")

        user = User.objects.filter(email=email).first()
        if user:
            user.set_password(password)
            user.is_active = True
            user.is_staff = True
            user.is_superuser = True
            user.role = User.Role.ADMIN
            if options["first_name"]:
                user.first_name = options["first_name"]
            if options["last_name"]:
                user.last_name = options["last_name"]
            user.save()
            self.stdout.write(self.style.SUCCESS(f"Updated administrator {email}."))
            return

        User.objects.create_superuser(
            email=email,
            password=password,
            first_name=options["first_name"],
            last_name=options["last_name"],
        )
        self.stdout.write(self.style.SUCCESS(f"Created administrator {email}."))
