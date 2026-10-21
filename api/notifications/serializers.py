from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from rest_framework import serializers

from notifications.models import NotificationPrefs, PushSubscription


class NotificationPrefsSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationPrefs
        fields = ('enabled', 'remind_time', 'timezone_name', 'only_urgent')

    def validate_timezone_name(self, value):
        try:
            ZoneInfo(value)
        except (ZoneInfoNotFoundError, ValueError):
            raise serializers.ValidationError('Неизвестный часовой пояс.')
        return value


class PushSubscribeSerializer(serializers.Serializer):
    endpoint = serializers.CharField()
    keys = serializers.DictField(child=serializers.CharField())

    def validate_keys(self, value):
        if 'p256dh' not in value or 'auth' not in value:
            raise serializers.ValidationError('keys must contain p256dh and auth')
        return value
