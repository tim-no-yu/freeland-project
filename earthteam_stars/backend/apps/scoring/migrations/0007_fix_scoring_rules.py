from django.db import migrations


def fix_scoring_rules(apps, schema_editor):
    ScoringRule = apps.get_model('scoring', 'ScoringRule')
    ScoringRule.objects.filter(card_type='collaboration').update(min_stars=1, max_stars=1)
    ScoringRule.objects.filter(card_type='action').update(min_stars=2, max_stars=100)
    ScoringRule.objects.filter(card_type='impact').update(min_stars=101, max_stars=500)


class Migration(migrations.Migration):

    dependencies = [
        ('scoring', '0006_seed_collaboration_rule'),
    ]

    operations = [
        migrations.RunPython(fix_scoring_rules, migrations.RunPython.noop),
    ]
