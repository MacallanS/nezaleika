from datetime import datetime
from zoneinfo import ZoneInfo

from django.contrib.auth import get_user_model

from notifications.models import NotificationPrefs, PushSubscription
from notifications.push import send_web_push
from plants.queries import household_plants_queryset
from plants.services.schedule import feed_sort_key, watering_status

User = get_user_model()


def _urgent_plants(_user):
    plants = list(household_plants_queryset())
    if not plants:
        return []
    urgent = [p for p in plants if watering_status(p) in ('overdue', 'due_today')]
    urgent.sort(key=lambda p: feed_sort_key(p))
    return urgent


def send_scheduled_push():
    """Run every 15 min; send at user's remind_time in their timezone (once per hour slot)."""
    now_utc = datetime.now(ZoneInfo('UTC'))
    for prefs in NotificationPrefs.objects.filter(enabled=True).select_related('user'):
        try:
            tz = ZoneInfo(prefs.timezone_name)
        except Exception:
            tz = ZoneInfo('Europe/Moscow')
        local = now_utc.astimezone(tz)
        if local.minute >= 15:
            continue
        target_hour = prefs.remind_time.hour
        if local.hour != target_hour:
            continue
        subs = PushSubscription.objects.filter(user=prefs.user)
        if not subs.exists():
            continue
        urgent = _urgent_plants(prefs.user)
        if prefs.only_urgent and not urgent:
            continue
        if urgent:
            plant = urgent[0]
            title = f'Пора полить: {plant.name}'
            body = plant.species.name_ru
            url = f'/plants/{plant.id}'
            image = plant.photo.url if plant.photo else None
            if image and not image.startswith('http'):
                from django.conf import settings

                image = f'{settings.PUBLIC_BASE_URL.rstrip("/")}{image}'
            payload = {'title': title, 'body': body, 'url': url, 'image': image}
        else:
            payload = {
                'title': 'Незалейка',
                'body': 'Проверьте график полива ваших растений.',
                'url': '/',
            }
        for sub in subs:
            send_web_push(sub, payload)
