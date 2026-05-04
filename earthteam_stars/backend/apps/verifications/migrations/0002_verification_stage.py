from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('verifications', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='verification',
            name='stage',
            field=models.CharField(
                choices=[
                    ('collaboration', 'Collaboration (1.1)'),
                    ('action', 'Action (2.1 / 2.2)'),
                    ('impact', 'Impact (3.0)'),
                ],
                default='collaboration',
                max_length=15,
            ),
        ),
        migrations.AlterUniqueTogether(
            name='verification',
            unique_together={('report_card', 'verifier', 'stage')},
        ),
    ]
