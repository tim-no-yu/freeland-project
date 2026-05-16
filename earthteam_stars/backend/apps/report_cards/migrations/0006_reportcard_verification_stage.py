from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('report_cards', '0005_reportcard_baseline_data_reportcard_dataset_url_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='reportcard',
            name='verification_stage',
            field=models.CharField(
                choices=[
                    ('collaboration', 'Collaboration (1.1)'),
                    ('action', 'Action (2.1 / 2.2)'),
                    ('impact', 'Impact (3.0)'),
                    ('complete', 'Complete'),
                ],
                default='collaboration',
                max_length=15,
            ),
        ),
    ]
