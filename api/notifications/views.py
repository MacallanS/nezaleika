import hmac
import logging
import threading
import time

from datetime import datetime

from django.conf import settings
from django.core.cache import cache
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from notifications.cron import (
    active_snooze_plant_ids,
    purge_expired_snoozes,
    resolve_tz,
    send_scheduled_push,
    today_payload,
    urgent_plants,
)
from notifications.models import NotificationPrefs, PlantSnooze, PushSubscription
from notifications.push import push_configured, send_web_push
from notifications.serializers import PushSubscribeSerializer
from plants.queries import household_plants_queryset

logger = logging.getLogger(__name__)

_TICK_CACHE_KEY = 'nz_push_tick_at'
_TICK_MIN_INTERVAL_SEC = 2 * 60
_tick_lock = threading.Lock()


def run_due_pushes(now=None) -> int | None:
    """Locked entry for all schedulers. Returns sent count, or None if another tick holds the lock."""
    now_ts = time.time()
    with _tick_lock:
        last = cache.get(_TICK_CACHE_KEY)
        if last and now_ts - float(last) < _TICK_MIN_INTERVAL_SEC:
            return None
        cache.set(_TICK_CACHE_KEY, now_ts, timeout=_TICK_MIN_INTERVAL_SEC * 2)
    try:
        purge_expired_snoozes()
        return send_scheduled_push(now)
    except Exception:
        logger.exception('run_due_pushes failed')
        return None


def maybe_tick_push() -> int | None:
    """Backward-compatible alias used by CSRF keep-alive."""
    return run_due_pushes()


class VapidPublicKeyView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({'publicKey': settings.VAPID_PUBLIC_KEY})


class PushSubscribeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        ser = PushSubscribeSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        data = ser.validated_data
        endpoint = data['endpoint']
        PushSubscription.objects.update_or_create(
            endpoint=endpoint,
            defaults={
                'user': request.user,
                'p256dh': data['keys']['p256dh'],
                'auth': data['keys']['auth'],
            },
        )
        # Drop stale endpoints for this user so reconnect does not pile up dead subs.
        PushSubscription.objects.filter(user=request.user).exclude(endpoint=endpoint).delete()
        return Response({'ok': True})

    def delete(self, request):
        endpoint = request.data.get('endpoint')
        if endpoint:
            PushSubscription.objects.filter(user=request.user, endpoint=endpoint).delete()
        else:
            PushSubscription.objects.filter(user=request.user).delete()
        return Response({'ok': True})


class PushStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        subs = PushSubscription.objects.filter(user=request.user).count()
        prefs = NotificationPrefs.objects.filter(user=request.user).first()
        return Response(
            {
                'vapid_configured': push_configured(),
                'subscriptions': subs,
                'prefs_enabled': bool(prefs and prefs.enabled),
                'remind_time': prefs.remind_time.strftime('%H:%M') if prefs else None,
            }
        )


def _push_test_failure_detail(results) -> str:
    errors = [r.error for r in results if not r.ok]
    statuses = [r.status for r in results if not r.ok and r.status]
    if any(e == 'vapid_missing' for e in errors) or any(e == 'vapid_invalid' for e in errors):
        return 'Ошибка VAPID на сервере. Ключ не читается — проверьте Variables на Railway.'
    if any(e == 'vapid_rejected' for e in errors) or any(s in (401, 403) for s in statuses):
        return 'Push-сервис отклонил VAPID. Нажмите «Подключить push» ещё раз (новая подписка).'
    if any(e == 'subscription_gone' for e in errors) or any(s in (404, 410) for s in statuses):
        return 'Подписка устарела. Нажмите «Подключить push» ещё раз — сносить PWA не нужно.'
    if statuses:
        return f'Не удалось доставить (HTTP {statuses[0]}). Нажмите «Подключить push» и повторите тест.'
    unexpected = next((e for e in errors if e.startswith('unexpected:')), '')
    if unexpected:
        short = unexpected.split(':', 2)[-1][:120]
        return f'Ошибка отправки push: {short}. Нажмите «Переподключить push».'
    return 'Не удалось доставить. Нажмите «Подключить push» ещё раз и повторите тест.'


class PushTestView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            if not push_configured():
                return Response(
                    {'detail': 'Push не настроен на сервере (VAPID).'},
                    status=status.HTTP_503_SERVICE_UNAVAILABLE,
                )
            subs = list(PushSubscription.objects.filter(user=request.user))
            if not subs:
                return Response(
                    {'detail': 'Нет push-подписки. Нажмите «Подключить на этом телефоне».'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            payload = {
                'title': 'Незалейка',
                'body': 'Тестовое уведомление — всё работает!',
                'url': '/',
                'tag': 'nezaleika-test',
            }
            results = [send_web_push(sub, payload) for sub in subs]
            sent = sum(1 for r in results if r.ok)
            if not sent:
                return Response(
                    {'detail': _push_test_failure_detail(results)},
                    status=status.HTTP_502_BAD_GATEWAY,
                )
            return Response({'ok': True, 'sent': sent})
        except Exception:
            logger.exception('push test crashed')
            return Response(
                {'detail': 'Ошибка сервера при отправке push. Попробуйте ещё раз через минуту.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class CronPushView(APIView):
    """Called by an external scheduler with X-Cron-Secret."""

    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        secret = settings.CRON_SECRET
        given = request.headers.get('X-Cron-Secret', '')
        if not secret or not hmac.compare_digest(given, secret):
            return Response(status=status.HTTP_403_FORBIDDEN)
        sent = run_due_pushes()
        return Response({'ok': True, 'ticked': sent is not None, 'sent': sent or 0})


class PushTickView(APIView):
    """Public keep-alive tick: sends due reminders at most once per lock interval."""

    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request):
        sent = run_due_pushes()
        return Response({'ok': True, 'ticked': sent is not None, 'sent': sent or 0})

    def post(self, request):
        return self.get(request)


class PushNotifyPlantsView(APIView):
    """Debug: send push for urgent plants now (respects snooze)."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        today = timezone.localdate()
        snoozed = active_snooze_plant_ids(request.user.id)
        urgent = urgent_plants(on_date=today, exclude_plant_ids=snoozed)
        if not urgent:
            return Response({'detail': 'Нет срочных поливов.'}, status=status.HTTP_400_BAD_REQUEST)
        payload = today_payload(urgent)
        subs = PushSubscription.objects.filter(user=request.user)
        for sub in subs:
            send_web_push(sub, payload)
        return Response({'ok': True, 'count': len(urgent)})


class SnoozeListView(APIView):
    """Active snoozes for the current user."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        purge_expired_snoozes()
        rows = PlantSnooze.objects.filter(user=request.user, until__gt=timezone.now()).order_by('until')
        return Response(
            [
                {'plant_id': row.plant_id, 'until': row.until.isoformat()}
                for row in rows
            ]
        )


class PlantSnoozeView(APIView):
    """POST = snooze until end of local day (or body.until); DELETE = clear."""

    permission_classes = [IsAuthenticated]

    def post(self, request, pk: int):
        plant = household_plants_queryset().filter(pk=pk).first()
        if not plant:
            return Response({'detail': 'Растение не найдено.'}, status=status.HTTP_404_NOT_FOUND)

        until_raw = request.data.get('until') if isinstance(request.data, dict) else None
        if until_raw:
            try:
                until = datetime.fromisoformat(str(until_raw).replace('Z', '+00:00'))
                if timezone.is_naive(until):
                    until = timezone.make_aware(until)
            except ValueError:
                return Response({'detail': 'Некорректный until.'}, status=status.HTTP_400_BAD_REQUEST)
        else:
            prefs = NotificationPrefs.objects.filter(user=request.user).first()
            tz = resolve_tz(prefs.timezone_name if prefs else 'Europe/Moscow')
            local = timezone.now().astimezone(tz)
            until = local.replace(hour=23, minute=59, second=59, microsecond=999000)

        row, _ = PlantSnooze.objects.update_or_create(
            user=request.user,
            plant=plant,
            defaults={'until': until},
        )
        return Response({'ok': True, 'plant_id': plant.id, 'until': row.until.isoformat()})

    def delete(self, request, pk: int):
        PlantSnooze.objects.filter(user=request.user, plant_id=pk).delete()
        return Response({'ok': True})
