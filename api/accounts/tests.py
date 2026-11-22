from datetime import date, time
from io import BytesIO
from unittest import mock

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from PIL import Image
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from notifications.models import NotificationPrefs


def jpeg_bytes(color='green') -> bytes:
    buf = BytesIO()
    Image.new('RGB', (120, 120), color).save(buf, format='JPEG')
    return buf.getvalue()


class ProfileApiTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user('Yana', password='x', first_name='Яна')
        self.client = APIClient()
        token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token.key}')

    def test_me_returns_avatar_null(self):
        res = self.client.get('/api/me')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['first_name'], 'Яна')
        self.assertIsNone(res.data['avatar_url'])

    def test_patch_first_name(self):
        res = self.client.patch('/api/me', {'first_name': 'Яночка'}, format='json')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['first_name'], 'Яночка')
        self.user.refresh_from_db()
        self.assertEqual(self.user.first_name, 'Яночка')

    def test_upload_avatar(self):
        upload = SimpleUploadedFile('a.jpg', jpeg_bytes(), content_type='image/jpeg')
        res = self.client.patch('/api/me', {'avatar': upload}, format='multipart')
        self.assertEqual(res.status_code, 200)
        self.assertRegex(res.data['avatar_url'], rf'/api/avatars/{self.user.id}/[0-9a-f]{{20}}\.jpg$')
        anon = APIClient()
        img = anon.get(res.data['avatar_url'])
        self.assertEqual(img.status_code, 200)
        self.assertEqual(img['Content-Type'], 'image/jpeg')

    def test_changing_remind_time_clears_last_sent_on(self):
        prefs, _ = NotificationPrefs.objects.get_or_create(user=self.user)
        prefs.remind_time = time(9, 0)
        prefs.last_sent_on = date(2026, 11, 22)
        prefs.save(update_fields=['remind_time', 'last_sent_on'])
        res = self.client.patch(
            '/api/me/notification-prefs',
            {'remind_time': '17:02'},
            format='json',
        )
        self.assertEqual(res.status_code, 200)
        prefs.refresh_from_db()
        self.assertEqual(prefs.remind_time, time(17, 2))
        self.assertIsNone(prefs.last_sent_on)
