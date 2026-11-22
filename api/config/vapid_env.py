"""Normalize Web Push VAPID keys from environment (no Django app imports)."""

from __future__ import annotations


def strip_env_quotes(raw: str) -> str:
    value = (raw or '').strip()
    if len(value) >= 2 and value[0] == value[-1] and value[0] in ('"', "'"):
        value = value[1:-1].strip()
    return value


def normalize_vapid_private_key(raw: str) -> str:
    value = strip_env_quotes(raw)
    if not value:
        return ''
    value = value.replace('\\r\\n', '\n').replace('\\n', '\n').replace('\\r', '\n')
    value = value.replace('\r\n', '\n').replace('\r', '\n')
    return value.strip()


def normalize_vapid_public_key(raw: str) -> str:
    value = strip_env_quotes(raw)
    value = value.replace('\\n', '').replace('\\r', '')
    return value.replace('\n', '').replace('\r', '').strip()


def vapid_private_key_loads(pem: str) -> bool:
    if not pem or 'BEGIN' not in pem:
        return False
    try:
        from cryptography.hazmat.primitives import serialization

        serialization.load_pem_private_key(pem.encode('utf-8'), password=None)
        return True
    except Exception:
        return False
