from django.conf import settings
from django.db import models


class PlantCategory(models.TextChoices):
    SUCCULENT = 'succulent', 'Суккулент'
    TROPICAL = 'tropical', 'Тропик'
    FERN = 'fern', 'Папоротник'
    ORCHID = 'orchid', 'Орхидея'
    CACTUS = 'cactus', 'Кактус'
    HERB = 'herb', 'Травянистое'
    PALM = 'palm', 'Пальма'
    FLOWERING = 'flowering', 'Цветущее'
    FOLIAGE = 'foliage', 'Декоративно-лиственное'
    OTHER = 'other', 'Другое'


class PlantSpecies(models.Model):
    slug = models.SlugField(unique=True, max_length=120)
    name_ru = models.CharField(max_length=200)
    name_lat = models.CharField(max_length=200, blank=True)
    category = models.CharField(max_length=32, choices=PlantCategory.choices, default=PlantCategory.OTHER)
    spring_days = models.PositiveSmallIntegerField(help_text='Интервал полива весной, дней')
    summer_days = models.PositiveSmallIntegerField(help_text='Интервал полива летом, дней')
    autumn_days = models.PositiveSmallIntegerField(null=True, blank=True, help_text='Осень; если пусто — как весна')
    winter_days = models.PositiveSmallIntegerField(help_text='Интервал полива зимой, дней')
    care_hint = models.TextField(blank=True)

    class Meta:
        ordering = ['name_ru']
        verbose_name = 'Вид растения'
        verbose_name_plural = 'Виды растений'

    def __str__(self) -> str:
        return self.name_ru

    def interval_for_season(self, season: str) -> int:
        if season == 'summer':
            return self.summer_days
        if season == 'winter':
            return self.winter_days
        if season == 'autumn':
            return self.autumn_days if self.autumn_days else self.spring_days
        return self.spring_days


class UserPlant(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='plants')
    species = models.ForeignKey(PlantSpecies, on_delete=models.PROTECT, related_name='user_plants')
    name = models.CharField(max_length=200)
    photo = models.ImageField(upload_to='plants/%Y/%m/', blank=True, null=True)
    photo_data = models.TextField(blank=True, help_text='Сжатое фото как data URL; диск Render не постоянный')
    room = models.CharField(max_length=120, blank=True)
    note = models.TextField(blank=True)
    added_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Моё растение'
        verbose_name_plural = 'Мои растения'

    def __str__(self) -> str:
        return self.name


class WateringEvent(models.Model):
    user_plant = models.ForeignKey(UserPlant, on_delete=models.CASCADE, related_name='waterings')
    watered_at = models.DateTimeField()
    watered_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='waterings',
    )
    note = models.CharField(max_length=500, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-watered_at']
        verbose_name = 'Полив'
        verbose_name_plural = 'Поливы'
