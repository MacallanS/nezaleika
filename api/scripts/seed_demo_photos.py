"""Seed real plant photos from Wikimedia Commons for local demo plants."""
from __future__ import annotations

import json
import os
import sys
import time
import urllib.request
from io import BytesIO
from pathlib import Path
from urllib.parse import urlencode

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

import django

django.setup()

from plants.models import UserPlant
from plants.services.photos import photo_to_data_url

UA = {'User-Agent': 'NezaleikaDemo/1.0 (local watering planner; educational)'}

# plant_id -> Commons search query
QUERIES = {
    1: 'Monstera deliciosa houseplant',
    2: 'Ficus benjamina weeping fig',
    3: 'Zamioculcas zamiifolia',
    4: 'Phalaenopsis white orchid',
    5: 'Spathiphyllum peace lily',
    6: 'Aloe vera houseplant',
}


class Upload:
    def __init__(self, data: bytes, name: str = 'plant.jpg') -> None:
        self.file = BytesIO(data)
        self.name = name

    def read(self, *args, **kwargs):
        return self.file.read(*args, **kwargs)

    def seek(self, *args, **kwargs):
        return self.file.seek(*args, **kwargs)


def commons_thumb(query: str) -> str:
    params = urlencode(
        {
            'action': 'query',
            'format': 'json',
            'generator': 'search',
            'gsrsearch': query,
            'gsrnamespace': '6',
            'gsrlimit': '5',
            'prop': 'imageinfo',
            'iiprop': 'url|mime',
            'iiurlwidth': '800',
        }
    )
    req = urllib.request.Request(f'https://commons.wikimedia.org/w/api.php?{params}', headers=UA)
    with urllib.request.urlopen(req, timeout=45) as response:
        data = json.load(response)
    pages = list(data.get('query', {}).get('pages', {}).values())
    for page in pages:
        info = (page.get('imageinfo') or [{}])[0]
        mime = info.get('mime') or ''
        url = info.get('thumburl') or info.get('url')
        if url and mime.startswith('image/') and 'svg' not in mime:
            return url.split('?', 1)[0]
    raise RuntimeError(f'no image for {query!r}')


def download(url: str) -> bytes:
    req = urllib.request.Request(url, headers={**UA, 'Accept': 'image/*'})
    with urllib.request.urlopen(req, timeout=60) as response:
        return response.read()


def main() -> None:
    ok = 0
    for pid, query in QUERIES.items():
        plant = UserPlant.objects.filter(pk=pid).first()
        if not plant:
            print('skip', pid)
            continue
        try:
            time.sleep(1.5)
            thumb = commons_thumb(query)
            time.sleep(0.8)
            raw = download(thumb)
            plant.photo_data = photo_to_data_url(Upload(raw))
            plant.save(update_fields=['photo_data', 'updated_at'])
            ok += 1
            print('ok', pid, plant.name, thumb[:80], len(raw))
        except Exception as exc:  # noqa: BLE001
            print('fail', pid, getattr(plant, 'name', '?'), exc)
    print('done', ok)


if __name__ == '__main__':
    main()
