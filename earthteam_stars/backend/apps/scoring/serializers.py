from rest_framework import serializers
from .models import ScoringRule


class ScoringRuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = ScoringRule
        fields = ['id', 'card_type', 'min_stars', 'max_stars', 'min_verifications', 'updated_at']
