from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('report_cards', '0006_reportcard_verification_stage'),
    ]

    operations = [
        migrations.AddField(
            model_name='reportcard',
            name='geographic_area_sqkm',
            field=models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True),
        ),
    ]
