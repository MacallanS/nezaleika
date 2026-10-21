import json
import logging

from django.conf import settings
from pywebpush import WebPushException, webpush

logger = logging.getLogger(__name__)


def send_web_push(subscription, payload: dict) -> bool:
    if not settings.VAPID_PRIVATE_KEY or not settings.VAPID_PUBLIC_KEY:
        logger.warning('VAPID keys not configured, skip push')
        return False
    sub_info = {
        'endpoint': subscription.endpoint,
        'keys': {'p256dh': subscription.p256dh, 'auth': subscription.auth},
    }
    data = json.dumps(payload)
    try:
        webpush(
            subscription_info=sub_info,
            data=data,
            vapid_private_key=settings.VAPID_PRIVATE_KEY,
            vapid_claims={'sub': settings.VAPID_CLAIMS_EMAIL},
        )
        return True
    except WebPushException as ex:
        logger.warning('Web push failed: %s', ex)
        if ex.response and ex.response.status_code in (404, 410):
            subscription.delete()
        return False
