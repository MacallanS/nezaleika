"""Rebuild species_large.csv: fill care_hint + add common houseplants."""
from __future__ import annotations

import csv
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

# Default seasonal intervals by category (spring, summer, autumn, winter)
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

# Extra species to append (slug, name_ru, name_lat, category)
EXTRA = [
    # orchids
    ('фаленопсис-розовый', 'Фаленопсис розовый', 'Phalaenopsis hybrid', 'orchid'),
    ('фаленопсис-мини', 'Фаленопсис мини', 'Phalaenopsis mini', 'orchid'),
    ('дендробиум', 'Дендробиум', 'Dendrobium nobile', 'orchid'),
    ('камбрия', 'Камбрия', 'Vuylstekeara Cambria', 'orchid'),
    ('каттлея', 'Каттлея', 'Cattleya', 'orchid'),
    ('онцидиум', 'Онцидиум', 'Oncidium', 'orchid'),
    ('цимбидиум', 'Цимбидиум', 'Cymbidium', 'orchid'),
    ('пафиопедилум', 'Пафиопедилум', 'Paphiopedilum', 'orchid'),
    ('мильтония', 'Мильтония', 'Miltonia', 'orchid'),
    ('ванда', 'Ванда', 'Vanda', 'orchid'),
    ('лудизия', 'Лудизия', 'Ludisia discolor', 'orchid'),
    # ferns
    ('нефролепис', 'Нефролепис', 'Nephrolepis exaltata', 'fern'),
    ('адиантум', 'Адиантум', 'Adiantum raddianum', 'fern'),
    ('птерис', 'Птерис', 'Pteris cretica', 'fern'),
    ('платицериум', 'Платицериум', 'Platycerium bifurcatum', 'fern'),
    ('асплениум', 'Асплениум', 'Asplenium nidus', 'fern'),
    ('блехнум', 'Блехнум', 'Blechnum gibbum', 'fern'),
    ('давллия', 'Даваллия', 'Davallia fejeensis', 'fern'),
    ('пеллея', 'Пеллея', 'Pellaea rotundifolia', 'fern'),
    ('цитомиум', 'Цитомиум', 'Cyrtomium falcatum', 'fern'),
    # palms
    ('хамедорея', 'Хамедорея', 'Chamaedorea elegans', 'palm'),
    ('арека', 'Арека', 'Dypsis lutescens', 'palm'),
    ('кариота', 'Кариота', 'Caryota mitis', 'palm'),
    ('ховея', 'Ховея', 'Howea forsteriana', 'palm'),
    ('финик-робелена', 'Финик Робелена', 'Phoenix roebelenii', 'palm'),
    ('трахикарпус', 'Трахикарпус', 'Trachycarpus fortunei', 'palm'),
    ('ливистона', 'Ливистона', 'Livistona chinensis', 'palm'),
    ('рапис', 'Рапис', 'Rhapis excelsa', 'palm'),
    ('хамеропс', 'Хамеропс', 'Chamaerops humilis', 'palm'),
    # tropical / foliage gaps
    ('сингониум', 'Сингониум', 'Syngonium podophyllum', 'tropical'),
    ('аглаонема', 'Аглаонема', 'Aglaonema', 'foliage'),
    ('аглаонема-серебристая', 'Аглаонема серебристая', 'Aglaonema Silver Bay', 'foliage'),
    ('калатея-медальон', 'Калатея медальон', 'Calathea roseopicta', 'foliage'),
    ('калатея-орната', 'Калатея орната', 'Calathea ornata', 'foliage'),
    ('калатея-зебрина', 'Калатея зебрина', 'Calathea zebrina', 'foliage'),
    ('маранта', 'Маранта', 'Maranta leuconeura', 'foliage'),
    ('ктениета', 'Ктениета', 'Ctenanthe', 'foliage'),
    ('стройманта', 'Стройманта', 'Stromanthe sanguinea', 'foliage'),
    ('хойя-карноза', 'Хойя карноза', 'Hoya carnosa', 'tropical'),
    ('хойя-керри', 'Хойя керри', 'Hoya kerrii', 'tropical'),
    ('традесканция', 'Традесканция', 'Tradescantia zebrina', 'herb'),
    ('традесканция-нанук', 'Традесканция Нанук', 'Tradescantia Nanouk', 'herb'),
    ('пеперомия-арбузная', 'Пеперомия арбузная', 'Peperomia argyreia', 'foliage'),
    ('пеперомия-туполистная', 'Пеперомия туполистная', 'Peperomia obtusifolia', 'foliage'),
    ('пеперомия-ряболистная', 'Пеперомия ряболистная', 'Peperomia caperata', 'foliage'),
    ('филодендрон-бразил', 'Филодендрон Бразил', 'Philodendron Brasil', 'tropical'),
    ('филодендрон-биркин', 'Филодендрон Биркин', 'Philodendron Birkin', 'tropical'),
    ('филодендрон-селлоум', 'Филодендрон Селлоум', 'Philodendron bipinnatifidum', 'tropical'),
    ('эпипремнум-неон', 'Эпипремнум Неон', 'Epipremnum aureum Neon', 'tropical'),
    ('эпипремнум-нжой', 'Эпипремнум N’Joy', 'Epipremnum aureum NJoy', 'tropical'),
    ('монстера-адсонсон', 'Монстера Адсонсон', 'Monstera adansonii', 'tropical'),
    ('монстера-тай-констеллейшн', 'Монстера Thai Constellation', 'Monstera Thai Constellation', 'tropical'),
    ('алоказия-амазонская', 'Алоказия амазонская', 'Alocasia amazonica', 'tropical'),
    ('алоказия-зебрина', 'Алоказия зебрина', 'Alocasia zebrina', 'tropical'),
    ('алоказия-фридрих-халь', 'Алоказия Фридрих Халь', 'Alocasia frydek', 'tropical'),
    ('колоказия', 'Колоказия', 'Colocasia esculenta', 'tropical'),
    ('калла', 'Калла', 'Zantedeschia aethiopica', 'flowering'),
    ('антуриум-кристаллинум', 'Антуриум кристаллинум', 'Anthurium crystallinum', 'foliage'),
    ('спатифиллум-сенсация', 'Спатифиллум Сенсация', 'Spathiphyllum Sensation', 'flowering'),
    ('гибискус', 'Гибискус', 'Hibiscus rosa-sinensis', 'flowering'),
    ('азалия', 'Азалия', 'Rhododendron simsii', 'flowering'),
    ('гардения', 'Гардения', 'Gardenia jasminoides', 'flowering'),
    ('стефанотис', 'Стефанотис', 'Stephanotis floribunda', 'flowering'),
    ('кливия', 'Кливия', 'Clivia miniata', 'flowering'),
    ('гиппеаструм', 'Гиппеаструм', 'Hippeastrum', 'flowering'),
    ('амариллис', 'Амариллис', 'Amaryllis', 'flowering'),
    ('зефирантес', 'Зефирантес', 'Zephyranthes', 'flowering'),
    ('эухарис', 'Эухарис', 'Eucharis amazonica', 'flowering'),
    ('цикламен', 'Цикламен', 'Cyclamen persicum', 'flowering'),
    ('сенполия-мини', 'Сенполия мини', 'Saintpaulia mini', 'flowering'),
    ('глоксиния', 'Глоксиния', 'Sinningia speciosa', 'flowering'),
    ('стрептокарпус', 'Стрептокарпус', 'Streptocarpus', 'flowering'),
    ('ахименес', 'Ахименес', 'Achimenes', 'flowering'),
    ('колокольчик-равнина', 'Колокольчик', 'Campanula isophylla', 'flowering'),
    ('жасмин', 'Жасмин комнатный', 'Jasminum polyanthum', 'flowering'),
    ('миртовые-мирт', 'Мирт', 'Myrtus communis', 'foliage'),
    ('лавр', 'Лавр благородный', 'Laurus nobilis', 'herb'),
    ('розмарин', 'Розмарин', 'Rosmarinus officinalis', 'herb'),
    ('тимьян', 'Тимьян', 'Thymus vulgaris', 'herb'),
    ('мята', 'Мята', 'Mentha', 'herb'),
    ('базилик', 'Базилик', 'Ocimum basilicum', 'herb'),
    ('петрушка', 'Петрушка', 'Petroselinum crispum', 'herb'),
    ('укроп', 'Укроп', 'Anethum graveolens', 'herb'),
    ('мелисса', 'Мелисса', 'Melissa officinalis', 'herb'),
    ('шалфей', 'Шалфей', 'Salvia officinalis', 'herb'),
    ('эстрагон', 'Эстрагон', 'Artemisia dracunculus', 'herb'),
    # succulents / cactus
    ('эхеверия', 'Эхеверия', 'Echeveria', 'succulent'),
    ('хавортия', 'Хавортия', 'Haworthia', 'succulent'),
    ('гастерия', 'Гастерия', 'Gasteria', 'succulent'),
    ('седум-буррито', 'Седум Буррито', 'Sedum burrito', 'succulent'),
    ('седум-моргана', 'Седум Моргана', 'Sedum morganianum', 'succulent'),
    ('каланхоэ-блоссфельда', 'Каланхоэ Блоссфельда', 'Kalanchoe blossfeldiana', 'succulent'),
    ('каланхоэ-дегремона', 'Каланхоэ Дегремона', 'Kalanchoe daigremontiana', 'succulent'),
    ('толстянка-овата', 'Толстянка овата', 'Crassula ovata', 'succulent'),
    ('эониум', 'Эониум', 'Aeonium', 'succulent'),
    ('пахифитум', 'Пахифитум', 'Pachyphytum', 'succulent'),
    ('граптопеталум', 'Гrapтопеталум', 'Graptopetalum', 'succulent'),
    ('литопс', 'Литопс', 'Lithops', 'succulent'),
    ('алоэ-арборесценс', 'Алоэ древовидное', 'Aloe arborescens', 'succulent'),
    ('гастерие-алоэ-гибрид', 'Гастериеалоэ', 'Gasteraloe', 'succulent'),
    ('опунция', 'Опунция', 'Opuntia', 'cactus'),
    ('маммиллярия', 'Маммиллярия', 'Mammillaria', 'cactus'),
    ('ребуция', 'Ребуция', 'Rebutia', 'cactus'),
    ('гимнокалициум', 'Гимнокалициум', 'Gymnocalycium', 'cactus'),
    ('эхинопсис', 'Эхинопсис', 'Echinopsis', 'cactus'),
    ('шлюмбергера', 'Шлюмбергера', 'Schlumbergera', 'cactus'),
    ('хатиора', 'Хатиора', 'Hatiora', 'cactus'),
    ('рипсалис', 'Рипсалис', 'Rhipsalis', 'cactus'),
    ('эпифиллум', 'Эпифиллум', 'Epiphyllum', 'cactus'),
    ('астрофитум', 'Астрофитум', 'Astrophytum', 'cactus'),
    # more foliage / other
    ('филлокактус', 'Филлокактус', 'Disocactus', 'cactus'),
    ('бегония-макулата', 'Бегония Макулата', 'Begonia maculata', 'foliage'),
    ('бегония-рекс', 'Бегония Рекс', 'Begonia rex', 'foliage'),
    ('бегония-элатиор', 'Бегония Элатиор', 'Begonia Elatior', 'flowering'),
    ('фикус-микрокарпа', 'Фикус микрокарпа', 'Ficus microcarpa', 'tropical'),
    ('фикус-али', 'Фикус Али', 'Ficus binnendijkii Alii', 'tropical'),
    ('драцена-маргината', 'Драцена маргината', 'Dracaena marginata', 'foliage'),
    ('драцена-фрагранс', 'Драцена душистая', 'Dracaena fragrans', 'foliage'),
    ('драцена-сандериана', 'Драцена Сандера', 'Dracaena sanderiana', 'foliage'),
    ('юкка', 'Юкка', 'Yucca elephantipes', 'foliage'),
    ('кордилина', 'Кордилина', 'Cordyline fruticosa', 'foliage'),
    ('шеффлера', 'Шеффлера', 'Schefflera arboricola', 'foliage'),
    ('потос-сатиновый', 'Потос сатиновый', 'Scindapsus pictus', 'tropical'),
    ('сциндапсус-треби', 'Сциндапсус Треби', 'Scindapsus treubii', 'tropical'),
    ('зебрина', 'Зебрина', 'Tradescantia zebrina', 'herb'),
    ('каллизия', 'Каллизия', 'Callisia repens', 'herb'),
    ('пилея-пеперомиевидная', 'Пилея пеперомиевидная', 'Pilea peperomioides', 'foliage'),
    ('пилея-кадье', 'Пилея Кадье', 'Pilea cadierei', 'foliage'),
    ('фиттония', 'Фиттония', 'Fittonia albivenis', 'foliage'),
    ('гипоэстес', 'Гипоэстес', 'Hypoestes phyllostachya', 'foliage'),
    ('колеус', 'Колеус', 'Plectranthus scutellarioides', 'foliage'),
    ('пеларгония', 'Пеларгония', 'Pelargonium', 'flowering'),
    ('фуксия', 'Фуксия', 'Fuchsia', 'flowering'),
    ('бальзамин', 'Бальзамин', 'Impatiens walleriana', 'flowering'),
    ('каланхоэ-цветущее', 'Каланхоэ цветущее', 'Kalanchoe blossfeldiana', 'flowering'),
]


def row_from(slug: str, name_ru: str, name_lat: str, category: str, intervals=None, hint=None) -> dict:
    spring, summer, autumn, winter = intervals or INTERVALS.get(category, INTERVALS['other'])
    return {
        'slug': slug,
        'name_ru': name_ru,
        'name_lat': name_lat,
        'category': category,
        'spring': str(spring),
        'summer': str(summer),
        'autumn': str(autumn),
        'winter': str(winter),
        'care_hint': hint or HINTS.get(category, HINTS['other']),
    }


def main() -> None:
    existing = list(csv.DictReader(CSV_PATH.open(encoding='utf-8')))
    by_slug: dict[str, dict] = {}
    for r in existing:
        cat = (r.get('category') or 'other').strip() or 'other'
        hint = (r.get('care_hint') or '').strip() or HINTS.get(cat, HINTS['other'])
        by_slug[r['slug']] = {
            'slug': r['slug'],
            'name_ru': r['name_ru'].strip(),
            'name_lat': (r.get('name_lat') or '').strip(),
            'category': cat,
            'spring': r['spring'],
            'summer': r['summer'],
            'autumn': r.get('autumn') or r['spring'],
            'winter': r['winter'],
            'care_hint': hint,
        }

    added = 0
    for slug, name_ru, name_lat, category in EXTRA:
        if slug in by_slug:
            # still refresh empty hint
            if not by_slug[slug].get('care_hint'):
                by_slug[slug]['care_hint'] = HINTS.get(category, HINTS['other'])
            continue
        by_slug[slug] = row_from(slug, name_ru, name_lat, category)
        added += 1

    rows = sorted(by_slug.values(), key=lambda r: r['name_ru'].casefold())
    fieldnames = ['slug', 'name_ru', 'name_lat', 'category', 'spring', 'summer', 'autumn', 'winter', 'care_hint']
    with CSV_PATH.open('w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    from collections import Counter

    cats = Counter(r['category'] for r in rows)
    empty = sum(1 for r in rows if not r['care_hint'].strip())
    print(f'total={len(rows)} added={added} empty_hints={empty}')
    print(dict(sorted(cats.items())))


if __name__ == '__main__':
    main()
