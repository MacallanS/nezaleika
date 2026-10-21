"""Shared household: any logged-in user sees and manages all plants."""

from django.db.models import Prefetch

from plants.models import UserPlant, WateringEvent


def household_plants_queryset():
    return (
        UserPlant.objects.all()
        .select_related('species')
        .prefetch_related(
            Prefetch('waterings', queryset=WateringEvent.objects.select_related('watered_by'))
        )
    )


def household_waterings_queryset():
    return WateringEvent.objects.all().select_related('user_plant', 'user_plant__species', 'watered_by')
