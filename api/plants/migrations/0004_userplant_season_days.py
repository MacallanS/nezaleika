from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('plants', '0003_plantspecies_image_url'),
    ]

    operations = [
        migrations.AddField(
            model_name='userplant',
            name='spring_days',
            field=models.PositiveSmallIntegerField(
                blank=True, null=True, help_text='Свой интервал весной; пусто — как у вида'
            ),
        ),
        migrations.AddField(
            model_name='userplant',
            name='summer_days',
            field=models.PositiveSmallIntegerField(
                blank=True, null=True, help_text='Свой интервал летом; пусто — как у вида'
            ),
        ),
        migrations.AddField(
            model_name='userplant',
            name='autumn_days',
            field=models.PositiveSmallIntegerField(
                blank=True, null=True, help_text='Свой интервал осенью; пусто — как у вида'
            ),
        ),
        migrations.AddField(
            model_name='userplant',
            name='winter_days',
            field=models.PositiveSmallIntegerField(
                blank=True, null=True, help_text='Свой интервал зимой; пусто — как у вида'
            ),
        ),
    ]
