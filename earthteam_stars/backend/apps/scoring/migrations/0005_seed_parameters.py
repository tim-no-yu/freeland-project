from django.db import migrations


def seed_parameters(apps, schema_editor):
    ScoringParameter = apps.get_model('scoring', 'ScoringParameter')

    params = [
        ('1.1.1', 'Became an EarthTeam member', 'collaboration', 'general', 'yes_no', 1.0),
        ('1.1.2', 'Registered description of solution with EarthTeam', 'collaboration', 'general', 'yes_no', 5.0),
        ('1.1.3', 'Presented solution to EarthTeam', 'collaboration', 'general', 'yes_no', 10.0),
        ('1.1.4', 'Shared action or solution publicly on social media', 'collaboration', 'general', 'yes_no', 5.0),

        ('4.1.1', 'Leakage risk identified and mitigated', 'integrity', 'general', 'yes_no', 5.0),
        ('4.1.2', 'Data quality is independent and repeatable', 'integrity', 'general', 'yes_no', 5.0),
        ('4.1.3', 'No double counting with other claims or credits', 'integrity', 'general', 'yes_no', 5.0),

        ('out_1', 'Number of demand-reduction events implemented', 'output', 'market_demand', 'number', 10.0),
        ('out_2', 'Number of positive responses to campaign', 'output', 'market_demand', 'number', 0.2),
        ('out_3', 'Number of retailers committed to not selling wildlife', 'output', 'market_demand', 'number', 10.0),
        ('out_4', 'Number of consumers committed to not buying wildlife', 'output', 'market_demand', 'number', 10.0),
        ('oc_1', 'Reduction in purchase or use of wildlife products (%)', 'outcome', 'market_demand', 'percent', 10.0),
        ('oc_2', 'Reduction in intent to purchase future demand (%)', 'outcome', 'market_demand', 'percent', 10.0),
        ('oc_3', 'Decline in availability of illegal wildlife products (%)', 'outcome', 'market_demand', 'percent', 10.0),
        ('oc_4', 'Reduction in number of sellers or listings (%)', 'outcome', 'market_demand', 'percent', 10.0),
        ('oc_5', 'Decline in social acceptability linked to wildlife consumption', 'outcome', 'market_demand', 'yes_no', 45.0),
        ('imp_1', 'Sustained reduction in consumer demand over multiple years (%)', 'impact', 'market_demand', 'percent', 15.0),
        ('imp_2', 'Reduction in trafficking volume linked to target products (%)', 'impact', 'market_demand', 'percent', 15.0),
        ('imp_3', 'Reduced poaching pressure on source species', 'impact', 'market_demand', 'yes_no', 200.0),

        ('out_5', 'Patrol coverage in sq km of habitat patrolled per month', 'output', 'poaching', 'number', 10.0),
        ('out_6', 'Patrol km logged', 'output', 'poaching', 'number', 1.0),
        ('out_7', 'Ranger days deployed for patrolling', 'output', 'poaching', 'number', 1.0),
        ('out_8', 'Number of snares removed', 'output', 'poaching', 'number', 1.0),
        ('out_9', 'Number of weapons removed', 'output', 'poaching', 'number', 10.0),
        ('out_10', 'Number of illegal camps removed', 'output', 'poaching', 'number', 5.0),
        ('out_11', 'Number of intelligence-led patrols resulting in actionable data', 'output', 'poaching', 'number', 10.0),
        ('out_12', 'Number of monitoring systems set up and operational', 'output', 'poaching', 'number', 25.0),
        ('oc_6', 'Reduction in poaching incidents per unit area per time (%)', 'outcome', 'poaching', 'percent', 10.0),
        ('oc_7', 'Decline in snare density per km patrolled (%)', 'outcome', 'poaching', 'percent', 10.0),
        ('oc_8', 'Increase in zero-poaching days per month (%)', 'outcome', 'poaching', 'percent', 10.0),
        ('oc_9', 'Reduced recurrence in known poaching hotspots', 'outcome', 'poaching', 'yes_no', 45.0),
        ('imp_4', 'Increase in target species populations (%)', 'impact', 'poaching', 'percent', 15.0),
        ('imp_5', 'Improved age and sex structure of breeding adults (%)', 'impact', 'poaching', 'percent', 15.0),
        ('imp_6', 'Expansion or re-occupation by species of suitable habitat (%)', 'impact', 'poaching', 'percent', 15.0),
        ('imp_7', 'Long-term reduction in poaching risk (%)', 'impact', 'poaching', 'percent', 15.0),

        ('out_13', 'Number of participants or officers trained', 'output', 'trafficking', 'number', 1.0),
        ('out_14', 'Seizures of contraband or wildlife products volume or value', 'output', 'trafficking', 'number', 1.0),
        ('out_15', 'Number of basic arrests of smuggler or market-based seller', 'output', 'trafficking', 'number', 10.0),
        ('out_16', 'Number of traffickers arrested', 'output', 'trafficking', 'number', 25.0),
        ('out_17', 'Number of traffickers prosecuted', 'output', 'trafficking', 'number', 50.0),
        ('out_18', 'Assets seized or frozen from trafficker in USD', 'output', 'trafficking', 'number', 0.2),
        ('oc_10', 'Increase in cases targeting mid and high level actors (%)', 'outcome', 'trafficking', 'percent', 10.0),
        ('oc_11', 'Increase in arrest to conviction ratio for trafficking offenses (%)', 'outcome', 'trafficking', 'percent', 10.0),
        ('oc_12', 'Network disruption evidence such as loss of key nodes or routes', 'outcome', 'trafficking', 'yes_no', 100.0),
        ('oc_13', 'Reduction in repeat offenders or recurring routes (%)', 'outcome', 'trafficking', 'percent', 10.0),
        ('oc_14', 'Increase in cost risk or complexity for traffickers', 'outcome', 'trafficking', 'yes_no', 100.0),
        ('oc_15', 'Number of traffickers publicly prosecuted', 'outcome', 'trafficking', 'number', 150.0),
        ('imp_8', 'Sustained reduction in trafficking flows on key routes', 'impact', 'trafficking', 'yes_no', 200.0),
        ('imp_9', 'Dismantling of major trafficking networks', 'impact', 'trafficking', 'yes_no', 500.0),
        ('imp_10', 'Reduced availability of trafficked wildlife in end markets (%)', 'impact', 'trafficking', 'percent', 15.0),

        ('out_19', 'New farm area under verified regenerative practices in sq km', 'output', 'regenerative_agriculture', 'number', 1.0),
        ('out_20', 'Number of new farmers adopting regenerative systems', 'output', 'regenerative_agriculture', 'number', 10.0),
        ('out_21', 'Reduction in synthetic fertilizer and pesticide application (%)', 'output', 'regenerative_agriculture', 'percent', 1.0),
        ('out_22', 'Cover crop rotation or agroforestry area established in sq km', 'output', 'regenerative_agriculture', 'number', 1.0),
        ('out_23', 'Soil baselines completed and monitoring protocols in place', 'output', 'regenerative_agriculture', 'yes_no', 10.0),
        ('out_24', 'Number of farmers benefitted from regenerative practices', 'output', 'regenerative_agriculture', 'number', 1.0),
        ('oc_16', 'Increase in soil organic carbon or matter (%)', 'outcome', 'regenerative_agriculture', 'percent', 10.0),
        ('oc_17', 'Improved soil structure aggregate stability or bulk density (%)', 'outcome', 'regenerative_agriculture', 'percent', 10.0),
        ('oc_18', 'Improved water infiltration and moisture retention (%)', 'outcome', 'regenerative_agriculture', 'percent', 10.0),
        ('oc_19', 'Increased soil biological activity (%)', 'outcome', 'regenerative_agriculture', 'percent', 10.0),
        ('oc_20', 'Positive change in farmer income (%)', 'outcome', 'regenerative_agriculture', 'percent', 10.0),
        ('oc_21', 'Yield stability over time with reduced variability', 'outcome', 'regenerative_agriculture', 'yes_no', 45.0),
        ('oc_22', 'Reduced input costs per sq km in USD', 'outcome', 'regenerative_agriculture', 'number', 5.0),
        ('oc_23', 'Improved drought or flood resilience (%)', 'outcome', 'regenerative_agriculture', 'percent', 10.0),
        ('imp_11', 'Net increase in soil carbon stocks tC per ha (%)', 'impact', 'regenerative_agriculture', 'percent', 15.0),
        ('imp_12', 'Net reduction in GHG emissions CO2e per ha per year (%)', 'impact', 'regenerative_agriculture', 'percent', 15.0),
        ('imp_13', 'Sustained improvement in soil health over 5 years', 'impact', 'regenerative_agriculture', 'yes_no', 200.0),
        ('imp_14', 'Increased net farm income and livelihood resilience (%)', 'impact', 'regenerative_agriculture', 'percent', 15.0),
        ('imp_15', 'Reduced pressure on surrounding natural ecosystems', 'impact', 'regenerative_agriculture', 'yes_no', 100.0),

        ('out_25', 'Area in sq km placed under legal or de-facto protection', 'output', 'habitat_protection', 'number', 2.0),
        ('out_26', 'Management plans approved and operational', 'output', 'habitat_protection', 'yes_no', 25.0),
        ('out_27', 'Patrol coverage in sq km of protected area patrolled per month', 'output', 'habitat_protection', 'number', 1.0),
        ('out_28', 'Monitoring systems established using remote sensing or field surveys', 'output', 'habitat_protection', 'yes_no', 15.0),
        ('oc_24', 'Reduction in illegal activities such as poaching logging or encroachment (%)', 'outcome', 'habitat_protection', 'percent', 10.0),
        ('oc_25', 'Reduction in fire incidence or severity (%)', 'outcome', 'habitat_protection', 'percent', 10.0),
        ('oc_26', 'Reduced habitat loss rate inside vs outside boundary (%)', 'outcome', 'habitat_protection', 'percent', 10.0),
        ('oc_27', 'Improved vegetation cover or habitat quality index', 'outcome', 'habitat_protection', 'number', 10.0),
        ('oc_28', 'Improved connectivity or reduced fragmentation', 'outcome', 'habitat_protection', 'yes_no', 45.0),
        ('imp_16', 'Stabilization or increase in key species populations (%)', 'impact', 'habitat_protection', 'percent', 15.0),
        ('imp_17', 'Improved species occupancy or range expansion (%)', 'impact', 'habitat_protection', 'percent', 15.0),
        ('imp_18', 'Retained or increased ecosystem carbon stocks (%)', 'impact', 'habitat_protection', 'percent', 50.0),
        ('imp_19', 'Improved watershed or ecosystem service function (%)', 'impact', 'habitat_protection', 'percent', 50.0),
        ('imp_20', 'Long-term habitat integrity and permanence over 10 to 30 years', 'impact', 'habitat_protection', 'yes_no', 250.0),
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
        ('scoring', '0004_scoringparameter'),
    ]

    operations = [
        migrations.RunPython(seed_parameters, migrations.RunPython.noop),
    ]
