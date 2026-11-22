from datetime import date, datetime, time, timedelta
from unittest import mock
from zoneinfo import ZoneInfo

from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework.test import APIClient

from notifications.cron import is_season_start, send_scheduled_push, send_season_push, urgent_plants
from notifications.models import NotificationPrefs, PlantSnooze, PushSubscription
from notifications.views import run_due_pushes
from plants.models import PlantSpecies, UserPlant

MSK = ZoneInfo('Europe/Moscow')
UTC = ZoneInfo('UTC')


def msk(day: int, hour: int, minute: int = 0) -> datetime:
    return datetime(2026, 10, day, hour, minute, tzinfo=MSK)


@mock.patch('notifications.cron.today_payload', return_value={'title': 't', 'body': 'b', 'url': '/'})
@mock.patch('notifications.cron.urgent_plants', return_value=['plant'])
@mock.patch('notifications.cron.send_web_push', return_value=True)
class ScheduledPushTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user('Yana', password='x')
        NotificationPrefs.objects.filter(user=self.user).update(remind_time=time(9, 0))
        PushSubscription.objects.create(user=self.user, endpoint='https://push/1', p256dh='k', auth='a')

    def test_not_sent_before_remind_time(self, send, *_):
        self.assertEqual(send_scheduled_push(msk(21, 8, 50)), 0)
        send.assert_not_called()

    def test_sent_once_per_day_even_if_scheduler_is_late(self, send, *_):
        self.assertEqual(send_scheduled_push(msk(21, 9, 40)), 1)
        self.assertEqual(send_scheduled_push(msk(21, 10, 0)), 0)
        self.assertEqual(send_scheduled_push(msk(22, 9, 5)), 1)
        self.assertEqual(send.call_count, 2)

    def test_still_sent_when_scheduler_is_hours_late(self, send, *_):
        self.assertEqual(send_scheduled_push(msk(21, 16, 0)), 1)
        send.assert_called_once()

    def test_nothing_urgent_with_only_urgent_does_not_burn_day(self, send, urgent, _):
        urgent.return_value = []
        self.assertEqual(send_scheduled_push(msk(21, 9, 5)), 0)
        send.assert_not_called()
        prefs = NotificationPrefs.objects.get(user=self.user)
        self.assertIsNone(prefs.last_sent_on)
        urgent.return_value = ['plant']
        self.assertEqual(send_scheduled_push(msk(21, 13, 0)), 1)
        send.assert_called_once()

    def test_failed_delivery_rolls_back_claim(self, send, *_):
        send.return_value = False
        self.assertEqual(send_scheduled_push(msk(21, 9, 5)), 0)
        prefs = NotificationPrefs.objects.get(user=self.user)
        self.assertIsNone(prefs.last_sent_on)
        send.return_value = True
        self.assertEqual(send_scheduled_push(msk(21, 9, 10)), 1)
        prefs.refresh_from_db()
        self.assertEqual(prefs.last_sent_on, date(2026, 10, 21))

    def test_double_call_does_not_duplicate(self, send, *_):
        self.assertEqual(send_scheduled_push(msk(21, 9, 5)), 1)
        self.assertEqual(send_scheduled_push(msk(21, 9, 6)), 0)
        self.assertEqual(send.call_count, 1)


@override_settings(CRON_SECRET='s3cret')
class CronEndpointTests(TestCase):
    def setUp(self):
        cache.clear()

    def test_requires_secret(self):
        client = APIClient()
        self.assertEqual(client.post('/api/push/cron').status_code, 403)
        self.assertEqual(client.post('/api/push/cron', HTTP_X_CRON_SECRET='nope').status_code, 403)
        with mock.patch('notifications.views.run_due_pushes', return_value=0):
            res = client.post('/api/push/cron', HTTP_X_CRON_SECRET='s3cret')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()['ok'], True)
        self.assertEqual(res.json()['sent'], 0)

    @override_settings(CRON_SECRET='')
    def test_disabled_without_configured_secret(self):
        self.assertEqual(APIClient().post('/api/push/cron', HTTP_X_CRON_SECRET='').status_code, 403)


class PushTestViewTests(TestCase):
    @override_settings(VAPID_PRIVATE_KEY='', VAPID_PUBLIC_KEY='')
    def test_reports_missing_server_keys(self):
        user = get_user_model().objects.create_user('Yana', password='x')
        PushSubscription.objects.create(user=user, endpoint='https://push/1', p256dh='k', auth='a')
        client = APIClient()
        client.force_authenticate(user)
        self.assertEqual(client.post('/api/push/test').status_code, 503)


@mock.patch('notifications.cron.send_web_push', return_value=True)
class SeasonPushTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user('Season', password='x')
        NotificationPrefs.objects.filter(user=self.user).update(season_alerts=True, enabled=True)
        PushSubscription.objects.create(user=self.user, endpoint='https://push/season', p256dh='k', auth='a')

    def test_season_start_days(self, *_):
        self.assertEqual(is_season_start(date(2026, 3, 1)), 'spring')
        self.assertEqual(is_season_start(date(2026, 6, 1)), 'summer')
        self.assertIsNone(is_season_start(date(2026, 3, 2)))
        self.assertIsNone(is_season_start(date(2026, 4, 1)))

    def test_sends_once_on_season_start(self, send):
        spring = datetime(2026, 3, 1, 10, 0, tzinfo=MSK)
        self.assertEqual(send_season_push(spring), 1)
        self.assertEqual(send_season_push(spring), 0)
        prefs = NotificationPrefs.objects.get(user=self.user)
        self.assertEqual(prefs.last_season_notified, '2026-spring')
        self.assertEqual(send.call_count, 1)

    def test_mid_season_skips(self, send):
        self.assertEqual(send_season_push(datetime(2026, 3, 15, 10, 0, tzinfo=MSK)), 0)
        send.assert_not_called()

    def test_disabled_season_alerts(self, send):
        NotificationPrefs.objects.filter(user=self.user).update(season_alerts=False)
        self.assertEqual(send_season_push(datetime(2026, 3, 1, 10, 0, tzinfo=MSK)), 0)
        send.assert_not_called()


class UrgentTimezoneAndSnoozeTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user('Tz', password='x')
        self.species = PlantSpecies.objects.create(
            slug='test-fern',
            name_ru='Папоротник',
            spring_days=3,
            summer_days=3,
            winter_days=7,
        )
        self.plant = UserPlant.objects.create(
            user=self.user,
            species=self.species,
            name='Папоротник',
            added_at=timezone.now() - timedelta(days=10),
        )

    def test_urgent_plants_uses_on_date(self):
        due = urgent_plants(on_date=timezone.localdate())
        self.assertTrue(any(p.id == self.plant.id for p in due))

    def test_snooze_excludes_plant_from_push(self):
        NotificationPrefs.objects.filter(user=self.user).update(
            remind_time=time(9, 0),
            only_urgent=True,
            timezone_name='Europe/Moscow',
        )
        PushSubscription.objects.create(user=self.user, endpoint='https://push/snooze', p256dh='k', auth='a')
        PlantSnooze.objects.create(
            user=self.user,
            plant=self.plant,
            until=datetime(2026, 10, 21, 23, 59, tzinfo=MSK),
        )
        with mock.patch('notifications.cron.send_web_push', return_value=True) as send:
            # Plant is due but snoozed — only_urgent should not burn/send empty.
            with mock.patch(
                'notifications.cron.urgent_plants',
                wraps=urgent_plants,
            ):
                sent = send_scheduled_push(msk(21, 10, 0))
        # If the only plant is snoozed, urgent list for user is empty → no send.
        prefs = NotificationPrefs.objects.get(user=self.user)
        if sent == 0:
            self.assertIsNone(prefs.last_sent_on)
            send.assert_not_called()
        else:
            # Household may have other fixtures in other tests; this class is isolated.
            self.fail('unexpected send when only plant is snoozed')


class SnoozeApiTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user('SnoozeApi', password='x')
        self.species = PlantSpecies.objects.create(
            slug='snooze-plant',
            name_ru='Фикус',
            spring_days=5,
            summer_days=5,
            winter_days=10,
        )
        self.plant = UserPlant.objects.create(
            user=self.user,
            species=self.species,
            name='Фикус',
            added_at=timezone.now(),
        )
        self.client = APIClient()
        self.client.force_authenticate(self.user)

    def test_snooze_create_list_delete(self):
        res = self.client.post(f'/api/plants/{self.plant.id}/snooze')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()['plant_id'], self.plant.id)
        listed = self.client.get('/api/snoozes')
        self.assertEqual(listed.status_code, 200)
        self.assertEqual(len(listed.json()), 1)
        deleted = self.client.delete(f'/api/plants/{self.plant.id}/snooze')
        self.assertEqual(deleted.status_code, 200)
        self.assertEqual(self.client.get('/api/snoozes').json(), [])


class RunDuePushesLockTests(TestCase):
    def setUp(self):
        cache.clear()

    def test_lock_skips_second_call(self):
        with mock.patch('notifications.views.send_scheduled_push', return_value=2) as send:
            self.assertEqual(run_due_pushes(), 2)
            self.assertIsNone(run_due_pushes())
            send.assert_called_once()
