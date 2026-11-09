import json
import os
from datetime import datetime
from pathlib import Path

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone
from django.utils.dateparse import parse_datetime, parse_time

from accounts.models import UserProfile
from notifications.models import NotificationPrefs
from plants.models import PlantSpecies, UserPlant, WateringEvent

User = get_user_model()


def _aware(value: str) -> datetime:
    parsed = parse_datetime(value)
    if parsed is None:
        raise CommandError(f'Не разобрал дату: {value}')
    if timezone.is_naive(parsed):
        return timezone.make_aware(parsed, timezone.get_current_timezone())
    return parsed


class Command(BaseCommand):
    help = 'Load plants, photos and waterings from exports/household-live.json.'

    def add_arguments(self, parser):
        parser.add_argument('path', type=str)
        parser.add_argument(
            '--force',
            action='store_true',
            help='Import even if plants already exist. Existing rows are not duplicated.',
        )

    def handle(self, *args, **options):
        path = Path(options['path'])
        if not path.is_file():
            raise CommandError(f'Файл не найден: {path}')
        payload = json.loads(path.read_text(encoding='utf-8'))
        if UserPlant.objects.exists() and not options['force']:
            raise CommandError('В базе уже есть растения. Повтори с --force, дубли не создаются.')

        password = (os.environ.get('NEZALEIKA_USER_PASSWORD') or '').strip() or 'Nezaleika2026!'
        with transaction.atomic():
            users = self._users(payload.get('users') or [], password)
            owner = next(iter(users.values()))
            plants_created = photos = waterings_created = 0
            for item in payload.get('plants') or []:
                species = self._species(item.get('species') or {})
                added_at = _aware(item['added_at']) if item.get('added_at') else timezone.now()
                plant = UserPlant.objects.filter(name=item.get('name') or '', species=species, added_at=added_at).first()
                if plant is None:
                    plant = UserPlant.objects.create(
                        user=owner,
                        species=species,
                        name=item.get('name') or species.name_ru,
                        room=item.get('room') or '',
                        note=item.get('note') or '',
                        added_at=added_at,
                        photo_data=item.get('photo_data') or '',
                    )
                    plants_created += 1
                elif item.get('photo_data') and not plant.photo_data:
                    plant.photo_data = item['photo_data']
                    plant.save(update_fields=['photo_data', 'updated_at'])
                if plant.photo_data:
                    photos += 1
                waterings_created += self._waterings(plant, item.get('waterings') or [], users)

        self.stdout.write(self.style.SUCCESS(
            f'plants_created={plants_created} photos={photos} waterings_created={waterings_created} '
            f'users={len({user.pk for user in users.values()})}'
        ))

    def _users(self, rows: list[dict], password: str) -> dict[str, User]:
        found: dict[str, User] = {}
        for row in rows:
            username = (row.get('username') or '').strip()
            if not username:
                continue
            user, created = User.objects.get_or_create(
                username=username,
                defaults={
                    'first_name': row.get('first_name') or '',
                    'is_staff': True,
                    'is_superuser': True,
                    'is_active': True,
                },
            )
            if created:
                user.set_password(password)
                user.save(update_fields=['password'])
            elif row.get('first_name') and not user.first_name:
                user.first_name = row['first_name']
                user.save(update_fields=['first_name'])
            avatar = row.get('avatar_data') or ''
            if avatar:
                profile, _ = UserProfile.objects.get_or_create(user=user)
                if not profile.avatar_data:
                    profile.avatar_data = avatar
                    profile.save(update_fields=['avatar_data', 'updated_at'])
            prefs_row = row.get('notification_prefs') or {}
            if prefs_row:
                prefs, _ = NotificationPrefs.objects.get_or_create(user=user)
                remind = parse_time(str(prefs_row.get('remind_time') or '09:00:00'))
                prefs.enabled = bool(prefs_row.get('enabled', True))
                if remind:
                    prefs.remind_time = remind
                prefs.timezone_name = prefs_row.get('timezone_name') or 'Europe/Moscow'
                prefs.only_urgent = bool(prefs_row.get('only_urgent', True))
                prefs.season_alerts = bool(prefs_row.get('season_alerts', True))
                prefs.save()
            found[username] = user
            if user.first_name:
                found.setdefault(user.first_name, user)
        if not found:
            raise CommandError('В дампе нет пользователей.')
        return found

    def _species(self, row: dict) -> PlantSpecies:
        slug = (row.get('slug') or '').strip()
        species = PlantSpecies.objects.filter(slug=slug).first() if slug else None
        if species:
            return species
        if not slug:
            raise CommandError(f'У растения нет вида: {row!r}')
        return PlantSpecies.objects.create(
            slug=slug,
            name_ru=row.get('name_ru') or slug,
            name_lat=row.get('name_lat') or '',
            category=row.get('category') or 'other',
            spring_days=int(row.get('spring_days') or 7),
            summer_days=int(row.get('summer_days') or 7),
            autumn_days=int(row['autumn_days']) if row.get('autumn_days') not in (None, '') else None,
            winter_days=int(row.get('winter_days') or 14),
            care_hint=row.get('care_hint') or '',
            image_url=row.get('image_url') or '',
        )

    def _waterings(self, plant: UserPlant, rows: list[dict], users: dict[str, User]) -> int:
        created = 0
        for row in rows:
            if not row.get('watered_at'):
                continue
            watered_at = _aware(row['watered_at'])
            if plant.waterings.filter(watered_at=watered_at).exists():
                continue
            by_name = (row.get('watered_by_name') or '').strip()
            WateringEvent.objects.create(
                user_plant=plant,
                watered_at=watered_at,
                note=row.get('note') or '',
                watered_by=users.get(by_name),
            )
            created += 1
        return created
