from django.db import migrations


def seed_generic_params(apps, schema_editor):
    ScoringParameter = apps.get_model('scoring', 'ScoringParameter')

    params = [
        # Generic Output (Section 2.1) — applies to all action/impact cards
        ('2.1.1', 'Targets defined', 'output', 'general', 'yes_no', 5.0),
        ('2.1.3', 'Scale and coverage of action described', 'output', 'general', 'yes_no', 5.0),
        ('2.1.4', 'Data and documentation produced', 'output', 'general', 'yes_no', 5.0),
        ('2.1.5', 'Safeguards in place to mitigate negative impact', 'output', 'general', 'yes_no', 5.0),
        # Generic Outcome (Section 2.2)
        ('2.2.2', 'Measurable threat reduction', 'outcome', 'general', 'yes_no', 5.0),
        ('2.2.3', 'Attribution logic established', 'outcome', 'general', 'yes_no', 5.0),
        ('2.2.4', 'Institutional uptake observed', 'outcome', 'general', 'yes_no', 5.0),
        ('2.2.5', 'Durability of change confirmed', 'outcome', 'general', 'yes_no', 5.0),
        ('2.2.6', 'Extra benefits incurred by the project', 'outcome', 'general', 'yes_no', 5.0),
        # Generic Impact (Section 3.1)
        ('3.1.2', 'Permanence of impact established', 'impact', 'general', 'yes_no', 5.0),
        ('3.1.3', 'Additionality confirmed', 'impact', 'general', 'yes_no', 5.0),
        ('3.1.4', 'Equity and co-benefits in target community', 'impact', 'general', 'yes_no', 5.0),
    ]

    for indicator_id, description, tier, intervention_type, units, ets_weight in params:
        ScoringParameter.objects.get_or_create(
            indicator_id=indicator_id,
            intervention_type=intervention_type,
            defaults={
                'description': description,
                'tier': tier,
                'units': units,
                'ets_weight': ets_weight,
            }
        )


class Migration(migrations.Migration):

    dependencies = [
        ('scoring', '0007_fix_scoring_rules'),
    ]

    operations = [
        migrations.RunPython(seed_generic_params, migrations.RunPython.noop),
    ]
