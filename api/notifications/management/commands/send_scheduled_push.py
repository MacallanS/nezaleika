from django.core.management.base import BaseCommand

from notifications.views import run_due_pushes


class Command(BaseCommand):
    help = 'Send daily watering reminders to subscribed phones.'

    def handle(self, *args, **options):
        sent = run_due_pushes()
        if sent is None:
            self.stdout.write(self.style.WARNING('skipped=lock'))
            return
        self.stdout.write(self.style.SUCCESS(f'sent={sent}'))
