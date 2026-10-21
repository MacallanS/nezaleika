from __future__ import annotations

from datetime import date, datetime, timedelta
from typing import TYPE_CHECKING, Literal

from django.utils import timezone

if TYPE_CHECKING:
    from plants.models import PlantSpecies, UserPlant

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


def last_watering_at(plant: UserPlant) -> datetime:
    last = plant.waterings.order_by('-watered_at').first()
    if last:
        return last.watered_at
    return plant.added_at


def interval_days(species: PlantSpecies, on_date: date | None = None) -> int:
    d = on_date or timezone.localdate()
    return species.interval_for_season(season_for_date(d))


def next_due_at(plant: UserPlant, on_date: date | None = None) -> date:
    d = on_date or timezone.localdate()
    last = last_watering_at(plant)
    if timezone.is_naive(last):
        last = timezone.make_aware(last)
    last_local_date = timezone.localtime(last).date()
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
