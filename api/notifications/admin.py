from django.contrib import admin

from notifications.models import NotificationPrefs, PlantSnooze, PushSubscription


@admin.register(NotificationPrefs)
class NotificationPrefsAdmin(admin.ModelAdmin):
    list_display = ('user', 'enabled', 'remind_time', 'timezone_name', 'last_sent_on')


@admin.register(PushSubscription)
class PushSubscriptionAdmin(admin.ModelAdmin):
    list_display = ('user', 'endpoint', 'created_at')
    search_fields = ('user__username', 'endpoint')


@admin.register(PlantSnooze)
class PlantSnoozeAdmin(admin.ModelAdmin):
    list_display = ('user', 'plant', 'until', 'created_at')
    list_filter = ('until',)
