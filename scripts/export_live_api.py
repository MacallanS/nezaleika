"""Download household plants, photos, and waterings from the live API.

Password is read from NEZALEIKA_USER_PASSWORD. The dump is written locally
and is meant to stay out of git (it contains household photos).
"""

from __future__ import annotations

import base64
import json
import os
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

BASE = os.environ.get('NEZALEIKA_API', 'https://nezaleika-api.onrender.com').rstrip('/')
PASSWORD = os.environ.get('NEZALEIKA_USER_PASSWORD', '')
USERNAMES = [name for name in os.environ.get('NEZALEIKA_EXPORT_USERS', 'Yana,Артём').split(',') if name]
OUT = Path(os.environ.get('NEZALEIKA_EXPORT_PATH', 'exports/household-live.json'))


def request(method: str, path: str, token: str | None = None, body: dict | None = None, absolute: str | None = None):
    url = absolute or f'{BASE}{path}'
    data = None if body is None else json.dumps(body).encode('utf-8')
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header('Accept', 'application/json')
    if body is not None:
        req.add_header('Content-Type', 'application/json')
    if token:
        req.add_header('Authorization', f'Token {token}')
    with urllib.request.urlopen(req, timeout=180) as resp:
        raw = resp.read()
        ctype = resp.headers.get('Content-Type', '')
        return ctype, raw


def login(username: str) -> str | None:
    try:
        _, raw = request('POST', '/api/auth/login', body={'username': username, 'password': PASSWORD})
    except urllib.error.HTTPError as exc:
        print(f'login failed for {username}: HTTP {exc.code}', file=sys.stderr)
        return None
    return json.loads(raw.decode('utf-8'))['token']


def get_json(path: str, token: str):
    _, raw = request('GET', path, token=token)
    return json.loads(raw.decode('utf-8'))


def data_url_from(url: str) -> str:
    ctype, raw = request('GET', '', absolute=url)
    mime = ctype.split(';', 1)[0].strip() or 'image/jpeg'
    if not mime.startswith('image/'):
        mime = 'image/jpeg'
    return f'data:{mime};base64,' + base64.b64encode(raw).decode('ascii')


def list_plants(token: str) -> list[dict]:
    path = '/api/plants/'
    plants: list[dict] = []
    while path:
        page = get_json(path, token)
        if isinstance(page, list):
            return page
        plants.extend(page.get('results', []))
        next_url = page.get('next')
        if not next_url:
            break
        path = next_url.removeprefix(BASE) if next_url.startswith(BASE) else next_url
    return plants


def main() -> int:
    if not PASSWORD:
        print('Set NEZALEIKA_USER_PASSWORD', file=sys.stderr)
        return 1
    sessions: list[tuple[str, str]] = []
    for username in USERNAMES:
        token = login(username)
        if token:
            sessions.append((username, token))
    if not sessions:
        print('No account logged in. Export stopped.', file=sys.stderr)
        return 2

    token = sessions[0][1]
    plants = list_plants(token)
    exported_plants = []
    photo_count = 0
    watering_count = 0
    for plant in plants:
        photo_data = ''
        if plant.get('photo_url'):
            photo_data = data_url_from(plant['photo_url'])
            photo_count += 1
        waterings = get_json(f"/api/plants/{plant['id']}/waterings/", token)
        watering_count += len(waterings)
        species = plant.get('species_detail') or {}
        exported_plants.append(
            {
                'source_id': plant['id'],
                'name': plant.get('name') or '',
                'room': plant.get('room') or '',
                'note': plant.get('note') or '',
                'added_at': plant.get('added_at'),
                'species': {
                    'slug': species.get('slug') or '',
                    'name_ru': species.get('name_ru') or '',
                    'name_lat': species.get('name_lat') or '',
                    'category': species.get('category') or 'other',
                    'spring_days': species.get('spring_days'),
                    'summer_days': species.get('summer_days'),
                    'autumn_days': species.get('autumn_days'),
                    'winter_days': species.get('winter_days'),
                    'care_hint': species.get('care_hint') or '',
                    'image_url': species.get('image_url') or '',
                },
                'photo_data': photo_data,
                'waterings': [
                    {
                        'watered_at': item.get('watered_at'),
                        'note': item.get('note') or '',
                        'watered_by_name': item.get('watered_by_name') or '',
                    }
                    for item in waterings
                ],
            }
        )

    users = []
    for username, user_token in sessions:
        me = get_json('/api/me', user_token)
        prefs = get_json('/api/me/notification-prefs', user_token)
        avatar_data = ''
        if me.get('avatar_url'):
            avatar_data = data_url_from(me['avatar_url'])
            photo_count += 1
        users.append(
            {
                'username': me.get('username') or username,
                'first_name': me.get('first_name') or '',
                'avatar_data': avatar_data,
                'notification_prefs': {
                    'enabled': prefs.get('enabled', True),
                    'remind_time': prefs.get('remind_time') or '09:00:00',
                    'timezone_name': prefs.get('timezone_name') or 'Europe/Moscow',
                    'only_urgent': prefs.get('only_urgent', True),
                    'season_alerts': prefs.get('season_alerts', True),
                },
            }
        )

    payload = {
        'exported_at': datetime.now(timezone.utc).isoformat(),
        'source': BASE,
        'users': users,
        'plants': exported_plants,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, ensure_ascii=False), encoding='utf-8')
    print(
        f'wrote {OUT} users={len(users)} plants={len(exported_plants)} '
        f'photos={photo_count} waterings={watering_count} bytes={OUT.stat().st_size}'
    )
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
