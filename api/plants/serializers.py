from django.utils import timezone
from rest_framework import serializers

from plants.models import PlantSpecies, UserPlant, WateringEvent
from plants.services.schedule import (
    days_until_due,
    next_due_at,
    season_hint,
    watering_status,
)


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
        )


class WateringEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = WateringEvent
        fields = ('id', 'watered_at', 'note', 'created_at')
        read_only_fields = ('id', 'created_at')

    def validate_watered_at(self, value):
        if value > timezone.now():
            raise serializers.ValidationError('Дата полива не может быть в будущем.')
        return value


class UserPlantSerializer(serializers.ModelSerializer):
    species_detail = PlantSpeciesSerializer(source='species', read_only=True)
    species_id = serializers.PrimaryKeyRelatedField(
        queryset=PlantSpecies.objects.all(), source='species', write_only=True
    )
    photo_url = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()
    next_due = serializers.SerializerMethodField()
    days_until = serializers.SerializerMethodField()
    season_hint = serializers.SerializerMethodField()
    last_watered_at = serializers.SerializerMethodField()

    class Meta:
        model = UserPlant
        fields = (
            'id',
            'name',
            'species_id',
            'species_detail',
            'photo',
            'photo_url',
            'room',
            'note',
            'added_at',
            'status',
            'next_due',
            'days_until',
            'season_hint',
            'last_watered_at',
            'created_at',
            'updated_at',
        )
        read_only_fields = ('id', 'created_at', 'updated_at', 'photo_url')

    def get_photo_url(self, obj):
        request = self.context.get('request')
        if obj.photo and request:
            return request.build_absolute_uri(obj.photo.url)
        if obj.photo:
            return obj.photo.url
        return None

    def _schedule_fields(self, obj):
        return {
            'status': watering_status(obj),
            'next_due': next_due_at(obj).isoformat(),
            'days_until': days_until_due(obj),
            'season_hint': season_hint(obj.species),
        }

    def get_status(self, obj):
        return self._schedule_fields(obj)['status']

    def get_next_due(self, obj):
        return self._schedule_fields(obj)['next_due']

    def get_days_until(self, obj):
        return self._schedule_fields(obj)['days_until']

    def get_season_hint(self, obj):
        return self._schedule_fields(obj)['season_hint']

    def get_last_watered_at(self, obj):
        last = obj.waterings.order_by('-watered_at').first()
        if last:
            return last.watered_at.isoformat()
        return obj.added_at.isoformat()

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class FeedPlantSerializer(UserPlantSerializer):
    species_name = serializers.CharField(source='species.name_ru', read_only=True)

    class Meta(UserPlantSerializer.Meta):
        fields = (
            'id',
            'name',
            'species_name',
            'photo_url',
            'status',
            'next_due',
            'days_until',
            'season_hint',
            'room',
        )
