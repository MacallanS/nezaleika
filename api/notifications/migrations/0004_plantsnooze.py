import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('plants', '0004_userplant_season_days'),
        ('notifications', '0003_season_alerts'),
    ]

    operations = [
        migrations.CreateModel(
            name='PlantSnooze',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('until', models.DateTimeField()),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                (
                    'plant',
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name='snoozes',
                        to='plants.userplant',
                    ),
                ),
                (
                    'user',
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name='plant_snoozes',
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                'verbose_name': 'Отложенный полив',
                'verbose_name_plural': 'Отложенные поливы',
            },
        ),
        migrations.AddConstraint(
            model_name='plantsnooze',
            constraint=models.UniqueConstraint(fields=('user', 'plant'), name='uniq_plant_snooze_per_user'),
        ),
    ]
