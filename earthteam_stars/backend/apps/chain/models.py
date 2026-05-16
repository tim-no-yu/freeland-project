from django.db import models


class ChainTx(models.Model):
    """
    One row per on-chain mint attempt for a report card.

    Lifecycle:
        pending     -> created by a signal when status='approved' lands, or
                       sitting because the reporter has no wallet yet
        submitting  -> the mint worker has picked it up and is talking to RPC
        confirmed   -> Solana confirmed the tx; explorer_url + tx_signature set
        failed      -> exhausted STARS_MINT_MAX_ATTEMPTS; needs manual triage

    Uniqueness on report_card guarantees we never double-mint for a card.
    """

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('submitting', 'Submitting'),
        ('confirmed', 'Confirmed'),
        ('failed', 'Failed'),
    ]

    report_card = models.OneToOneField(
        'report_cards.ReportCard',
        on_delete=models.CASCADE,
        related_name='chain_tx',
    )

    # What we intend to mint, captured at approval time so a later
    # stars_awarded recalculation does not silently change history.
    wallet_address = models.CharField(max_length=255, blank=True)
    token_amount = models.BigIntegerField(default=0)
    network = models.CharField(max_length=20, default='devnet')

    # State machine + worker bookkeeping.
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    attempts = models.PositiveIntegerField(default=0)
    last_error = models.TextField(blank=True)
    next_attempt_at = models.DateTimeField(null=True, blank=True)

    # Filled in only after the RPC confirms.
    tx_signature = models.CharField(max_length=255, blank=True)
    memo_hash = models.CharField(max_length=255, blank=True)
    explorer_url = models.URLField(blank=True)

    issued_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            # Hot path for the mint worker: find rows ready to attempt next.
            models.Index(fields=['status', 'next_attempt_at']),
        ]

    def __str__(self):
        return f'ChainTx(card={self.report_card_id}, status={self.status})'
