from django.conf import settings
from django.db import models


class Verification(models.Model):
    report_card = models.ForeignKey('report_cards.ReportCard', on_delete=models.CASCADE, related_name='verifications')
    verifier = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='verifications')
    score = models.IntegerField()
    comment = models.TextField(blank=True)
    decision = models.CharField(max_length=10, choices=[
        ('approve', 'Approve'),
        ('reject', 'Reject'),
    ])
    stage = models.CharField(max_length=15, choices=[
        ('collaboration', 'Collaboration (1.1)'),
        ('action', 'Action (2.1 / 2.2)'),
        ('impact', 'Impact (3.0)'),
    ], default='collaboration')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('report_card', 'verifier', 'stage')
