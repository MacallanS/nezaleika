"""Fix bad names and add more species to reach ~240."""
from __future__ import annotations

import csv
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CSV_PATH = ROOT / 'plants' / 'fixtures' / 'species_large.csv'

HINTS = {
    'tropical': 'Яркий рассеянный свет, полив когда верх почвы подсох',
    'succulent': 'Много света, редкий полив — почва должна просохнуть',
    'cactus': 'Яркое солнце, полив редко и умеренно',
    'fern': 'Тень или полутень, почва всегда слегка влажная',
    'orchid': 'Яркий рассеянный свет, полив после просыхания коры',
    'herb': 'Светлое место, регулярный умеренный полив',
    'palm': 'Светлое место без прямого палящего солнца, равномерная влажность',
    'flowering': 'Светло, полив по мере подсыхания верхнего слоя',
    'foliage': 'Рассеянный свет, полив когда верх почвы подсох',
    'other': 'Светлое место, полив по мере подсыхания почвы',
}

INTERVALS = {
    'tropical': (7, 5, 6, 10),
    'succulent': (14, 10, 14, 21),
    'cactus': (18, 12, 18, 28),
    'fern': (5, 4, 5, 7),
    'orchid': (7, 6, 8, 12),
    'herb': (5, 4, 5, 8),
    'palm': (7, 5, 7, 12),
    'flowering': (6, 5, 6, 10),
    'foliage': (7, 5, 7, 10),
    'other': (7, 5, 7, 10),
}

MORE = [
    ('граптоседум', 'Гrapтопеталум', 'Graptosedum', 'succulent'),  # placeholder fixed below
    ('сансевиерия-ханни', 'Сансевиерия Ханни', 'Sansevieria hahnii', 'succulent'),
    ('сансевиерия-цилиндрика', 'Сансевиерия цилиндрическая', 'Sansevieria cylindrica', 'succulent'),
    ('замия', 'Замия', 'Zamia', 'foliage'),
    ('замия-пумила', 'Замия карликовая', 'Zamia pumila', 'foliage'),
    ('ксантосома', 'Ксантосома', 'Xanthosoma', 'tropical'),
    ('диффенбахия-компакта', 'Диффенбахия компакта', 'Dieffenbachia Compacta', 'tropical'),
    ('диффенбахия-камилла', 'Диффенбахия Камилла', 'Dieffenbachia Camilla', 'tropical'),
    ('аглаонема-крит', 'Аглаонема Крит', 'Aglaonema Crete', 'foliage'),
    ('хлорофитум-виттатум', 'Хлорофитум зелёный', 'Chlorophytum comosum Vittatum', 'herb'),
    ('хлорофитум-океан', 'Хлорофитум Океан', 'Chlorophytum Ocean', 'herb'),
    ('спатифиллум-sweet-сhilо', 'Спатифиллум Свит Чило', 'Spathiphyllum Sweet Chico', 'flowering'),
    ('антуриум-блэк-квин', 'Антуриум Чёрная королева', 'Anthurium Black Queen', 'flowering'),
    ('антуриум-розовый', 'Антуриум розовый', 'Anthurium andreanum Pink', 'flowering'),
    ('гербера', 'Гербера комнатная', 'Gerbera jamesonii', 'flowering'),
    ('хризантема', 'Хризантема комнатная', 'Chrysanthemum', 'flowering'),
    ('примула', 'Примула', 'Primula', 'flowering'),
    ('кальцеолярия', 'Кальцеолярия', 'Calceolaria', 'flowering'),
    ('эксакум', 'Эксакум', 'Exacum affine', 'flowering'),
    ('броваллия', 'Броваллия', 'Browallia', 'flowering'),
    ('нерине', 'Нерине', 'Nerine', 'flowering'),
    ('валериана-красная', 'Центрания / валериана красная', 'Centranthus', 'flowering'),
    ('селягинелла', 'Селагинелла', 'Selaginella', 'fern'),
    ('микросорум', 'Микросорум', 'Microsorum diversifolium', 'fern'),
    ('флебодиум', 'Флебодиум', 'Phlebodium aureum', 'fern'),
    ('диксония', 'Диксония', 'Dicksonia', 'fern'),
    ('цикас', 'Цикас', 'Cycas revoluta', 'palm'),
    ('замия-фурката', 'Кардинал пальма (замия)', 'Zamia furfuracea', 'palm'),
    ('юкка-слоновая', 'Юкка слоновая', 'Yucca elephantipes', 'foliage'),
    ('нолина', 'Нолина / бокарнея', 'Beaucarnea recurvata', 'succulent'),
    ('пахира', 'Пахира', 'Pachira aquatica', 'tropical'),
    ('радидермахера', 'Радермахера', 'Radermachera sinica', 'foliage'),
    ('клеродендрум', 'Клеродендрум', 'Clerodendrum thomsoniae', 'flowering'),
    ('мандевилла', 'Мандевилла', 'Mandevilla', 'flowering'),
    ('пассифлора', 'Пассифлора', 'Passiflora', 'flowering'),
    ('бугенвиллея', 'Бугенвиллея', 'Bougainvillea', 'flowering'),
    ('олеандр', 'Олеандр', 'Nerium oleander', 'flowering'),
    ('аукуба', 'Аукуба', 'Aucuba japonica', 'foliage'),
    ('эвонимус', 'Бересклет японский', 'Euonymus japonicus', 'foliage'),
    ('фатсия', 'Фатсия', 'Fatsia japonica', 'foliage'),
    ('фатсхедера', 'Фатсхедера', '× Fatshedera lizei', 'foliage'),
    ('гептаплеурум', 'Гептаплеурум', 'Heptapleurum arboricola', 'foliage'),
    ('полисциас', 'Полисциас', 'Polyscias', 'foliage'),
    ('крутон', 'Кодиеум / кротон', 'Codiaeum variegatum', 'foliage'),
    ('акалифа', 'Акалифа', 'Acalypha', 'foliage'),
    ('ятрофа', 'Ятрофа', 'Jatropha podagrica', 'succulent'),
    ('молочай-треугольный', 'Молочай треугольный', 'Euphorbia trigona', 'succulent'),
    ('молочай-мили', 'Молочай Миля', 'Euphorbia milii', 'succulent'),
]


def main() -> None:
    rows = list(csv.DictReader(CSV_PATH.open(encoding='utf-8')))
    by_slug = {r['slug']: r for r in rows}

    for r in list(by_slug.values()):
        lat = r.get('name_lat') or ''
        if 'Graptopetalum' in lat or r['slug'] == 'граптопеталум':
            r['name_ru'] = 'Граптопеталум'
            r['name_lat'] = 'Graptopetalum'
            r['slug'] = 'граптопеталум'

    by_slug = {r['slug']: r for r in by_slug.values()}

    added = 0
    for slug, name_ru, name_lat, category in MORE:
        if slug == 'граптоседум':
            name_ru = 'Граптоседум'
        if 'sweet' in slug:
            slug = 'спатифиллум-свит-чико'
            name_ru = 'Спатифиллум Свит Чико'
            name_lat = 'Spathiphyllum Sweet Chico'
            category = 'flowering'
        if slug in by_slug:
            continue
        spring, summer, autumn, winter = INTERVALS[category]
        by_slug[slug] = {
            'slug': slug,
            'name_ru': name_ru,
            'name_lat': name_lat,
            'category': category,
            'spring': str(spring),
            'summer': str(summer),
            'autumn': str(autumn),
            'winter': str(winter),
            'care_hint': HINTS[category],
        }
        added += 1

    for r in by_slug.values():
        if not (r.get('care_hint') or '').strip():
            r['care_hint'] = HINTS.get(r.get('category') or 'other', HINTS['other'])

    out = sorted(by_slug.values(), key=lambda r: r['name_ru'].casefold())
    out = [r for r in out if 'сhil' not in r['slug'] and 'макulata' not in r['slug']]

    fieldnames = ['slug', 'name_ru', 'name_lat', 'category', 'spring', 'summer', 'autumn', 'winter', 'care_hint']
    with CSV_PATH.open('w', encoding='utf-8', newline='') as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        w.writerows(out)

    cats = Counter(r['category'] for r in out)
    empty = sum(1 for r in out if not r['care_hint'].strip())
    print(f'total={len(out)} added={added} empty_hints={empty}')
    print(dict(sorted(cats.items())))
    # verify graptopetalum
    g = [r for r in out if 'грапто' in r['slug']]
    for r in g:
        print('FIXCHECK', r['slug'], r['name_ru'], r['name_lat'])


if __name__ == '__main__':
    main()
