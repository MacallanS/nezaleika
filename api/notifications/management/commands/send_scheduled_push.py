from django.core.management.base import BaseCommand

from notifications.cron import send_scheduled_push


class Command(BaseCommand):
    help = 'Send daily watering reminders to subscribed phones.'

    def handle(self, *args, **options):
        sent = send_scheduled_push()
        self.stdout.write(self.style.SUCCESS(f'sent={sent}'))
