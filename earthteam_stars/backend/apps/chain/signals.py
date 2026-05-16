"""
Signals that wire the verifier flow + wallet capture into the mint pipeline.

Two triggers, both idempotent:

1. ReportCard.post_save
       When a card transitions to status='approved' with stars_awarded > 0,
       get_or_create a ChainTx in 'pending' state. If the row already exists
       and is still pending (worker has not picked it up), refresh the
       wallet_address and token_amount in case they changed.

2. User.post_save
       When a reporter sets their wallet_address (from empty to non-empty,
       or to a different value), backfill any of their pending ChainTx rows
       that are still missing a wallet so the worker can pick them up.

Neither signal does any RPC work. Both are cheap. The mint worker
(`manage.py mint_pending`) is the only thing that touches Solana.
"""

from __future__ import annotations

import logging

from django.conf import settings
from django.db.models.signals import post_save
from django.dispatch import receiver

from apps.report_cards.models import ReportCard
from apps.users.models import User

from .models import ChainTx

logger = logging.getLogger(__name__)


def _ensure_pending_chain_tx(card: ReportCard) -> ChainTx | None:
    """Create or refresh the pending ChainTx row for an approved card."""
    if card.status != 'approved':
        return None
    stars = card.stars_awarded or 0
    if stars <= 0:
        return None

    wallet = (getattr(card.submitter, 'wallet_address', '') or '').strip()
    network = settings.SOLANA_CLUSTER

    tx, created = ChainTx.objects.get_or_create(
        report_card=card,
        defaults={
            'wallet_address': wallet,
            'token_amount': stars,
            'network': network,
            'status': 'pending',
        },
    )

    if created:
        logger.info(
            'chain_tx queued',
            extra={'card_id': card.id, 'wallet': wallet, 'amount': stars},
        )
        return tx

    # Only refresh while still pending; never mutate after a mint attempt
    # has started, so we cannot rewrite history.
    if tx.status == 'pending':
        dirty = False
        if tx.token_amount != stars:
            tx.token_amount = stars
            dirty = True
        if not tx.wallet_address and wallet:
            tx.wallet_address = wallet
            dirty = True
        if tx.network != network:
            tx.network = network
            dirty = True
        if dirty:
            tx.save(update_fields=['token_amount', 'wallet_address', 'network', 'updated_at'])
    return tx


@receiver(post_save, sender=ReportCard, dispatch_uid='chain_queue_mint_on_approval')
def queue_mint_on_approval(sender, instance: ReportCard, created: bool, **kwargs):
    _ensure_pending_chain_tx(instance)


@receiver(post_save, sender=User, dispatch_uid='chain_backfill_pending_on_wallet')
def backfill_pending_on_wallet(sender, instance: User, created: bool, **kwargs):
    """
    When a reporter sets/updates their wallet_address, fill in any of their
    ChainTx rows that are still pending without a wallet so the worker can
    finally mint them. Safe to fire on every User.save — runs a single
    indexed query.
    """
    wallet = (instance.wallet_address or '').strip()
    if not wallet:
        return

    pending = ChainTx.objects.filter(
        report_card__submitter=instance,
        status='pending',
        wallet_address='',
    )
    updated = pending.update(wallet_address=wallet)
    if updated:
        logger.info(
            'chain_tx wallet backfilled',
            extra={'user_id': instance.id, 'wallet': wallet, 'rows': updated},
        )
