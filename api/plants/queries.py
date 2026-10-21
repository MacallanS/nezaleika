"""Shared household: any logged-in user sees and manages all plants."""

from plants.models import UserPlant, WateringEvent


def household_plants_queryset():
    return UserPlant.objects.all().select_related('species').prefetch_related('waterings')


def household_waterings_queryset():
    return WateringEvent.objects.all().select_related('user_plant', 'user_plant__species')
