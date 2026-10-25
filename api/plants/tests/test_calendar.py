from datetime import date, datetime, timedelta
from io import BytesIO
from unittest import mock

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from PIL import Image
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


class ApiTestBase(ScheduleTestBase):
    def setUp(self):
        super().setUp()
        self.client = APIClient()
        token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token.key}')


class CalendarApiTests(ApiTestBase):
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

    def test_rejects_watering_when_not_due(self):
        p = self.plant(TODAY - timedelta(days=20))
        WateringEvent.objects.create(user_plant=p, watered_at=at(TODAY - timedelta(days=2)), watered_by=self.user)
        # Last watered 2 days ago, interval 7 → next due in 5 days → not due yet
        with mock.patch('django.utils.timezone.now', return_value=at(TODAY, 10)):
            res = self.client.post(f'/api/plants/{p.id}/waterings/', {}, format='json')
        self.assertEqual(res.status_code, 400)
        self.assertIn('рано', res.data['detail'].lower())

    def test_rejects_second_watering_same_day(self):
        p = self.plant(TODAY - timedelta(days=20))
        with mock.patch('django.utils.timezone.now', return_value=at(TODAY, 10)):
            first = self.client.post(f'/api/plants/{p.id}/waterings/', {}, format='json')
            second = self.client.post(f'/api/plants/{p.id}/waterings/', {}, format='json')
        self.assertEqual(first.status_code, 201)
        self.assertEqual(second.status_code, 400)
        self.assertIn('уже полито', second.data['detail'].lower())

    def test_allows_first_watering_after_create(self):
        p = self.plant(TODAY)
        with mock.patch('django.utils.timezone.now', return_value=at(TODAY, 10)):
            res = self.client.post(f'/api/plants/{p.id}/waterings/', {}, format='json')
        self.assertEqual(res.status_code, 201)

    def test_allows_past_date_backfill_when_not_due(self):
        p = self.plant(TODAY - timedelta(days=2))
        past = (TODAY - timedelta(days=1)).isoformat()
        with mock.patch('django.utils.timezone.now', return_value=at(TODAY, 10)):
            res = self.client.post(
                f'/api/plants/{p.id}/waterings/',
                {'watered_at': f'{past}T12:00:00Z'},
                format='json',
            )
        self.assertEqual(res.status_code, 201)

    def test_late_watering_today_reschedules_from_today(self):
        """Due yesterday (overdue) → water today → next planned = today + autumn interval (7)."""
        due_yesterday = TODAY - timedelta(days=1)
        last = due_yesterday - timedelta(days=7)
        p = self.plant(last)
        WateringEvent.objects.create(user_plant=p, watered_at=at(last), watered_by=self.user)
        with mock.patch('django.utils.timezone.now', return_value=at(TODAY, 10)):
            res = self.client.post(f'/api/plants/{p.id}/waterings/', {}, format='json')
        self.assertEqual(res.status_code, 201)

        cal = self.client.get(
            '/api/calendar',
            {'from': TODAY.isoformat(), 'to': (TODAY + timedelta(days=21)).isoformat()},
        ).data
        self.assertEqual(cal['days'][TODAY.isoformat()]['overdue'], [])
        next_due = (TODAY + timedelta(days=7)).isoformat()
        self.assertIn(p.id, cal['days'][next_due]['planned'])
        agenda = self.client.get('/api/agenda').data
        self.assertEqual(agenda['sections']['overdue'], [])
        self.assertEqual(agenda['plants'][str(p.id)]['interval_days'], 7)

    def test_agenda_includes_category(self):
        p = self.plant(TODAY)
        plants = self.client.get('/api/agenda').data['plants']
        self.assertEqual(plants[str(p.id)]['category'], 'other')

    def test_interval_days_matches_last_watering_season(self):
        # Summer interval 5, autumn 7. Last watered in summer → interval_days=5 even if today is autumn.
        summer_day = date(2026, 8, 20)
        p = self.plant(summer_day)
        WateringEvent.objects.create(user_plant=p, watered_at=at(summer_day), watered_by=self.user)
        info = self.client.get('/api/agenda').data['plants'][str(p.id)]
        self.assertEqual(info['interval_days'], 5)
        detail = self.client.get(f'/api/plants/{p.id}/').data
        self.assertEqual(detail['interval_days'], 5)

    def test_species_requires_min_query(self):
        self.assertEqual(self.client.get('/api/species').data, [])
        self.assertEqual(self.client.get('/api/species', {'q': 'f'}).data, [])
        # Cyrillic case-insensitive (SQLite SQL LOWER is not enough)
        res = self.client.get('/api/species', {'q': '\u0444\u0438'})  # "фи"
        self.assertEqual(res.status_code, 200)
        self.assertTrue(any(s['slug'] == 'ficus' for s in res.data))
        self.species.name_lat = 'Ficus benjamina'
        self.species.save(update_fields=['name_lat'])
        lat = self.client.get('/api/species', {'q': 'fic'}).data
        self.assertTrue(any(s['slug'] == 'ficus' for s in lat))


class PhotoTests(ApiTestBase):
    def upload(self, plant, content: bytes, name='p.jpg'):
        return self.client.post(
            f'/api/plants/{plant.id}/photo/', {'photo': SimpleUploadedFile(name, content)}, format='multipart'
        )

    def test_agenda_links_photo_instead_of_inlining_it(self):
        p = self.plant(TODAY)
        buf = BytesIO()
        Image.new('RGB', (1200, 800), 'green').save(buf, format='PNG')
        self.assertEqual(self.upload(p, buf.getvalue(), 'p.png').status_code, 200)

        url = self.client.get('/api/agenda').data['plants'][str(p.id)]['photo_url']
        self.assertRegex(url, rf'/api/photos/{p.id}/[0-9a-f]{{20}}\.jpg$')

        anon = APIClient()
        res = anon.get(url)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res['Content-Type'], 'image/jpeg')
        self.assertIn('immutable', res['Cache-Control'])
        self.assertEqual(Image.open(BytesIO(res.content)).size, (900, 600))
        self.assertEqual(anon.get(f'/api/photos/{p.id}/{"0" * 20}.jpg').status_code, 404)

    def test_rejects_non_image(self):
        p = self.plant(TODAY)
        self.assertEqual(self.upload(p, b'not an image').status_code, 400)


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
