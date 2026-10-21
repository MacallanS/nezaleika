from django.conf import settings
from django.db import models


class NotificationPrefs(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notification_prefs')
    enabled = models.BooleanField(default=True)
    remind_time = models.TimeField(default='09:00')
    timezone_name = models.CharField(max_length=64, default='Europe/Moscow')
    only_urgent = models.BooleanField(
        default=True,
        help_text='Только просроченные и на сегодня',
    )

    class Meta:
        verbose_name = 'Настройки уведомлений'
        verbose_name_plural = 'Настройки уведомлений'

    def __str__(self) -> str:
        return f'Prefs {self.user_id}'


class PushSubscription(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='push_subscriptions')
    endpoint = models.TextField(unique=True)
    p256dh = models.CharField(max_length=255)
    auth = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Push-подписка'
        verbose_name_plural = 'Push-подписки'
