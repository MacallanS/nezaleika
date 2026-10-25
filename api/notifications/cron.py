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


def send_scheduled_push(now: datetime | None = None) -> int:
    """Send the daily reminder once per local day, at or after the user's remind_time.

    Free Render + GitHub cron often wake late, so we do not require a tight time window:
    the first successful run after remind_time on that local day delivers the push.
    """
    now_utc = now or datetime.now(ZoneInfo('UTC'))
    sent = 0
    urgent = None
    for prefs in NotificationPrefs.objects.filter(enabled=True).select_related('user'):
        try:
            tz = ZoneInfo(prefs.timezone_name)
        except Exception:
            tz = ZoneInfo('Europe/Moscow')
        local = now_utc.astimezone(tz)
        if prefs.last_sent_on == local.date():
            continue
        remind_at = datetime.combine(local.date(), prefs.remind_time, tzinfo=tz)
        if local < remind_at:
            continue
        subs = list(PushSubscription.objects.filter(user=prefs.user))
        if not subs:
            continue
        if urgent is None:
            urgent = urgent_plants()
        if prefs.only_urgent and not urgent:
            # Still mark the day so we don't spam empty checks; user asked for urgent-only.
            prefs.last_sent_on = local.date()
            prefs.save(update_fields=['last_sent_on'])
            continue
        payload = today_payload(urgent)
        delivered = sum(1 for sub in subs if send_web_push(sub, payload))
        if delivered:
            prefs.last_sent_on = local.date()
            prefs.save(update_fields=['last_sent_on'])
            sent += delivered
    return sent
