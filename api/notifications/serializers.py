from rest_framework import serializers

from notifications.models import NotificationPrefs, PushSubscription


class NotificationPrefsSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationPrefs
        fields = ('enabled', 'remind_time', 'timezone_name', 'only_urgent')


class PushSubscribeSerializer(serializers.Serializer):
    endpoint = serializers.CharField()
    keys = serializers.DictField(child=serializers.CharField())

    def validate_keys(self, value):
        if 'p256dh' not in value or 'auth' not in value:
            raise serializers.ValidationError('keys must contain p256dh and auth')
        return value
