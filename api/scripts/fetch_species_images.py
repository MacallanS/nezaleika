"""Download Wikimedia Commons thumbnails for species into web/public/species/.

Usage (from api/):
  python scripts/fetch_species_images.py [--category flowering] [--limit 0]
"""
from __future__ import annotations

import argparse
import csv
import json
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CSV_PATH = ROOT / 'plants' / 'fixtures' / 'species_large.csv'
OUT_DIR = ROOT.parent / 'web' / 'public' / 'species'
UA = 'NezaleikaBot/1.0 (plant care app; contact: nezaleika)'


def http_get(url: str, timeout: float = 25) -> bytes:
    req = urllib.request.Request(url, headers={'User-Agent': UA})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read()


def commons_search(query: str) -> str | None:
    """Return a Special:FilePath-style thumb URL or None."""
    params = urllib.parse.urlencode(
        {
            'action': 'query',
            'format': 'json',
            'generator': 'search',
            'gsrsearch': query,
            'gsrnamespace': 6,  # File
            'gsrlimit': 5,
            'prop': 'imageinfo',
            'iiprop': 'url|mime',
            'iiurlwidth': 640,
        }
    )
    url = f'https://commons.wikimedia.org/w/api.php?{params}'
    try:
        data = json.loads(http_get(url).decode('utf-8'))
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError, UnicodeDecodeError):
        return None
    pages = (data.get('query') or {}).get('pages') or {}
    for page in pages.values():
        infos = page.get('imageinfo') or []
        if not infos:
            continue
        info = infos[0]
        mime = (info.get('mime') or '').lower()
        if not mime.startswith('image/'):
            continue
        if 'svg' in mime:
            continue
        thumb = info.get('thumburl') or info.get('url')
        if thumb:
            return thumb
    return None


def save_image(url: str, dest: Path) -> bool:
    try:
        raw = http_get(url)
    except (urllib.error.URLError, TimeoutError):
        return False
    if len(raw) < 800:
        return False
    dest.parent.mkdir(parents=True, exist_ok=True)
    # Keep original bytes; browsers handle jpeg/png/webp. Prefer .webp name but store as-is.
    # Detect by magic
    suffix = '.jpg'
    if raw[:3] == b'\xff\xd8\xff':
        suffix = '.jpg'
    elif raw[:8] == b'\x89PNG\r\n\x1a\n':
        suffix = '.png'
    elif raw[:4] == b'RIFF' and raw[8:12] == b'WEBP':
        suffix = '.webp'
    out = dest.with_suffix(suffix)
    out.write_bytes(raw)
    if out != dest and dest.exists():
        dest.unlink(missing_ok=True)
    # rename to requested stem.webp/jpg path used in CSV
    final = dest.with_suffix(suffix)
    if out != final:
        out.replace(final)
    return True


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument('--category', default='flowering')
    parser.add_argument('--limit', type=int, default=0, help='0 = all matching')
    parser.add_argument('--sleep', type=float, default=0.35)
    args = parser.parse_args()

    rows = list(csv.DictReader(CSV_PATH.open(encoding='utf-8')))
    fieldnames = list(rows[0].keys()) if rows else []
    if 'image_url' not in fieldnames:
        fieldnames.append('image_url')

    targets = [r for r in rows if (args.category in ('*', 'all') or r.get('category') == args.category)]
    if args.limit > 0:
        targets = targets[: args.limit]

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    ok = fail = skip = 0
    by_slug = {r['slug']: r for r in rows}

    for r in targets:
        slug = r['slug']
        existing = (r.get('image_url') or '').strip()
        if existing:
            local = ROOT.parent / 'web' / 'public' / existing.lstrip('/')
            if local.exists():
                skip += 1
                continue
        name_lat = (r.get('name_lat') or '').strip()
        name_ru = (r.get('name_ru') or '').strip()
        queries = []
        if name_lat:
            queries.append(name_lat.split()[0] if ' ' in name_lat else name_lat)
            queries.append(name_lat)
        queries.append(name_ru)
        thumb = None
        for q in queries:
            if not q:
                continue
            thumb = commons_search(q)
            time.sleep(args.sleep)
            if thumb:
                break
        if not thumb:
            fail += 1
            print(f'FAIL {slug}')
            continue
        dest = OUT_DIR / f'{slug}.jpg'
        if not save_image(thumb, dest):
            fail += 1
            print(f'FAIL download {slug}')
            continue
        # find actual file written
        written = None
        for suf in ('.jpg', '.png', '.webp'):
            p = OUT_DIR / f'{slug}{suf}'
            if p.exists():
                written = p
                break
        if not written:
            fail += 1
            continue
        rel = f'/species/{written.name}'
        by_slug[slug]['image_url'] = rel
        ok += 1
        print(f'OK {slug} -> {rel}')

    with CSV_PATH.open('w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction='ignore')
        writer.writeheader()
        writer.writerows(sorted(by_slug.values(), key=lambda x: x['name_ru'].casefold()))

    print(f'done ok={ok} fail={fail} skip={skip} out={OUT_DIR}')


if __name__ == '__main__':
    main()
