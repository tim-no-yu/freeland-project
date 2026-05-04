from django.test import TestCase
from rest_framework.test import APIClient
from apps.users.models import User
from apps.report_cards.models import ReportCard
from .models import ChainTx


def make_user(username, role='reporter'):
    return User.objects.create_user(username=username, password='pass', role=role)


def make_card(user, status='approved'):
    return ReportCard.objects.create(
        submitter=user, title='T', description='D',
        card_type='collaboration', status=status, stars_awarded=10,
    )


class ChainTxTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = make_user('a1', 'admin')
        self.reporter = make_user('r1', 'reporter')
        self.card = make_card(self.reporter)
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

    def test_missing_fields_rejected(self):
        resp = self.client.post(f'/api/chain/issue/{self.card.id}/', {
            'tx_signature': 'abc123',
        })
        self.assertEqual(resp.status_code, 400)
        self.assertIn('Missing required fields', resp.data['error'])

    def test_reporter_cannot_record_tx(self):
        self.client.force_authenticate(user=self.reporter)
        resp = self.client.post(f'/api/chain/issue/{self.card.id}/', {
            'tx_signature': 'abc', 'memo_hash': 'h', 'explorer_url': 'https://x.com',
        })
        self.assertEqual(resp.status_code, 403)

    def test_non_approved_card_rejected(self):
        pending_card = make_card(self.reporter, status='pending')
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
