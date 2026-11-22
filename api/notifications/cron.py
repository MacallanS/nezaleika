import logging
from datetime import date, datetime
from zoneinfo import ZoneInfo

from django.db import transaction
from django.utils import timezone

from notifications.models import NotificationPrefs, PlantSnooze, PushSubscription
from notifications.push import send_web_push
from plants.queries import household_plants_queryset
from plants.services.schedule import SEASON_LABELS, feed_sort_key, watering_status

logger = logging.getLogger(__name__)

MAX_NAMES = 3

SEASON_START_MONTHS = {3: 'spring', 6: 'summer', 9: 'autumn', 12: 'winter'}


def is_season_start(d: date) -> str | None:
    """Return season key if d is the first day of a watering season, else None."""
    if d.day != 1:
        return None
    return SEASON_START_MONTHS.get(d.month)


def resolve_tz(name: str) -> ZoneInfo:
    try:
        return ZoneInfo(name)
    except Exception:
        return ZoneInfo('Europe/Moscow')


def active_snooze_plant_ids(user_id: int, now: datetime | None = None) -> set[int]:
    moment = now or timezone.now()
    return set(
        PlantSnooze.objects.filter(user_id=user_id, until__gt=moment).values_list('plant_id', flat=True)
    )


def urgent_plants(*, on_date: date | None = None, exclude_plant_ids: set[int] | None = None):
    exclude = exclude_plant_ids or set()
    plants = [
        p
        for p in household_plants_queryset()
        if p.id not in exclude and watering_status(p, on_date) in ('overdue', 'due_today')
    ]
    plants.sort(key=lambda p: feed_sort_key(p))
    return plants


def today_payload(plants, *, on_date: date | None = None) -> dict:
    if not plants:
        return {
            'title': 'Сегодня всё полито',
            'body': 'Можно заглянуть в календарь на завтра.',
            'url': '/',
            'tag': 'nezaleika-today',
        }
    names = ', '.join(p.name for p in plants[:MAX_NAMES])
    extra = len(plants) - MAX_NAMES
    if extra > 0:
        names += f' и ещё {extra}'
    overdue = sum(1 for p in plants if watering_status(p, on_date) == 'overdue')
    title = f'Сегодня надо полить {names}'
    body = f'Просрочено: {overdue}' if overdue else 'Откройте, чтобы отметить полив.'
    return {
        'title': title,
        'body': body,
        'url': '/',
        'tag': 'nezaleika-today',
        'plant_ids': [p.id for p in plants[:10]],
    }


def season_payload(season: str, plant_count: int) -> dict:
    label = SEASON_LABELS.get(season, season)
    title = f'Начался {label} сезон полива'
    if plant_count:
        body = f'У {plant_count} растений обновился график. Загляните в календарь.'
    else:
        body = 'Обновился сезонный график полива. Загляните в календарь.'
    return {'title': title, 'body': body, 'url': '/', 'tag': 'nezaleika-season'}


def _deliver(subs, payload: dict) -> int:
    return sum(1 for sub in subs if send_web_push(sub, payload))


def send_season_push(now: datetime | None = None) -> int:
    """Notify once at the start of each watering season (1 Mar / 1 Jun / 1 Sep / 1 Dec)."""
    now_utc = now or datetime.now(ZoneInfo('UTC'))
    sent = 0
    plant_count = None
    pref_ids = list(
        NotificationPrefs.objects.filter(enabled=True, season_alerts=True).values_list('pk', flat=True)
    )
    for pref_id in pref_ids:
        with transaction.atomic():
            prefs = (
                NotificationPrefs.objects.select_for_update()
                .select_related('user')
                .filter(pk=pref_id, enabled=True, season_alerts=True)
                .first()
            )
            if not prefs:
                continue
            tz = resolve_tz(prefs.timezone_name)
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
            previous = prefs.last_season_notified
            prefs.last_season_notified = season_key
            prefs.save(update_fields=['last_season_notified'])

        if plant_count is None:
            plant_count = household_plants_queryset().count()
        payload = season_payload(season, plant_count)
        delivered = _deliver(subs, payload)
        if delivered:
            sent += delivered
        else:
            with transaction.atomic():
                prefs = NotificationPrefs.objects.select_for_update().filter(pk=pref_id).first()
                if prefs and prefs.last_season_notified == season_key:
                    prefs.last_season_notified = previous
                    prefs.save(update_fields=['last_season_notified'])
    return sent


def send_scheduled_push(now: datetime | None = None) -> int:
    """Send the daily reminder once per local day, at or after the user's remind_time.

    Free hosts often wake late, so the first successful run after remind_time delivers.
    Claims the day atomically before send; rolls back if every delivery fails.
    """
    now_utc = now or datetime.now(ZoneInfo('UTC'))
    sent = send_season_push(now_utc)
    urgent_by_day: dict[date, list] = {}

    pref_ids = list(NotificationPrefs.objects.filter(enabled=True).values_list('pk', flat=True))
    for pref_id in pref_ids:
        with transaction.atomic():
            prefs = (
                NotificationPrefs.objects.select_for_update()
                .select_related('user')
                .filter(pk=pref_id, enabled=True)
                .first()
            )
            if not prefs:
                continue
            tz = resolve_tz(prefs.timezone_name)
            local = now_utc.astimezone(tz)
            local_day = local.date()
            if prefs.last_sent_on == local_day:
                logger.info('push skip user=%s reason=already_sent day=%s', prefs.user_id, local_day)
                continue
            remind_at = datetime.combine(local_day, prefs.remind_time, tzinfo=tz)
            if local < remind_at:
                continue
            subs = list(PushSubscription.objects.filter(user=prefs.user))
            if not subs:
                logger.info('push skip user=%s reason=no_subscription', prefs.user_id)
                continue

            snoozed = active_snooze_plant_ids(prefs.user_id, now_utc)
            if local_day not in urgent_by_day:
                # Cache unfiltered list per calendar day; filter snooze per user below.
                urgent_by_day[local_day] = urgent_plants(on_date=local_day)
            urgent = [
                p
                for p in urgent_by_day[local_day]
                if getattr(p, 'id', None) not in snoozed
            ]

            if prefs.only_urgent and not urgent:
                # Do not burn the day: retry until something is urgent or the day ends.
                logger.info('push skip user=%s reason=only_urgent_empty', prefs.user_id)
                continue

            previous = prefs.last_sent_on
            prefs.last_sent_on = local_day
            prefs.save(update_fields=['last_sent_on'])
            only_urgent = prefs.only_urgent

        # When only_urgent=False and nothing urgent, still send the “all watered” payload.
        payload = today_payload(
            [] if (not only_urgent and not urgent) else urgent,
            on_date=local_day,
        )
        delivered = _deliver(subs, payload)
        if delivered:
            sent += delivered
        else:
            with transaction.atomic():
                prefs = NotificationPrefs.objects.select_for_update().filter(pk=pref_id).first()
                if prefs and prefs.last_sent_on == local_day:
                    prefs.last_sent_on = previous
                    prefs.save(update_fields=['last_sent_on'])
    return sent


def purge_expired_snoozes(now: datetime | None = None) -> int:
    moment = now or timezone.now()
    deleted, _ = PlantSnooze.objects.filter(until__lte=moment).delete()
    return deleted
