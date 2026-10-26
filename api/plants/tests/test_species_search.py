from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from plants.models import PlantCategory, PlantSpecies
from plants.services.species_search import filter_species, normalize, score_species


class SpeciesSearchUnitTests(TestCase):
    def test_normalize_yo(self):
        self.assertEqual(normalize('Ёлка'), 'елка')

    def test_substring_and_typo(self):
        PlantSpecies.objects.create(
            slug='monstera',
            name_ru='Монстера',
            name_lat='Monstera deliciosa',
            category=PlantCategory.TROPICAL,
            spring_days=7,
            summer_days=5,
            winter_days=10,
        )
        PlantSpecies.objects.create(
            slug='fikus',
            name_ru='Фикус Бенджамина',
            name_lat='Ficus benjamina',
            category=PlantCategory.TROPICAL,
            spring_days=7,
            summer_days=5,
            winter_days=10,
        )
        all_sp = list(PlantSpecies.objects.all())
        self.assertTrue(score_species('Монстера', 'Monstera', 'монст') is not None)
        self.assertTrue(score_species('Монстера', 'Monstera', 'монстрра') is not None)  # typo
        names = [s.name_ru for s in filter_species(all_sp, 'фикус')]
        self.assertIn('Фикус Бенджамина', names)


class SpeciesSearchApiTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user('searcher', password='x')
        self.client = APIClient()
        self.client.force_authenticate(self.user)
        PlantSpecies.objects.create(
            slug='senpolia',
            name_ru='Сенполия',
            name_lat='Saintpaulia',
            category=PlantCategory.FLOWERING,
            spring_days=6,
            summer_days=5,
            winter_days=10,
            image_url='/species/senpolia.jpg',
        )

    def test_api_fuzzy_and_image(self):
        res = self.client.get('/api/species', {'q': 'сенполи'})
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertTrue(any(x['name_ru'] == 'Сенполия' for x in data))
        row = next(x for x in data if x['name_ru'] == 'Сенполия')
        self.assertEqual(row.get('image_url'), '/species/senpolia.jpg')

    def test_api_typo(self):
        res = self.client.get('/api/species', {'q': 'сенпалия'})  # typo о/а
        self.assertEqual(res.status_code, 200)
        self.assertTrue(any(x['slug'] == 'senpolia' for x in res.json()))
