from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('notifications', '0002_last_sent_on'),
    ]

    operations = [
        migrations.AddField(
            model_name='notificationprefs',
            name='season_alerts',
            field=models.BooleanField(default=True, help_text='Пуш в первый день сезона полива'),
        ),
        migrations.AddField(
            model_name='notificationprefs',
            name='last_season_notified',
            field=models.CharField(
                blank=True,
                default='',
                help_text='Последний сезон, о котором уже слали пуш (YYYY-season)',
                max_length=16,
            ),
        ),
    ]
