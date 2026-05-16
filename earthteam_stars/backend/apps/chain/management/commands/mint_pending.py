"""
Mint worker for queued ChainTx rows.

Usage:
    python manage.py mint_pending --once          # one pass, exit
    python manage.py mint_pending --loop          # keep looping forever
    python manage.py mint_pending --loop --interval 30
    python manage.py mint_pending --once --limit 10

Deploy on Railway as a cron / scheduled command running every ~30s. The
command is safe to run from multiple processes because each row is taken
under `select_for_update` inside a transaction, and the OneToOne on
ChainTx.report_card prevents duplicates.

Double-mint guard:
    - Right after we submit a tx, we persist its signature on the row.
    - On the next attempt for that row, we ask Solana whether that signature
      confirmed BEFORE building a new tx.
    - If it didn't confirm and the blockhash has expired (>~60s), we treat
      the prior tx as dead and re-submit.
"""

from __future__ import annotations

import logging
import time
from datetime import timedelta

from django.conf import settings
from django.core.management.base import BaseCommand
from django.db import transaction
from django.db.models import Q
from django.utils import timezone

from apps.chain.models import ChainTx
from apps.chain.services import solana

logger = logging.getLogger(__name__)


# Solana blockhash lifetime is ~60-90s. After this many seconds an unconfirmed
# tx is safe to treat as dead and re-submit without risking a double-mint.
BLOCKHASH_TTL_SECONDS = 90
# Short delay when a tx is in flight but not yet confirmed.
SHORT_POLL_SECONDS = 15


class Command(BaseCommand):
    help = 'Mint queued ChainTx rows on Solana.'

    def add_arguments(self, parser):
        parser.add_argument('--once', action='store_true', help='Run one pass and exit (default).')
        parser.add_argument('--loop', action='store_true', help='Run continuously.')
        parser.add_argument('--interval', type=int, default=30, help='Seconds between passes when --loop.')
        parser.add_argument('--limit', type=int, default=20, help='Max rows to handle per pass.')

    def handle(self, *args, **opts):
        if opts['loop']:
            interval = max(5, int(opts['interval']))
            self.stdout.write(self.style.NOTICE(f'mint_pending loop, interval={interval}s'))
            while True:
                self._pass(limit=opts['limit'])
                time.sleep(interval)
        else:
            self._pass(limit=opts['limit'])

    def _pass(self, limit: int):
        now = timezone.now()
        candidates = (
            ChainTx.objects
            .filter(status__in=['pending', 'submitting'])
            .exclude(wallet_address='')
            .filter(Q(next_attempt_at__isnull=True) | Q(next_attempt_at__lte=now))
            .order_by('issued_at')
            .values_list('id', flat=True)[:limit]
        )
        ids = list(candidates)
        if not ids:
            return

        self.stdout.write(f'mint_pending: {len(ids)} candidate(s)')
        for tx_id in ids:
            try:
                self._process(tx_id)
            except Exception as exc:  # noqa: BLE001 - last-resort safety net
                logger.exception('mint_pending unexpected error', extra={'tx_id': tx_id})
                self.stderr.write(self.style.ERROR(f'  tx={tx_id} crashed: {exc}'))

    def _process(self, tx_id: int):
        with transaction.atomic():
            try:
                tx = ChainTx.objects.select_for_update().get(pk=tx_id)
            except ChainTx.DoesNotExist:
                return

            if tx.status not in ('pending', 'submitting'):
                return
            if not tx.wallet_address:
                return
            if tx.next_attempt_at and tx.next_attempt_at > timezone.now():
                return

            # Step 1: if we already have a signature in flight, check it
            # before doing anything else. This is the double-mint guard.
            if tx.tx_signature:
                if self._poll_existing(tx):
                    return

            # Step 2: build + submit a new tx.
            self._submit_new(tx)

    # --- handlers -------------------------------------------------------

    def _poll_existing(self, tx: ChainTx) -> bool:
        """
        Returns True if the row reached a terminal state (confirmed/failed)
        OR was rescheduled for later. Returns False if we should fall through
        and submit a fresh tx because the prior signature is dead.
        """
        try:
            confirmed = solana.check_confirmation(tx.tx_signature)
        except solana.SolanaPermanentError as exc:
            self._mark_failed(tx, f'on-chain failure: {exc}')
            return True
        except solana.SolanaTransientError as exc:
            self._bump_attempt(tx, f'confirm transient: {exc}')
            return True
        except solana.SolanaConfigError as exc:
            self._bump_attempt(tx, f'config: {exc}')
            return True

        if confirmed:
            self._mark_confirmed(tx)
            return True

        # Still in flight. If we've waited longer than the blockhash TTL,
        # the prior tx is effectively dead; fall through and re-submit.
        age = (timezone.now() - tx.updated_at).total_seconds()
        if age < BLOCKHASH_TTL_SECONDS:
            tx.next_attempt_at = timezone.now() + timedelta(seconds=SHORT_POLL_SECONDS)
            tx.save(update_fields=['next_attempt_at', 'updated_at'])
            return True

        logger.info('mint_pending: prior signature expired, will re-submit',
                    extra={'tx_id': tx.id, 'old_sig': tx.tx_signature})
        tx.tx_signature = ''
        tx.save(update_fields=['tx_signature', 'updated_at'])
        return False

    def _submit_new(self, tx: ChainTx):
        tx.status = 'submitting'
        tx.attempts = tx.attempts + 1
        tx.save(update_fields=['status', 'attempts', 'updated_at'])

        memo = solana.build_memo(tx.report_card_id)
        try:
            signature = solana.send_mint_tx(
                recipient_wallet=tx.wallet_address,
                amount=tx.token_amount,
                memo=memo,
            )
        except solana.SolanaPermanentError as exc:
            self._mark_failed(tx, f'send permanent: {exc}')
            return
        except (solana.SolanaTransientError, solana.SolanaConfigError) as exc:
            self._bump_attempt(tx, f'send transient/config: {exc}')
            return

        # Persist signature BEFORE confirming so a confirm-timeout never
        # leads to a re-send on the next pass.
        tx.tx_signature = signature
        tx.memo_hash = solana.hash_memo(memo)
        tx.save(update_fields=['tx_signature', 'memo_hash', 'updated_at'])

        try:
            confirmed = solana.check_confirmation(signature)
        except solana.SolanaPermanentError as exc:
            self._mark_failed(tx, f'confirm permanent: {exc}')
            return
        except solana.SolanaTransientError:
            tx.status = 'pending'
            tx.next_attempt_at = timezone.now() + timedelta(seconds=SHORT_POLL_SECONDS)
            tx.save(update_fields=['status', 'next_attempt_at', 'updated_at'])
            return

        if confirmed:
            self._mark_confirmed(tx)
        else:
            tx.status = 'pending'
            tx.next_attempt_at = timezone.now() + timedelta(seconds=SHORT_POLL_SECONDS)
            tx.save(update_fields=['status', 'next_attempt_at', 'updated_at'])

    # --- terminal-state helpers ----------------------------------------

    def _mark_confirmed(self, tx: ChainTx):
        tx.status = 'confirmed'
        tx.explorer_url = solana.explorer_url(tx.tx_signature)
        tx.next_attempt_at = None
        tx.last_error = ''
        tx.save(update_fields=['status', 'explorer_url', 'next_attempt_at', 'last_error', 'updated_at'])
        self.stdout.write(self.style.SUCCESS(
            f'  tx={tx.id} card={tx.report_card_id} confirmed sig={tx.tx_signature}'
        ))

    def _mark_failed(self, tx: ChainTx, msg: str):
        tx.status = 'failed'
        tx.last_error = msg
        tx.next_attempt_at = None
        tx.save(update_fields=['status', 'last_error', 'next_attempt_at', 'updated_at'])
        self.stderr.write(self.style.ERROR(
            f'  tx={tx.id} card={tx.report_card_id} failed: {msg}'
        ))

    def _bump_attempt(self, tx: ChainTx, msg: str):
        tx.last_error = msg
        if tx.attempts >= settings.STARS_MINT_MAX_ATTEMPTS:
            tx.status = 'failed'
            tx.next_attempt_at = None
            self.stderr.write(self.style.ERROR(
                f'  tx={tx.id} card={tx.report_card_id} exhausted attempts: {msg}'
            ))
        else:
            tx.status = 'pending'
            # Exponential backoff: 30s, 60s, 120s, 240s, ...
            backoff_base = max(1, int(settings.STARS_MINT_BACKOFF_SECONDS))
            backoff = backoff_base * (2 ** max(0, tx.attempts - 1))
            tx.next_attempt_at = timezone.now() + timedelta(seconds=backoff)
            self.stdout.write(
                f'  tx={tx.id} card={tx.report_card_id} retry in {backoff}s: {msg}'
            )
        tx.save(update_fields=['status', 'last_error', 'next_attempt_at', 'updated_at'])
