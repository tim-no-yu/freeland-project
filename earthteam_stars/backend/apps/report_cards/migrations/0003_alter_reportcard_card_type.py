
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('report_cards', '0002_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='reportcard',
            name='card_type',
            field=models.CharField(choices=[('collaboration', 'Collaboration (Tier 1)'), ('action', 'Action (Tier 2)'), ('impact', 'Impact (Tier 3)')], max_length=15),
        ),
    ]
