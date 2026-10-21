from datetime import datetime, time
from unittest import mock
from zoneinfo import ZoneInfo

from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from notifications.cron import send_scheduled_push
from notifications.models import NotificationPrefs, PushSubscription

MSK = ZoneInfo('Europe/Moscow')


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

    def test_skipped_when_too_late(self, send, *_):
        self.assertEqual(send_scheduled_push(msk(21, 16, 0)), 0)
        send.assert_not_called()

    def test_nothing_urgent_with_only_urgent(self, send, urgent, _):
        urgent.return_value = []
        self.assertEqual(send_scheduled_push(msk(21, 9, 5)), 0)
        send.assert_not_called()


@override_settings(CRON_SECRET='s3cret')
class CronEndpointTests(TestCase):
    def test_requires_secret(self):
        client = APIClient()
        self.assertEqual(client.post('/api/push/cron').status_code, 403)
        self.assertEqual(client.post('/api/push/cron', HTTP_X_CRON_SECRET='nope').status_code, 403)
        with mock.patch('notifications.views.send_scheduled_push', return_value=0):
            res = client.post('/api/push/cron', HTTP_X_CRON_SECRET='s3cret')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json(), {'ok': True, 'sent': 0})

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
