from django.conf import settings
from django.db import models


class ScoringRule(models.Model):
    card_type = models.CharField(max_length=15, unique=True)
    min_stars = models.IntegerField()
    max_stars = models.IntegerField()
    min_verifications = models.IntegerField()
    updated_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    updated_at = models.DateTimeField(auto_now=True)


class ScoringParameter(models.Model):
    TIER_COLLABORATION = 'collaboration'
    TIER_OUTPUT = 'output'
    TIER_OUTCOME = 'outcome'
    TIER_IMPACT = 'impact'
    TIER_INTEGRITY = 'integrity'

    TIER_CHOICES = [
        (TIER_COLLABORATION, 'Collaboration (1.0)'),
        (TIER_OUTPUT, 'Action Output (2.1)'),
        (TIER_OUTCOME, 'Action Outcome (2.2)'),
        (TIER_IMPACT, 'Impact (3.0)'),
        (TIER_INTEGRITY, 'Integrity (4.0)'),
    ]

    UNIT_NUMBER = 'number'
    UNIT_PERCENT = 'percent'
    UNIT_YES_NO = 'yes_no'

    UNIT_CHOICES = [
        (UNIT_NUMBER, 'Number'),
        (UNIT_PERCENT, 'Percentage'),
        (UNIT_YES_NO, 'Yes/No'),
    ]

    INTERVENTION_GENERAL = 'general'
    INTERVENTION_MARKET_DEMAND = 'market_demand'
    INTERVENTION_POACHING = 'poaching'
    INTERVENTION_TRAFFICKING = 'trafficking'
    INTERVENTION_AGRICULTURE = 'regenerative_agriculture'
    INTERVENTION_HABITAT = 'habitat_protection'

    INTERVENTION_CHOICES = [
        (INTERVENTION_GENERAL, 'General'),
        (INTERVENTION_MARKET_DEMAND, 'Reduce Market Demand for Wildlife'),
        (INTERVENTION_POACHING, 'Reduce Poaching of Wildlife'),
        (INTERVENTION_TRAFFICKING, 'Reduce Trafficking of Wildlife'),
        (INTERVENTION_AGRICULTURE, 'Regenerative Agriculture'),
        (INTERVENTION_HABITAT, 'Habitat Protection'),
    ]

    indicator_id = models.CharField(max_length=20)
    description = models.TextField()
    tier = models.CharField(max_length=15, choices=TIER_CHOICES)
    intervention_type = models.CharField(max_length=30, choices=INTERVENTION_CHOICES, default=INTERVENTION_GENERAL)
    units = models.CharField(max_length=10, choices=UNIT_CHOICES, default=UNIT_NUMBER)
    ets_weight = models.FloatField()
    updated_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('indicator_id', 'intervention_type')

    def __str__(self):
        return f"{self.indicator_id} {self.description[:60]}"
