from datetime import date, timedelta

from django.db import transaction
from django.http import Http404, HttpResponse
from django.utils import timezone
from rest_framework import generics, status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from plants.models import PlantSpecies, UserPlant
from plants.queries import household_plants_queryset, household_waterings_queryset
from plants.serializers import (
    FeedPlantSerializer,
    PlantSpeciesSerializer,
    UserPlantSerializer,
    WateringEventSerializer,
    plant_photo_url,
)
from plants.services.photos import InvalidPhoto, decode_data_url, photo_digest, photo_to_data_url
from plants.services.schedule import (
    display_name,
    feed_sort_key,
    last_watering,
    local_date,
    next_due_at,
    plant_interval_days,
    plant_stats,
    planned_dates,
    watering_status,
)

MAX_CALENDAR_DAYS = 62


def plant_info(plant, request) -> dict:
    last = last_watering(plant)
    return {
        'id': plant.id,
        'name': plant.name,
        'species_name': plant.species.name_ru,
        'category': plant.species.category,
        'room': plant.room,
        'photo_url': plant_photo_url(plant, request),
        'interval_days': plant_interval_days(plant),
        'last_watered_at': last.watered_at.isoformat() if last else None,
        'last_watered_by': display_name(last.watered_by) if last else '',
    }


def done_item(w) -> dict:
    return {
        'plant_id': w.user_plant_id,
        'watering_id': w.id,
        'watered_at': w.watered_at.isoformat(),
        'watered_by_name': display_name(w.watered_by),
    }


def parse_iso_date(raw: str | None, fallback: date) -> date:
    if not raw:
        return fallback
    try:
        return date.fromisoformat(raw)
    except ValueError:
        return fallback


class PlantSpeciesListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = PlantSpeciesSerializer
    pagination_class = None

    def get_queryset(self):
        return PlantSpecies.objects.all()

    def list(self, request, *args, **kwargs):
        q = request.query_params.get('q', '').strip()
        # Full catalog is not exposed — UI must search (min 2 chars).
        # Filter in Python: SQLite LOWER/icontains is unreliable for Cyrillic.
        if len(q) < 2:
            return Response([])
        needle = q.casefold()
        qs = self.get_queryset()
        cat = request.query_params.get('category')
        if cat:
            qs = qs.filter(category=cat)
        matched = [
            s
            for s in qs
            if needle in s.name_ru.casefold() or needle in (s.name_lat or '').casefold()
        ]
        return Response(self.get_serializer(matched, many=True).data)


class UserPlantViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = UserPlantSerializer
    parser_classes = [JSONParser, MultiPartParser, FormParser]

    def get_queryset(self):
        return household_plants_queryset()

    @action(detail=True, methods=['post'], url_path='photo')
    def upload_photo(self, request, pk=None):
        plant = self.get_object()
        photo = request.FILES.get('photo')
        if not photo:
            return Response({'detail': 'Файл photo обязателен.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            plant.photo_data = photo_to_data_url(photo)
        except InvalidPhoto as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        plant.save(update_fields=['photo_data', 'updated_at'])
        return Response(self.get_serializer(plant).data)

    @action(detail=True, methods=['get', 'post'], url_path='waterings')
    def waterings(self, request, pk=None):
        if request.method == 'GET':
            plant = self.get_object()
            events = plant.waterings.select_related('watered_by').order_by('-watered_at')[:200]
            return Response(WateringEventSerializer(events, many=True).data)

        ser = WateringEventSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        watered_at = ser.validated_data.get('watered_at') or timezone.now()
        day = local_date(watered_at)
        today = timezone.localdate()

        with transaction.atomic():
            try:
                plant = self.get_queryset().select_for_update().get(pk=pk)
            except UserPlant.DoesNotExist as exc:
                raise Http404 from exc
            existing = list(plant.waterings.all())
            already = any(local_date(w.watered_at) == day for w in existing)
            if already:
                return Response(
                    {'detail': 'Это растение уже полито в этот день.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            # First watering (after add) and past-date backfill are always allowed.
            # Live watering on today: only when overdue / due_today.
            if existing and day >= today:
                st = watering_status(plant)
                if st in ('ok', 'due_soon'):
                    return Response(
                        {'detail': 'Ещё рано поливать — дождитесь дня по графику.'},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
            event = ser.save(user_plant=plant, watered_by=request.user)
        return Response(WateringEventSerializer(event).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'], url_path='stats')
    def stats(self, request, pk=None):
        return Response(plant_stats(self.get_object()))


class PlantPhotoView(APIView):
    """Public, content-addressed photo URL so <img> works without auth headers and caches forever."""

    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request, pk: int, digest: str):
        plant = UserPlant.objects.filter(pk=pk).only('photo_data').first()
        if not plant or not plant.photo_data or photo_digest(plant.photo_data) != digest:
            raise Http404
        content_type, body = decode_data_url(plant.photo_data)
        response = HttpResponse(body, content_type=content_type)
        response['Cache-Control'] = 'public, max-age=31536000, immutable'
        return response


class WateringDestroyView(generics.DestroyAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = WateringEventSerializer

    def get_queryset(self):
        return household_waterings_queryset()


class CalendarView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        today = timezone.localdate()
        start = parse_iso_date(request.query_params.get('from'), today.replace(day=1))
        end = parse_iso_date(request.query_params.get('to'), start + timedelta(days=41))
        if end < start:
            start, end = end, start
        if (end - start).days > MAX_CALENDAR_DAYS:
            end = start + timedelta(days=MAX_CALENDAR_DAYS)

        plants = list(household_plants_queryset())
        days: dict[str, dict] = {}

        def bucket(d: date) -> dict:
            return days.setdefault(d.isoformat(), {'done': [], 'planned': [], 'overdue': []})

        for p in plants:
            for w in p.waterings.all():
                d = local_date(w.watered_at)
                if start <= d <= end:
                    bucket(d)['done'].append(done_item(w))
            due = next_due_at(p)
            if due < today:
                if start <= due <= end:
                    bucket(due)['overdue'].append(p.id)
                if start <= today <= end:
                    bucket(today)['overdue'].append(p.id)
            for d in planned_dates(p, start, end, today):
                if d >= today:
                    bucket(d)['planned'].append(p.id)

        for b in days.values():
            b['done'].sort(key=lambda x: x['watered_at'])

        return Response(
            {
                'from': start.isoformat(),
                'to': end.isoformat(),
                'today': today.isoformat(),
                'plants': {str(p.id): plant_info(p, request) for p in plants},
                'days': days,
            }
        )


class AgendaView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        today = timezone.localdate()
        plants = list(household_plants_queryset())
        plants.sort(key=lambda p: feed_sort_key(p))
        sections: dict[str, list] = {'overdue': [], 'today': [], 'tomorrow': [], 'week': [], 'later': []}
        done_today = []

        for p in plants:
            due = next_due_at(p)
            delta = (due - today).days
            item = {'plant_id': p.id, 'due': due.isoformat(), 'days_until': delta}
            if delta < 0:
                sections['overdue'].append(item)
            elif delta == 0:
                sections['today'].append(item)
            elif delta == 1:
                sections['tomorrow'].append(item)
            elif delta <= 7:
                sections['week'].append(item)
            else:
                sections['later'].append(item)
            for w in p.waterings.all():
                if local_date(w.watered_at) == today:
                    done_today.append(done_item(w))

        done_today.sort(key=lambda x: x['watered_at'], reverse=True)
        return Response(
            {
                'today': today.isoformat(),
                'plants': {str(p.id): plant_info(p, request) for p in plants},
                'sections': sections,
                'done_today': done_today,
            }
        )


class FeedWateringView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        plants = list(household_plants_queryset())
        plants.sort(key=lambda p: feed_sort_key(p))
        data = FeedPlantSerializer(plants, many=True, context={'request': request}).data
        return Response(data)


class WidgetNextView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        plants = list(household_plants_queryset())
        plants.sort(key=lambda p: feed_sort_key(p))
        top = plants[:3]
        return Response(FeedPlantSerializer(top, many=True, context={'request': request}).data)


class DashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        plants = list(household_plants_queryset())
        counts = {'overdue': 0, 'due_today': 0, 'due_soon': 0, 'ok': 0}
        for p in plants:
            counts[watering_status(p)] += 1
        return Response({**counts, 'total': len(plants)})
