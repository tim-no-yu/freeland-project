from django.conf import settings
from django.db import models


class ScoringRule(models.Model):
    card_type = models.CharField(max_length=10, unique=True)
    min_stars = models.IntegerField()
    max_stars = models.IntegerField()
    min_verifications = models.IntegerField()
    updated_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    updated_at = models.DateTimeField(auto_now=True)
