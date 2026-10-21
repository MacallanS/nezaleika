from datetime import date, datetime, timedelta
from unittest import mock

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from plants.models import PlantSpecies, UserPlant, WateringEvent
from plants.queries import household_plants_queryset
from plants.services.schedule import planned_dates, plant_stats

TODAY = date(2026, 11, 25)


def at(d: date, hour: int = 12) -> datetime:
    return timezone.make_aware(datetime(d.year, d.month, d.day, hour))


class ScheduleTestBase(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user('Yana', password='x', first_name='Яна')
        self.species = PlantSpecies.objects.create(
            slug='ficus', name_ru='Фикус', spring_days=7, summer_days=5, autumn_days=7, winter_days=10
        )
        patcher = mock.patch('django.utils.timezone.localdate', return_value=TODAY)
        patcher.start()
        self.addCleanup(patcher.stop)

    def plant(self, added: date, name='Фикус'):
        return UserPlant.objects.create(user=self.user, species=self.species, name=name, added_at=at(added))

    def reload(self, plant):
        return household_plants_queryset().get(pk=plant.pk)


class PlannedDatesTests(ScheduleTestBase):
    def test_projection_switches_interval_at_season_boundary(self):
        p = self.reload(self.plant(TODAY))
        dates = planned_dates(p, TODAY, date(2026, 12, 20), TODAY)
        self.assertEqual(dates[0], date(2026, 12, 2))
        self.assertEqual(dates[1], date(2026, 12, 12))

    def test_overdue_plant_projects_from_today(self):
        p = self.reload(self.plant(TODAY - timedelta(days=20)))
        dates = planned_dates(p, TODAY, TODAY + timedelta(days=30), TODAY)
        self.assertEqual(dates[0], TODAY + timedelta(days=7))


class CalendarApiTests(ScheduleTestBase):
    def setUp(self):
        super().setUp()
        self.client = APIClient()
        token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token.key}')

    def test_agenda_groups_plants(self):
        overdue = self.plant(TODAY - timedelta(days=20), 'Old')
        due_today = self.plant(TODAY - timedelta(days=7), 'Today')
        tomorrow = self.plant(TODAY - timedelta(days=6), 'Tomorrow')
        week = self.plant(TODAY - timedelta(days=3), 'Week')
        res = self.client.get('/api/agenda')
        self.assertEqual(res.status_code, 200)
        s = res.data['sections']
        self.assertEqual([i['plant_id'] for i in s['overdue']], [overdue.id])
        self.assertEqual([i['plant_id'] for i in s['today']], [due_today.id])
        self.assertEqual([i['plant_id'] for i in s['tomorrow']], [tomorrow.id])
        self.assertEqual([i['plant_id'] for i in s['week']], [week.id])

    def test_watering_records_author_and_shows_in_calendar(self):
        p = self.plant(TODAY - timedelta(days=20))
        with mock.patch('django.utils.timezone.now', return_value=at(TODAY, 10)):
            res = self.client.post(f'/api/plants/{p.id}/waterings/', {}, format='json')
        self.assertEqual(res.status_code, 201)
        self.assertEqual(res.data['watered_by_name'], 'Яна')

        res = self.client.get('/api/calendar', {'from': '2026-11-01', 'to': '2026-12-12'})
        days = res.data['days']
        self.assertEqual(days[TODAY.isoformat()]['done'][0]['watered_by_name'], 'Яна')
        self.assertEqual(days[TODAY.isoformat()]['overdue'], [])
        self.assertIn(p.id, days['2026-12-02']['planned'])

        agenda = self.client.get('/api/agenda').data
        self.assertEqual(len(agenda['done_today']), 1)
        self.assertEqual(agenda['sections']['overdue'], [])

    def test_overdue_pinned_to_due_date_and_today(self):
        p = self.plant(TODAY - timedelta(days=10))
        days = self.client.get('/api/calendar', {'from': '2026-11-01', 'to': '2026-11-30'}).data['days']
        self.assertIn(p.id, days['2026-11-22']['overdue'])
        self.assertIn(p.id, days[TODAY.isoformat()]['overdue'])

    def test_undo_deletes_watering(self):
        p = self.plant(TODAY - timedelta(days=10))
        w = WateringEvent.objects.create(user_plant=p, watered_at=at(TODAY, 9), watered_by=self.user)
        res = self.client.delete(f'/api/waterings/{w.id}')
        self.assertEqual(res.status_code, 204)
        self.assertFalse(WateringEvent.objects.filter(pk=w.id).exists())


class StatsTests(ScheduleTestBase):
    def test_streak_and_rate(self):
        p = self.plant(date(2026, 11, 1))
        for d in (date(2026, 11, 7), date(2026, 11, 14), date(2026, 11, 24)):
            WateringEvent.objects.create(user_plant=p, watered_at=at(d), watered_by=self.user)
        stats = plant_stats(self.reload(p), today=TODAY)
        self.assertEqual(stats['total'], 3)
        self.assertEqual(stats['streak'], 0)
        self.assertEqual(stats['on_time_rate'], 67)
        self.assertEqual(len(stats['heatmap']), 84)
        self.assertEqual(stats['heatmap'][-2]['count'], 1)
