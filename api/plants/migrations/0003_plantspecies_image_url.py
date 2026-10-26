from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('plants', '0002_photo_data_watered_by'),
    ]

    operations = [
        migrations.AddField(
            model_name='plantspecies',
            name='image_url',
            field=models.CharField(
                blank=True,
                default='',
                help_text='Site-relative path, e.g. /species/monstera.webp',
                max_length=400,
            ),
        ),
    ]
