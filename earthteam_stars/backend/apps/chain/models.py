from django.db import models


class ChainTx(models.Model):
    report_card = models.OneToOneField('report_cards.ReportCard', on_delete=models.CASCADE, related_name='chain_tx')
    tx_signature = models.CharField(max_length=255)
    memo_hash = models.CharField(max_length=255)
    explorer_url = models.URLField()
    issued_at = models.DateTimeField(auto_now_add=True)
