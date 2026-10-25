import json
import logging

from django.conf import settings
from pywebpush import WebPushException, webpush

logger = logging.getLogger(__name__)


def push_configured() -> bool:
    return bool(settings.VAPID_PRIVATE_KEY and settings.VAPID_PUBLIC_KEY)


def vapid_claims() -> dict:
    raw = (settings.VAPID_CLAIMS_EMAIL or '').strip()
    if not raw:
        raw = 'mailto:admin@nezaleika.local'
    elif not raw.startswith(('mailto:', 'https://')):
        raw = f'mailto:{raw}'
    return {'sub': raw}


def send_web_push(subscription, payload: dict) -> bool:
    if not push_configured():
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
            vapid_claims=vapid_claims(),
        )
        return True
    except WebPushException as ex:
        status = ex.status_code
        logger.warning('Web push failed status=%s: %s', status, ex)
        if status in (404, 410):
            subscription.delete()
        return False
    except Exception:
        logger.exception('Web push unexpected failure')
        return False
