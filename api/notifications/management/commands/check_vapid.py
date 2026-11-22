from django.conf import settings
from django.core.management.base import BaseCommand

from config.vapid_env import vapid_private_key_loads
from notifications.push import _vapid_instance, push_configured


class Command(BaseCommand):
    help = 'Validate VAPID env keys (no push sent).'

    def handle(self, *args, **options):
        pub = bool(settings.VAPID_PUBLIC_KEY)
        priv_raw = bool(settings.VAPID_PRIVATE_KEY)
        pem_ok = vapid_private_key_loads(settings.VAPID_PRIVATE_KEY)
        vapid_ok = _vapid_instance() is not None
        configured = push_configured()
        self.stdout.write(f'public_key_set={pub}')
        self.stdout.write(f'private_key_set={priv_raw}')
        self.stdout.write(f'private_pem_loads={pem_ok}')
        self.stdout.write(f'pywebpush_vapid_loads={vapid_ok}')
        self.stdout.write(f'push_configured={configured}')
        if configured:
            self.stdout.write(self.style.SUCCESS('VAPID ok'))
        else:
            self.stdout.write(self.style.ERROR('VAPID not ready'))
            raise SystemExit(1)
