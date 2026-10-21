from django.contrib import admin

from plants.models import PlantSpecies, UserPlant, WateringEvent


@admin.register(PlantSpecies)
class PlantSpeciesAdmin(admin.ModelAdmin):
    list_display = ('name_ru', 'category', 'spring_days', 'summer_days', 'winter_days')
    list_filter = ('category',)
    search_fields = ('name_ru', 'name_lat', 'slug')
    prepopulated_fields = {'slug': ('name_ru',)}


class WateringInline(admin.TabularInline):
    model = WateringEvent
    extra = 0
    readonly_fields = ('created_at',)


@admin.register(UserPlant)
class UserPlantAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'species', 'added_at')
    list_filter = ('user', 'species__category')
    search_fields = ('name', 'user__username')
    inlines = [WateringInline]


@admin.register(WateringEvent)
class WateringEventAdmin(admin.ModelAdmin):
    list_display = ('user_plant', 'watered_at', 'note')
    list_filter = ('watered_at',)
