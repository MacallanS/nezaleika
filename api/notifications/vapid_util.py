"""Backward-compatible re-exports."""

from config.vapid_env import (  # noqa: F401
    normalize_vapid_private_key,
    normalize_vapid_public_key,
    strip_env_quotes,
    vapid_private_key_loads,
)
