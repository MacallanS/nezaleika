from datetime import timedelta

from django.utils import timezone
from rest_framework import generics, status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from plants.models import PlantSpecies, UserPlant, WateringEvent
from plants.queries import household_plants_queryset, household_waterings_queryset
from plants.serializers import FeedPlantSerializer, PlantSpeciesSerializer, UserPlantSerializer, WateringEventSerializer
from plants.services.schedule import feed_sort_key, interval_days, last_watering_at, next_due_at


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
        plant.photo = photo
        plant.save(update_fields=['photo', 'updated_at'])
        ser = self.get_serializer(plant)
        return Response(ser.data)

    @action(detail=True, methods=['get', 'post'], url_path='waterings')
    def waterings(self, request, pk=None):
        plant = self.get_object()
        if request.method == 'GET':
            events = plant.waterings.all()[:100]
            return Response(WateringEventSerializer(events, many=True).data)
        ser = WateringEventSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        ser.save(user_plant=plant)
        return Response(ser.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'], url_path='schedule')
    def schedule(self, request, pk=None):
        plant = self.get_object()
        today = timezone.localdate()
        history = [
            {'date': w.watered_at.date().isoformat(), 'type': 'actual'}
            for w in plant.waterings.order_by('watered_at')[:200]
        ]
        planned = []
        cursor = timezone.localtime(last_watering_at(plant)).date()
        for _ in range(90):
            days = interval_days(plant.species, cursor)
            cursor = cursor + timedelta(days=days)
            if cursor > today + timedelta(days=90):
                break
            planned.append({'date': cursor.isoformat(), 'type': 'planned'})
        return Response(
            {
                'history': history,
                'planned': planned,
                'next_due': next_due_at(plant).isoformat(),
            }
        )


class WateringDestroyView(generics.DestroyAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = WateringEventSerializer

    def get_queryset(self):
        return household_waterings_queryset()


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
        plants = household_plants_queryset()
        overdue = due_today = due_soon = ok = 0
        for p in plants:
            from plants.services.schedule import watering_status

            st = watering_status(p)
            if st == 'overdue':
                overdue += 1
            elif st == 'due_today':
                due_today += 1
            elif st == 'due_soon':
                due_soon += 1
            else:
                ok += 1
        return Response(
            {
                'overdue': overdue,
                'due_today': due_today,
                'due_soon': due_soon,
                'ok': ok,
                'total': plants.count(),
            }
        )
