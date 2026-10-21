import base64

from django.core.management.base import BaseCommand
from cryptography.hazmat.primitives import serialization
from py_vapid import Vapid


class Command(BaseCommand):
    help = 'Generate VAPID key pair for Web Push (.env)'

    def handle(self, *args, **options):
        v = Vapid()
        v.generate_keys()
        priv = v.private_pem().decode()
        raw = v.public_key.public_bytes(
            encoding=serialization.Encoding.X962,
            format=serialization.PublicFormat.UncompressedPoint,
        )
        pub = base64.urlsafe_b64encode(raw).decode().strip('=')
        self.stdout.write('Add to .env:\n')
        self.stdout.write(f'VAPID_PRIVATE_KEY="{priv}"')
        self.stdout.write(f'VAPID_PUBLIC_KEY={pub}')
