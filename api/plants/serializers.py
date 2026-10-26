from datetime import timedelta

from django.utils import timezone
from django.utils.dateparse import parse_datetime
from rest_framework import serializers

from plants.models import PlantSpecies, UserPlant, WateringEvent
from plants.services.photos import InvalidPhoto, photo_digest, photo_to_data_url
from plants.services.schedule import (
    days_until_due,
    display_name,
    last_watering,
    next_due_at,
    plant_interval_days,
    season_hint,
    watering_status,
)


def plant_photo_url(obj: UserPlant, request=None) -> str | None:
    if obj.photo_data:
        path = f'/api/photos/{obj.pk}/{photo_digest(obj.photo_data)}.jpg'
        return request.build_absolute_uri(path) if request else path
    if obj.photo:
        try:
            return request.build_absolute_uri(obj.photo.url) if request else obj.photo.url
        except ValueError:
            return None
    return None


class PlantSpeciesSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlantSpecies
        fields = (
            'id',
            'slug',
            'name_ru',
            'name_lat',
            'category',
            'spring_days',
            'summer_days',
            'autumn_days',
            'winter_days',
            'care_hint',
            'image_url',
        )


class WateringEventSerializer(serializers.ModelSerializer):
    watered_by_name = serializers.SerializerMethodField()

    class Meta:
        model = WateringEvent
        fields = ('id', 'watered_at', 'note', 'created_at', 'watered_by_name')
        read_only_fields = ('id', 'created_at', 'watered_by_name')
        extra_kwargs = {'watered_at': {'required': False}}

    def get_watered_by_name(self, obj):
        return display_name(obj.watered_by)

    def validate_watered_at(self, value):
        now = timezone.now()
        if value > now + timedelta(minutes=2):
            raise serializers.ValidationError('Дата полива не может быть в будущем.')
        if value > now:
            return now
        return value

    def create(self, validated_data):
        if 'watered_at' not in validated_data or validated_data['watered_at'] is None:
            validated_data['watered_at'] = timezone.now()
        return super().create(validated_data)


class UserPlantSerializer(serializers.ModelSerializer):
    species_detail = PlantSpeciesSerializer(source='species', read_only=True)
    species_id = serializers.PrimaryKeyRelatedField(
        queryset=PlantSpecies.objects.all(), source='species', write_only=True, required=False
    )
    photo = serializers.ImageField(write_only=True, required=False, allow_null=True)
    photo_url = serializers.SerializerMethodField()
    category = serializers.CharField(source='species.category', read_only=True)
    status = serializers.SerializerMethodField()
    next_due = serializers.SerializerMethodField()
    days_until = serializers.SerializerMethodField()
    season_hint = serializers.SerializerMethodField()
    interval_days = serializers.SerializerMethodField()
    last_watered_at = serializers.SerializerMethodField()
    last_watered_by = serializers.SerializerMethodField()

    class Meta:
        model = UserPlant
        fields = (
            'id',
            'name',
            'species_id',
            'species_detail',
            'category',
            'photo',
            'photo_url',
            'room',
            'note',
            'added_at',
            'status',
            'next_due',
            'days_until',
            'season_hint',
            'interval_days',
            'last_watered_at',
            'last_watered_by',
            'created_at',
            'updated_at',
        )
        read_only_fields = ('id', 'created_at', 'updated_at', 'photo_url', 'category')
        extra_kwargs = {'added_at': {'required': False}}

    def get_photo_url(self, obj):
        return plant_photo_url(obj, self.context.get('request'))

    def get_status(self, obj):
        return watering_status(obj)

    def get_next_due(self, obj):
        return next_due_at(obj).isoformat()

    def get_days_until(self, obj):
        return days_until_due(obj)

    def get_season_hint(self, obj):
        return season_hint(obj.species)

    def get_interval_days(self, obj):
        return plant_interval_days(obj)

    def get_last_watered_at(self, obj):
        last = last_watering(obj)
        if last:
            return last.watered_at.isoformat()
        return obj.added_at.isoformat()

    def get_last_watered_by(self, obj):
        last = last_watering(obj)
        return display_name(last.watered_by) if last else ''

    def _apply_photo(self, validated_data):
        upload = validated_data.pop('photo', None)
        if upload:
            try:
                validated_data['photo_data'] = photo_to_data_url(upload)
            except InvalidPhoto as e:
                raise serializers.ValidationError({'photo': str(e)}) from e

    def create(self, validated_data):
        request = self.context['request']
        if 'species' not in validated_data:
            raise serializers.ValidationError({'species_id': 'Выберите вид растения.'})
        if 'added_at' not in validated_data:
            raw = request.data.get('added_at')
            if raw:
                parsed = parse_datetime(str(raw))
                if parsed:
                    if timezone.is_naive(parsed):
                        parsed = timezone.make_aware(parsed, timezone.get_current_timezone())
                    validated_data['added_at'] = parsed
        if 'added_at' not in validated_data:
            validated_data['added_at'] = timezone.now()
        validated_data['user'] = request.user
        self._apply_photo(validated_data)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        self._apply_photo(validated_data)
        return super().update(instance, validated_data)


class FeedPlantSerializer(UserPlantSerializer):
    species_name = serializers.CharField(source='species.name_ru', read_only=True)
    category = serializers.CharField(source='species.category', read_only=True)

    class Meta(UserPlantSerializer.Meta):
        fields = (
            'id',
            'name',
            'species_name',
            'category',
            'photo_url',
            'status',
            'next_due',
            'days_until',
            'season_hint',
            'interval_days',
            'room',
            'last_watered_by',
        )
