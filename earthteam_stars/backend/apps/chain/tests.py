from datetime import timedelta
from unittest.mock import patch

from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework.test import APIClient

from apps.chain.management.commands import mint_pending as mint_pending_module
from apps.chain.models import ChainTx
from apps.chain.services import solana
from apps.report_cards.models import ReportCard
from apps.users.models import User


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def make_user(username, role='reporter', wallet=''):
    return User.objects.create_user(
        username=username,
        password='pass',
        role=role,
        wallet_address=wallet,
    )


def make_card(user, status='approved', stars=10):
    return ReportCard.objects.create(
        submitter=user,
        title='T',
        description='D',
        card_type='collaboration',
        status=status,
        stars_awarded=stars,
    )


# ---------------------------------------------------------------------------
# Existing REST endpoint behaviour (kept for backwards compatibility)
# ---------------------------------------------------------------------------


class ChainTxTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = make_user('a1', 'admin')
        self.reporter = make_user('r1', 'reporter')
        self.card = make_card(self.reporter)
        # The approval signal will have created a ChainTx; drop it so the
        # legacy endpoint tests start from a clean slate.
        ChainTx.objects.filter(report_card=self.card).delete()
        self.client.force_authenticate(user=self.admin)

    def test_admin_can_record_tx(self):
        resp = self.client.post(f'/api/chain/issue/{self.card.id}/', {
            'tx_signature': 'abc123',
            'memo_hash': 'hash456',
            'explorer_url': 'https://explorer.solana.com/tx/abc123',
        })
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(resp.data['tx_signature'], 'abc123')

    def test_cannot_record_tx_twice(self):
        ChainTx.objects.create(
            report_card=self.card,
            tx_signature='abc', memo_hash='hash',
            explorer_url='https://explorer.solana.com/tx/abc',
        )
        resp = self.client.post(f'/api/chain/issue/{self.card.id}/', {
            'tx_signature': 'new', 'memo_hash': 'new', 'explorer_url': 'https://x.com',
        })
        self.assertEqual(resp.status_code, 400)

    def test_reporter_cannot_record_tx(self):
        self.client.force_authenticate(user=self.reporter)
        resp = self.client.post(f'/api/chain/issue/{self.card.id}/', {
            'tx_signature': 'abc', 'memo_hash': 'h', 'explorer_url': 'https://x.com',
        })
        self.assertEqual(resp.status_code, 403)

    def test_missing_fields_rejected(self):
        resp = self.client.post(f'/api/chain/issue/{self.card.id}/', {
            'tx_signature': 'abc123',
        })
        self.assertEqual(resp.status_code, 400)
        self.assertIn('Missing required fields', resp.data['error'])

    def test_non_approved_card_rejected(self):
        pending_card = make_card(self.reporter, status='pending')
        # The signal only creates ChainTx for approved cards, so nothing to clean up.
        resp = self.client.post(f'/api/chain/issue/{pending_card.id}/', {
            'tx_signature': 'abc', 'memo_hash': 'h', 'explorer_url': 'https://x.com',
        })
        self.assertEqual(resp.status_code, 404)

    def test_get_tx(self):
        ChainTx.objects.create(
            report_card=self.card,
            tx_signature='abc', memo_hash='hash',
            explorer_url='https://explorer.solana.com/tx/abc',
        )
        resp = self.client.get(f'/api/chain/tx/{self.card.id}/')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data['tx_signature'], 'abc')

    def test_pending_chain_shows_approved_without_tx(self):
        # `card` already had its signal-created ChainTx wiped in setUp.
        resp = self.client.get('/api/chain/pending/')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.data), 1)

    def test_pending_chain_excludes_already_issued(self):
        ChainTx.objects.create(
            report_card=self.card,
            tx_signature='abc', memo_hash='hash',
            explorer_url='https://explorer.solana.com/tx/abc',
        )
        resp = self.client.get('/api/chain/pending/')
        self.assertEqual(len(resp.data), 0)


# ---------------------------------------------------------------------------
# Pure helpers (no solana deps required)
# ---------------------------------------------------------------------------


class SolanaHelpersTests(TestCase):
    def test_hash_memo_is_stable(self):
        a = solana.hash_memo('earthteam-stars://report-card/42')
        b = solana.hash_memo('earthteam-stars://report-card/42')
        c = solana.hash_memo('earthteam-stars://report-card/43')
        self.assertEqual(a, b)
        self.assertNotEqual(a, c)
        self.assertEqual(len(a), 64)  # sha256 hex

    def test_build_memo_includes_card_id(self):
        memo = solana.build_memo(99)
        self.assertIn('99', memo)
        self.assertTrue(memo.startswith('earthteam-stars://'))

    @override_settings(SOLANA_CLUSTER='devnet')
    def test_explorer_url_devnet(self):
        url = solana.explorer_url('sig123')
        self.assertIn('sig123', url)
        self.assertIn('cluster=devnet', url)

    @override_settings(SOLANA_CLUSTER='mainnet-beta')
    def test_explorer_url_mainnet_no_query(self):
        url = solana.explorer_url('sig123')
        self.assertIn('sig123', url)
        self.assertNotIn('cluster=', url)

    def test_send_mint_tx_rejects_invalid_amount(self):
        with self.assertRaises(solana.SolanaPermanentError):
            solana.send_mint_tx('addr', 0, 'memo')

    def test_send_mint_tx_rejects_empty_wallet(self):
        with self.assertRaises(solana.SolanaPermanentError):
            solana.send_mint_tx('', 1, 'memo')


# ---------------------------------------------------------------------------
# Signals
# ---------------------------------------------------------------------------


class SignalTests(TestCase):
    def test_approval_creates_pending_chain_tx(self):
        reporter = make_user('rsig1', wallet='WalletAbc')
        card = make_card(reporter, status='approved', stars=7)
        tx = ChainTx.objects.get(report_card=card)
        self.assertEqual(tx.status, 'pending')
        self.assertEqual(tx.token_amount, 7)
        self.assertEqual(tx.wallet_address, 'WalletAbc')

    def test_draft_card_does_not_create_chain_tx(self):
        reporter = make_user('rsig2', wallet='WalletAbc')
        card = make_card(reporter, status='draft', stars=0)
        self.assertFalse(ChainTx.objects.filter(report_card=card).exists())

    def test_approval_without_wallet_still_queues(self):
        reporter = make_user('rsig3', wallet='')
        card = make_card(reporter, status='approved', stars=4)
        tx = ChainTx.objects.get(report_card=card)
        self.assertEqual(tx.status, 'pending')
        self.assertEqual(tx.wallet_address, '')

    def test_setting_wallet_backfills_pending_rows(self):
        reporter = make_user('rsig4', wallet='')
        card = make_card(reporter, status='approved', stars=5)
        tx = ChainTx.objects.get(report_card=card)
        self.assertEqual(tx.wallet_address, '')

        reporter.wallet_address = 'NewWallet42'
        reporter.save()

        tx.refresh_from_db()
        self.assertEqual(tx.wallet_address, 'NewWallet42')

    def test_wallet_backfill_only_touches_pending_rows(self):
        reporter = make_user('rsig5', wallet='')
        card = make_card(reporter, status='approved', stars=5)
        tx = ChainTx.objects.get(report_card=card)
        # Pretend the worker already moved on to submitting with an empty addr
        # (it never would in practice, but proves the guard).
        tx.status = 'submitting'
        tx.save()

        reporter.wallet_address = 'ShouldNotOverwrite'
        reporter.save()

        tx.refresh_from_db()
        self.assertEqual(tx.wallet_address, '')

    def test_re_approval_refreshes_pending_amount(self):
        reporter = make_user('rsig6', wallet='WA')
        card = make_card(reporter, status='approved', stars=3)
        tx = ChainTx.objects.get(report_card=card)
        self.assertEqual(tx.token_amount, 3)

        card.stars_awarded = 9
        card.save()

        tx.refresh_from_db()
        self.assertEqual(tx.token_amount, 9)


# ---------------------------------------------------------------------------
# Mint worker (with mocked Solana service)
# ---------------------------------------------------------------------------


class _StubCommand:
    """Minimal stand-in for management Command stdout/stderr so we can call
    private methods directly without launching `call_command`."""
    class _Out:
        def __init__(self):
            self.lines = []

        def write(self, s):
            self.lines.append(str(s))

    def __init__(self):
        self.stdout = self._Out()
        self.stderr = self._Out()

    def style(self):  # pragma: no cover - never used
        return self

    # Mimic the BaseCommand style helpers used in the command.
    def __getattr__(self, name):
        if name in ('SUCCESS', 'ERROR', 'NOTICE', 'WARNING'):
            return lambda msg: msg
        raise AttributeError(name)


def _make_worker():
    """Build a Command instance with no-op stdout/stderr style helpers."""
    cmd = mint_pending_module.Command()
    cmd.stdout = _StubCommand._Out()
    cmd.stderr = _StubCommand._Out()
    # Override the style helpers so SUCCESS/ERROR/NOTICE just pass strings through.
    class _Style:
        SUCCESS = lambda self, msg: msg
        ERROR = lambda self, msg: msg
        NOTICE = lambda self, msg: msg
        WARNING = lambda self, msg: msg
    cmd.style = _Style()
    return cmd


@override_settings(
    STARS_MINT_MAX_ATTEMPTS=3,
    STARS_MINT_BACKOFF_SECONDS=10,
)
class MintWorkerTests(TestCase):
    def _seed(self, wallet='Wallet123', stars=5):
        reporter = make_user(f'wk{timezone.now().timestamp()}', wallet=wallet)
        card = make_card(reporter, status='approved', stars=stars)
        return ChainTx.objects.get(report_card=card)

    def test_happy_path_marks_confirmed(self):
        tx = self._seed()

        with patch.object(solana, 'send_mint_tx', return_value='sigABC') as send_mock, \
             patch.object(solana, 'check_confirmation', return_value=True) as confirm_mock:
            worker = _make_worker()
            worker._pass(limit=10)

        send_mock.assert_called_once()
        confirm_mock.assert_called_once_with('sigABC')

        tx.refresh_from_db()
        self.assertEqual(tx.status, 'confirmed')
        self.assertEqual(tx.tx_signature, 'sigABC')
        self.assertIn('sigABC', tx.explorer_url)
        self.assertNotEqual(tx.memo_hash, '')

    def test_pending_without_wallet_is_skipped(self):
        tx = self._seed(wallet='')
        with patch.object(solana, 'send_mint_tx') as send_mock:
            worker = _make_worker()
            worker._pass(limit=10)
        send_mock.assert_not_called()
        tx.refresh_from_db()
        self.assertEqual(tx.status, 'pending')
        self.assertEqual(tx.attempts, 0)

    def test_transient_send_failure_schedules_retry(self):
        tx = self._seed()

        with patch.object(solana, 'send_mint_tx',
                          side_effect=solana.SolanaTransientError('429 rate limited')):
            worker = _make_worker()
            worker._pass(limit=10)

        tx.refresh_from_db()
        self.assertEqual(tx.status, 'pending')
        self.assertEqual(tx.attempts, 1)
        self.assertIsNotNone(tx.next_attempt_at)
        self.assertIn('429', tx.last_error)

    def test_permanent_send_failure_marks_failed(self):
        tx = self._seed()

        with patch.object(solana, 'send_mint_tx',
                          side_effect=solana.SolanaPermanentError('bad mint')):
            worker = _make_worker()
            worker._pass(limit=10)

        tx.refresh_from_db()
        self.assertEqual(tx.status, 'failed')
        self.assertIn('bad mint', tx.last_error)
        self.assertIsNone(tx.next_attempt_at)

    def test_max_attempts_promotes_to_failed(self):
        tx = self._seed()
        # Pretend we've already burned the budget on transient errors.
        tx.attempts = 3  # equals STARS_MINT_MAX_ATTEMPTS in override
        tx.save()

        with patch.object(solana, 'send_mint_tx',
                          side_effect=solana.SolanaTransientError('boom')):
            worker = _make_worker()
            worker._pass(limit=10)

        tx.refresh_from_db()
        self.assertEqual(tx.status, 'failed')

    def test_prior_signature_confirmed_short_circuits_submit(self):
        tx = self._seed()
        tx.tx_signature = 'oldSig'
        tx.attempts = 1
        tx.save()

        with patch.object(solana, 'check_confirmation', return_value=True) as confirm_mock, \
             patch.object(solana, 'send_mint_tx') as send_mock:
            worker = _make_worker()
            worker._pass(limit=10)

        confirm_mock.assert_called_once_with('oldSig')
        send_mock.assert_not_called()
        tx.refresh_from_db()
        self.assertEqual(tx.status, 'confirmed')
        self.assertEqual(tx.tx_signature, 'oldSig')

    def test_expired_prior_signature_triggers_resubmit(self):
        tx = self._seed()
        tx.tx_signature = 'staleSig'
        tx.attempts = 1
        # Force updated_at into the past so the worker treats blockhash as expired.
        ChainTx.objects.filter(pk=tx.pk).update(
            tx_signature='staleSig',
            updated_at=timezone.now() - timedelta(seconds=mint_pending_module.BLOCKHASH_TTL_SECONDS + 10),
        )

        with patch.object(solana, 'check_confirmation', return_value=False), \
             patch.object(solana, 'send_mint_tx', return_value='freshSig') as send_mock:
            worker = _make_worker()
            worker._pass(limit=10)

        send_mock.assert_called_once()
        tx.refresh_from_db()
        # The fresh send succeeded but confirm returned False, so it ends up
        # pending with the new signature stored.
        self.assertEqual(tx.tx_signature, 'freshSig')
