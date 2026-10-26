from datetime import date, datetime
from zoneinfo import ZoneInfo

from django.contrib.auth import get_user_model

from notifications.models import NotificationPrefs, PushSubscription
from notifications.push import send_web_push
from plants.queries import household_plants_queryset
from plants.services.schedule import SEASON_LABELS, feed_sort_key, watering_status

User = get_user_model()

MAX_NAMES = 3

SEASON_START_MONTHS = {3: 'spring', 6: 'summer', 9: 'autumn', 12: 'winter'}


def is_season_start(d: date) -> str | None:
    """Return season key if d is the first day of a watering season, else None."""
    if d.day != 1:
        return None
    return SEASON_START_MONTHS.get(d.month)


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


def season_payload(season: str, plant_count: int) -> dict:
    label = SEASON_LABELS.get(season, season)
    title = f'Начался {label} сезон полива'
    if plant_count:
        body = f'У {plant_count} растений обновился график. Загляните в календарь.'
    else:
        body = 'Обновился сезонный график полива. Загляните в календарь.'
    return {'title': title, 'body': body, 'url': '/', 'tag': 'nezaleika-season'}


def send_season_push(now: datetime | None = None) -> int:
    """Notify once at the start of each watering season (1 Mar / 1 Jun / 1 Sep / 1 Dec)."""
    now_utc = now or datetime.now(ZoneInfo('UTC'))
    sent = 0
    plant_count = None
    for prefs in NotificationPrefs.objects.filter(enabled=True, season_alerts=True).select_related('user'):
        try:
            tz = ZoneInfo(prefs.timezone_name)
        except Exception:
            tz = ZoneInfo('Europe/Moscow')
        local = now_utc.astimezone(tz)
        local_day = local.date()
        season = is_season_start(local_day)
        if not season:
            continue
        season_key = f'{local_day.year}-{season}'
        if prefs.last_season_notified == season_key:
            continue
        subs = list(PushSubscription.objects.filter(user=prefs.user))
        if not subs:
            continue
        if plant_count is None:
            plant_count = household_plants_queryset().count()
        payload = season_payload(season, plant_count)
        delivered = sum(1 for sub in subs if send_web_push(sub, payload))
        if delivered:
            prefs.last_season_notified = season_key
            prefs.save(update_fields=['last_season_notified'])
            sent += delivered
    return sent


def send_scheduled_push(now: datetime | None = None) -> int:
    """Send the daily reminder once per local day, at or after the user's remind_time.

    Free Render + GitHub cron often wake late, so we do not require a tight time window:
    the first successful run after remind_time on that local day delivers the push.
    """
    now_utc = now or datetime.now(ZoneInfo('UTC'))
    sent = send_season_push(now_utc)
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
