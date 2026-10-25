import hmac

from django.conf import settings
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from notifications.models import NotificationPrefs, PushSubscription
from notifications.push import push_configured, send_web_push
from notifications.cron import send_scheduled_push, today_payload, urgent_plants
from notifications.serializers import PushSubscribeSerializer


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
        PushSubscription.objects.update_or_create(
            endpoint=data['endpoint'],
            defaults={
                'user': request.user,
                'p256dh': data['keys']['p256dh'],
                'auth': data['keys']['auth'],
            },
        )
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


class PushTestView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            subs = list(PushSubscription.objects.filter(user=request.user))
            if not subs:
                return Response({'detail': 'Нет push-подписки. Нажмите «Подключить на этом телефоне».'}, status=status.HTTP_400_BAD_REQUEST)
            if not push_configured():
                return Response({'detail': 'Push не настроен на сервере (VAPID).'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
            payload = {
                'title': 'Незалейка',
                'body': 'Тестовое уведомление — всё работает!',
                'url': '/',
                'tag': 'nezaleika-test',
            }
            sent = sum(1 for sub in subs if send_web_push(sub, payload))
            if not sent:
                return Response(
                    {'detail': 'Не удалось доставить. Удалите приложение с экрана «Домой», добавьте снова и подключите push.'},
                    status=status.HTTP_502_BAD_GATEWAY,
                )
            return Response({'ok': True, 'sent': sent})
        except Exception:
            import logging

            logging.getLogger(__name__).exception('push test crashed')
            return Response(
                {'detail': 'Ошибка сервера при отправке push. Попробуйте ещё раз через минуту.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class CronPushView(APIView):
    """Called by the external scheduler (GitHub Actions) every 15 minutes."""

    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        secret = settings.CRON_SECRET
        given = request.headers.get('X-Cron-Secret', '')
        if not secret or not hmac.compare_digest(given, secret):
            return Response(status=status.HTTP_403_FORBIDDEN)
        return Response({'ok': True, 'sent': send_scheduled_push()})


class PushNotifyPlantsView(APIView):
    """Debug: send push for urgent plants now."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        urgent = urgent_plants()
        if not urgent:
            return Response({'detail': 'Нет срочных поливов.'}, status=status.HTTP_400_BAD_REQUEST)
        payload = today_payload(urgent)
        subs = PushSubscription.objects.filter(user=request.user)
        for sub in subs:
            send_web_push(sub, payload)
        return Response({'ok': True, 'count': len(urgent)})
