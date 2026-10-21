import json

from django.conf import settings
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from notifications.models import PushSubscription
from notifications.push import send_web_push
from notifications.serializers import PushSubscribeSerializer
from plants.queries import household_plants_queryset
from plants.services.schedule import feed_sort_key, watering_status


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


class PushTestView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        subs = PushSubscription.objects.filter(user=request.user)
        if not subs.exists():
            return Response({'detail': 'Нет push-подписки.'}, status=status.HTTP_400_BAD_REQUEST)
        payload = {
            'title': 'Незалейка',
            'body': 'Тестовое уведомление — всё работает!',
            'url': '/',
        }
        for sub in subs:
            send_web_push(sub, payload)
        return Response({'ok': True, 'sent': subs.count()})


class PushNotifyPlantsView(APIView):
    """Debug: send push for urgent plants now."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        plants = list(household_plants_queryset())
        urgent = [p for p in plants if watering_status(p) in ('overdue', 'due_today')]
        if not urgent:
            return Response({'detail': 'Нет срочных поливов.'}, status=status.HTTP_400_BAD_REQUEST)
        urgent.sort(key=lambda p: feed_sort_key(p))
        plant = urgent[0]
        photo_url = None
        if plant.photo:
            photo_url = request.build_absolute_uri(plant.photo.url)
        payload = {
            'title': f'Пора полить: {plant.name}',
            'body': plant.species.name_ru,
            'url': f'/plants/{plant.id}',
            'image': photo_url,
        }
        subs = PushSubscription.objects.filter(user=request.user)
        for sub in subs:
            send_web_push(sub, payload)
        return Response({'ok': True, 'plant_id': plant.id})
