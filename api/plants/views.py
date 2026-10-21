from datetime import date, timedelta

from django.utils import timezone
from rest_framework import generics, status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from plants.models import PlantSpecies
from plants.queries import household_plants_queryset, household_waterings_queryset
from plants.serializers import (
    FeedPlantSerializer,
    PlantSpeciesSerializer,
    UserPlantSerializer,
    WateringEventSerializer,
    plant_photo_url,
)
from plants.services.photos import photo_to_data_url
from plants.services.schedule import (
    display_name,
    feed_sort_key,
    interval_days,
    last_watering,
    local_date,
    next_due_at,
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
        'room': plant.room,
        'photo_url': plant_photo_url(plant, request),
        'interval_days': interval_days(plant.species),
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
        qs = PlantSpecies.objects.all()
        q = self.request.query_params.get('q', '').strip()
        if q:
            qs = qs.filter(name_ru__icontains=q) | qs.filter(name_lat__icontains=q)
        cat = self.request.query_params.get('category')
        if cat:
            qs = qs.filter(category=cat)
        return qs


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
        plant.photo_data = photo_to_data_url(photo)
        plant.save(update_fields=['photo_data', 'updated_at'])
        return Response(self.get_serializer(plant).data)

    @action(detail=True, methods=['get', 'post'], url_path='waterings')
    def waterings(self, request, pk=None):
        plant = self.get_object()
        if request.method == 'GET':
            events = plant.waterings.select_related('watered_by').order_by('-watered_at')[:200]
            return Response(WateringEventSerializer(events, many=True).data)
        ser = WateringEventSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        ser.save(user_plant=plant, watered_by=request.user)
        return Response(ser.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'], url_path='stats')
    def stats(self, request, pk=None):
        return Response(plant_stats(self.get_object()))


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
