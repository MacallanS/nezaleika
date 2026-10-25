from django.contrib.auth import get_user_model
from django.db.models.signals import post_save
from django.dispatch import receiver

from accounts.models import UserProfile
from notifications.models import NotificationPrefs

User = get_user_model()


@receiver(post_save, sender=User)
def create_user_side_tables(sender, instance, created, **kwargs):
    if not created:
        return
    NotificationPrefs.objects.get_or_create(user=instance)
    UserProfile.objects.get_or_create(user=instance)
