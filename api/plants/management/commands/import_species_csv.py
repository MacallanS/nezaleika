import csv
from pathlib import Path

from django.core.management.base import BaseCommand
from django.utils.text import slugify

from plants.models import PlantSpecies

DEFAULT_CSV = Path(__file__).resolve().parent.parent.parent / 'fixtures' / 'species_large.csv'


class Command(BaseCommand):
    help = 'Import plant species from CSV (slug,name_ru,name_lat,category,spring,summer,autumn,winter,care_hint)'

    def add_arguments(self, parser):
        parser.add_argument('--file', type=str, default=str(DEFAULT_CSV))

    def handle(self, *args, **options):
        path = Path(options['file'])
        if not path.exists():
            self.stderr.write(f'File not found: {path}')
            return
        created = updated = 0
        with path.open(encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                slug = row.get('slug') or slugify(row['name_ru'], allow_unicode=True)
                defaults = {
                    'name_ru': row['name_ru'].strip(),
                    'name_lat': row.get('name_lat', '').strip(),
                    'category': row.get('category', 'other').strip(),
                    'spring_days': int(row['spring']),
                    'summer_days': int(row['summer']),
                    'winter_days': int(row['winter']),
                    'care_hint': row.get('care_hint', '').strip(),
                }
                autumn = row.get('autumn', '').strip()
                defaults['autumn_days'] = int(autumn) if autumn else None
                obj, was_created = PlantSpecies.objects.update_or_create(slug=slug, defaults=defaults)
                if was_created:
                    created += 1
                else:
                    updated += 1
        self.stdout.write(self.style.SUCCESS(f'Done: created={created}, updated={updated}'))
