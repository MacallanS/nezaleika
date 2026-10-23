from __future__ import annotations

from datetime import date, datetime, timedelta
from typing import TYPE_CHECKING, Literal

from django.utils import timezone

if TYPE_CHECKING:
    from plants.models import PlantSpecies, UserPlant, WateringEvent

Season = Literal['winter', 'spring', 'summer', 'autumn']
Status = Literal['ok', 'due_soon', 'due_today', 'overdue']

SEASON_LABELS = {
    'winter': 'зимний',
    'spring': 'весенний',
    'summer': 'летний',
    'autumn': 'осенний',
}


def season_for_date(d: date) -> Season:
    month = d.month
    if month in (12, 1, 2):
        return 'winter'
    if month in (3, 4, 5):
        return 'spring'
    if month in (6, 7, 8):
        return 'summer'
    return 'autumn'


def local_date(dt: datetime) -> date:
    if timezone.is_naive(dt):
        dt = timezone.make_aware(dt)
    return timezone.localtime(dt).date()


def waterings_desc(plant: UserPlant) -> list[WateringEvent]:
    """Newest first; uses prefetched waterings when available."""
    return sorted(plant.waterings.all(), key=lambda w: w.watered_at, reverse=True)


def last_watering(plant: UserPlant) -> WateringEvent | None:
    items = waterings_desc(plant)
    return items[0] if items else None


def last_watering_at(plant: UserPlant) -> datetime:
    last = last_watering(plant)
    if last:
        return last.watered_at
    return plant.added_at


def interval_days(species: PlantSpecies, on_date: date | None = None) -> int:
    d = on_date or timezone.localdate()
    return species.interval_for_season(season_for_date(d))


def plant_interval_days(plant: UserPlant) -> int:
    """Interval used for next_due — season of the last watering day (same as next_due_at)."""
    return interval_days(plant.species, local_date(last_watering_at(plant)))


def next_due_at(plant: UserPlant, on_date: date | None = None) -> date:
    last_local_date = local_date(last_watering_at(plant))
    days = interval_days(plant.species, last_local_date)
    return last_local_date + timedelta(days=days)


def days_until_due(plant: UserPlant, on_date: date | None = None) -> int:
    d = on_date or timezone.localdate()
    return (next_due_at(plant, d) - d).days


def watering_status(plant: UserPlant, on_date: date | None = None) -> Status:
    delta = days_until_due(plant, on_date)
    if delta < 0:
        return 'overdue'
    if delta == 0:
        return 'due_today'
    if delta <= 1:
        return 'due_soon'
    return 'ok'


def season_hint(species: PlantSpecies, on_date: date | None = None) -> str:
    d = on_date or timezone.localdate()
    season = season_for_date(d)
    n = species.interval_for_season(season)
    return f'{SEASON_LABELS[season]} режим: раз в {n} дн.'


def feed_sort_key(plant: UserPlant, on_date: date | None = None) -> tuple[int, int]:
    """Lower sorts first: overdue, due_today, due_soon, ok."""
    status = watering_status(plant, on_date)
    order = {'overdue': 0, 'due_today': 1, 'due_soon': 2, 'ok': 3}[status]
    return (order, days_until_due(plant, on_date))


def planned_dates(plant: UserPlant, start: date, end: date, today: date | None = None) -> list[date]:
    """Future planned waterings in [start, end]. An overdue due date is not repeated here."""
    today = today or timezone.localdate()
    due = next_due_at(plant)
    cursor = due if due >= today else today
    if due < today:
        cursor = today + timedelta(days=interval_days(plant.species, today))
    out: list[date] = []
    guard = 0
    while cursor <= end and guard < 400:
        if cursor >= start:
            out.append(cursor)
        cursor = cursor + timedelta(days=interval_days(plant.species, cursor))
        guard += 1
    return out


def display_name(user) -> str:
    if not user:
        return ''
    return user.first_name or user.username


def plant_stats(plant: UserPlant, days: int = 84, today: date | None = None) -> dict:
    today = today or timezone.localdate()
    events = sorted(plant.waterings.all(), key=lambda w: w.watered_at)
    start = today - timedelta(days=days - 1)
    counts: dict[date, int] = {}
    for w in events:
        d = local_date(w.watered_at)
        if start <= d <= today:
            counts[d] = counts.get(d, 0) + 1
    heatmap = [
        {'date': (start + timedelta(days=i)).isoformat(), 'count': counts.get(start + timedelta(days=i), 0)}
        for i in range(days)
    ]

    on_time_flags: list[bool] = []
    prev = local_date(plant.added_at)
    for w in events:
        d = local_date(w.watered_at)
        due = prev + timedelta(days=interval_days(plant.species, prev))
        on_time_flags.append(d <= due)
        prev = d

    streak = 0
    for flag in reversed(on_time_flags):
        if not flag:
            break
        streak += 1
    if watering_status(plant, today) == 'overdue':
        streak = 0

    rate = round(100 * sum(on_time_flags) / len(on_time_flags)) if on_time_flags else 100
    return {
        'heatmap': heatmap,
        'streak': streak,
        'on_time_rate': rate,
        'total': len(events),
        'interval_days': interval_days(plant.species, today),
    }
