import json
import logging
from dataclasses import dataclass

from django.conf import settings
from pywebpush import WebPushException, webpush

from config.vapid_env import vapid_private_key_loads

logger = logging.getLogger(__name__)


@dataclass
class PushSendResult:
    ok: bool
    status: int | None = None
    error: str = ''

    def __bool__(self) -> bool:
        return self.ok


def push_configured() -> bool:
    return bool(
        settings.VAPID_PUBLIC_KEY
        and settings.VAPID_PRIVATE_KEY
        and vapid_private_key_loads(settings.VAPID_PRIVATE_KEY)
    )


def vapid_claims() -> dict:
    raw = (settings.VAPID_CLAIMS_EMAIL or '').strip()
    if not raw:
        raw = 'mailto:admin@nezaleika.local'
    elif not raw.startswith(('mailto:', 'https://')):
        raw = f'mailto:{raw}'
    return {'sub': raw}


def send_web_push(subscription, payload: dict) -> PushSendResult:
    if not settings.VAPID_PRIVATE_KEY or not settings.VAPID_PUBLIC_KEY:
        logger.warning('VAPID keys not configured, skip push')
        return PushSendResult(ok=False, error='vapid_missing')
    if not vapid_private_key_loads(settings.VAPID_PRIVATE_KEY):
        logger.warning('VAPID private key is present but invalid PEM')
        return PushSendResult(ok=False, error='vapid_invalid')

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
        return PushSendResult(ok=True)
    except WebPushException as ex:
        status_code = ex.status_code
        body = ''
        try:
            resp = getattr(ex, 'response', None)
            body = (getattr(resp, 'text', None) or '')[:500]
        except Exception:
            body = ''
        logger.warning('Web push failed status=%s body=%s: %s', status_code, body, ex)
        if status_code in (404, 410):
            try:
                subscription.delete()
            except Exception:
                logger.exception('failed to delete dead push subscription')
            return PushSendResult(ok=False, status=status_code, error='subscription_gone')
        if status_code in (401, 403):
            return PushSendResult(ok=False, status=status_code, error='vapid_rejected')
        return PushSendResult(ok=False, status=status_code, error='delivery_failed')
    except Exception as ex:
        logger.exception('Web push unexpected failure')
        return PushSendResult(ok=False, error=f'unexpected:{type(ex).__name__}')
