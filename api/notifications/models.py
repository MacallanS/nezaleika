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
    season_alerts = models.BooleanField(
        default=True,
        help_text='Пуш в первый день сезона полива',
    )
    last_sent_on = models.DateField(null=True, blank=True)
    last_season_notified = models.CharField(
        max_length=16,
        blank=True,
        default='',
        help_text='Последний сезон, о котором уже слали пуш (year-season)',
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


class PlantSnooze(models.Model):
    """Hide a plant from watering reminders until `until` (server-side; push respects this)."""

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='plant_snoozes')
    plant = models.ForeignKey('plants.UserPlant', on_delete=models.CASCADE, related_name='snoozes')
    until = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Отложенный полив'
        verbose_name_plural = 'Отложенные поливы'
        constraints = [
            models.UniqueConstraint(fields=['user', 'plant'], name='uniq_plant_snooze_per_user'),
        ]

    def __str__(self) -> str:
        return f'Snooze plant={self.plant_id} user={self.user_id} until={self.until}'
