from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('scoring', '0003_seed_scoring_rules'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='ScoringParameter',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('indicator_id', models.CharField(max_length=20)),
                ('description', models.TextField()),
                ('tier', models.CharField(choices=[
                    ('collaboration', 'Collaboration (1.0)'),
                    ('output', 'Action Output (2.1)'),
                    ('outcome', 'Action Outcome (2.2)'),
                    ('impact', 'Impact (3.0)'),
                    ('integrity', 'Integrity (4.0)'),
                ], max_length=15)),
                ('intervention_type', models.CharField(choices=[
                    ('general', 'General'),
                    ('market_demand', 'Reduce Market Demand for Wildlife'),
                    ('poaching', 'Reduce Poaching of Wildlife'),
                    ('trafficking', 'Reduce Trafficking of Wildlife'),
                    ('regenerative_agriculture', 'Regenerative Agriculture'),
                    ('habitat_protection', 'Habitat Protection'),
                ], default='general', max_length=30)),
                ('units', models.CharField(choices=[
                    ('number', 'Number'),
                    ('percent', 'Percentage'),
                    ('yes_no', 'Yes/No'),
                ], default='number', max_length=10)),
                ('ets_weight', models.FloatField()),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('updated_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL)),
            ],
            options={'unique_together': {('indicator_id', 'intervention_type')}},
        ),
    ]
