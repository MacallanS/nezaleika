from datetime import datetime
from zoneinfo import ZoneInfo

from django.contrib.auth import get_user_model

from notifications.models import NotificationPrefs, PushSubscription
from notifications.push import send_web_push
from plants.queries import household_plants_queryset
from plants.services.schedule import feed_sort_key, watering_status

User = get_user_model()

MAX_NAMES = 3


def urgent_plants():
    plants = [p for p in household_plants_queryset() if watering_status(p) in ('overdue', 'due_today')]
    plants.sort(key=lambda p: feed_sort_key(p))
    return plants


def today_payload(plants) -> dict:
    if not plants:
        return {'title': 'Незалейка', 'body': 'Сегодня всё полито. Загляните в календарь.', 'url': '/'}
    names = ', '.join(p.name for p in plants[:MAX_NAMES])
    extra = len(plants) - MAX_NAMES
    if extra > 0:
        names += f' +{extra}'
    overdue = sum(1 for p in plants if watering_status(p) == 'overdue')
    title = f'Сегодня полить: {len(plants)}'
    if overdue:
        title += f' (просрочено {overdue})'
    return {'title': title, 'body': names, 'url': '/', 'tag': 'nezaleika-today'}


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
        if local.hour != prefs.remind_time.hour:
            continue
        subs = PushSubscription.objects.filter(user=prefs.user)
        if not subs.exists():
            continue
        urgent = urgent_plants()
        if prefs.only_urgent and not urgent:
            continue
        payload = today_payload(urgent)
        for sub in subs:
            send_web_push(sub, payload)
