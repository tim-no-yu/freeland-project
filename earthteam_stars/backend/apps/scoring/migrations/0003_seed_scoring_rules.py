from django.db import migrations


def seed_scoring_rules(apps, schema_editor):
    ScoringRule = apps.get_model('scoring', 'ScoringRule')
    ScoringRule.objects.get_or_create(
        card_type='action',
        defaults={
            'min_stars': 5,
            'max_stars': 100,
            'min_verifications': 5,
        }
    )
    ScoringRule.objects.get_or_create(
        card_type='impact',
        defaults={
            'min_stars': 101,
            'max_stars': 500,
            'min_verifications': 25,
        }
    )


class Migration(migrations.Migration):

    dependencies = [
        ('scoring', '0002_initial'),
    ]

    operations = [
        migrations.RunPython(seed_scoring_rules, migrations.RunPython.noop),
    ]
