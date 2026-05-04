from django.db import migrations, models


def seed_collaboration_rule(apps, schema_editor):
    ScoringRule = apps.get_model('scoring', 'ScoringRule')
    ScoringRule.objects.get_or_create(
        card_type='collaboration',
        defaults={
            'min_stars': 1,
            'max_stars': 21,
            'min_verifications': 1,
        }
    )


class Migration(migrations.Migration):

    dependencies = [
        ('scoring', '0005_seed_parameters'),
    ]

    operations = [
        migrations.AlterField(
            model_name='scoringrule',
            name='card_type',
            field=models.CharField(max_length=15, unique=True),
        ),
        migrations.RunPython(seed_collaboration_rule, migrations.RunPython.noop),
    ]
