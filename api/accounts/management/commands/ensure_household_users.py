import os

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

User = get_user_model()

# username → first_name (display)
HOUSEHOLD_USERS = (
    ('Yana', 'Яна'),
    ('Артём', 'Артём'),
)


class Command(BaseCommand):
    help = 'Create or update Yana and Артём (staff + superuser) for shared household access.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--password',
            default=os.environ.get('NEZALEIKA_USER_PASSWORD', ''),
            help='Password for both users (or set NEZALEIKA_USER_PASSWORD).',
        )

    def handle(self, *args, **options):
        password = (options['password'] or '').strip()
        if not password:
            password = 'Nezaleika2026!'
            self.stdout.write(self.style.WARNING('Using default password Nezaleika2026! — change after first login.'))

        for username, first_name in HOUSEHOLD_USERS:
            user, created = User.objects.get_or_create(
                username=username,
                defaults={'first_name': first_name, 'is_staff': True, 'is_superuser': True},
            )
            user.first_name = first_name
            user.is_staff = True
            user.is_superuser = True
            user.is_active = True
            user.set_password(password)
            user.save()
            verb = 'Created' if created else 'Updated'
            self.stdout.write(self.style.SUCCESS(f'{verb} user "{username}" ({first_name})'))

        self.stdout.write('')
        self.stdout.write('Login in PWA or /admin/ with:')
        for username, first_name in HOUSEHOLD_USERS:
            self.stdout.write(f'  • {username} — {first_name}')
        self.stdout.write(f'  Password: {password}')
