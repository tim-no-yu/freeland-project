from django.test import TestCase
from rest_framework.test import APIClient
from apps.users.models import User
from apps.report_cards.models import ReportCard
from apps.scoring.models import ScoringRule
from .models import Verification


def make_user(username, role):
    return User.objects.create_user(username=username, password='pass', role=role)


def make_card(user, status='pending', card_type='collaboration'):
    return ReportCard.objects.create(
        submitter=user,
        title='Test',
        description='Desc',
        card_type=card_type,
        status=status,
    )


class VerifierQueueTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.verifier = make_user('v1', 'verifier')
        self.reporter = make_user('r1', 'reporter')
        self.client.force_authenticate(user=self.verifier)

    def test_queue_shows_pending_cards(self):
        make_card(self.reporter, status='pending')
        make_card(self.reporter, status='draft')
        resp = self.client.get('/api/verifications/queue/')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.data), 1)

    def test_queue_excludes_already_verified(self):
        card = make_card(self.reporter, status='pending')
        Verification.objects.create(
            report_card=card, verifier=self.verifier, score=80, decision='approve'
        )
        resp = self.client.get('/api/verifications/queue/')
        self.assertEqual(len(resp.data), 0)

    def test_reporter_cannot_access_queue(self):
        self.client.force_authenticate(user=self.reporter)
        resp = self.client.get('/api/verifications/queue/')
        self.assertEqual(resp.status_code, 403)

    def test_queue_filter_by_card_type(self):
        make_card(self.reporter, status='pending', card_type='collaboration')
        make_card(self.reporter, status='pending', card_type='action')
        resp = self.client.get('/api/verifications/queue/?card_type=action')
        self.assertEqual(len(resp.data), 1)


class SubmitVerificationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.verifier = make_user('v1', 'verifier')
        self.reporter = make_user('r1', 'reporter')
        self.card = make_card(self.reporter, status='pending')
        self.client.force_authenticate(user=self.verifier)
        ScoringRule.objects.get_or_create(
            card_type='collaboration',
            defaults={'min_stars': 1, 'max_stars': 21, 'min_verifications': 1},
        )

    def test_verifier_can_submit(self):
        resp = self.client.post(f'/api/verifications/{self.card.id}/submit/', {
            'score': 80, 'decision': 'approve', 'comment': 'Good work',
        })
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(resp.data['decision'], 'approve')

    def test_cannot_verify_twice(self):
        self.client.post(f'/api/verifications/{self.card.id}/submit/', {
            'score': 80, 'decision': 'approve',
        })
        resp = self.client.post(f'/api/verifications/{self.card.id}/submit/', {
            'score': 70, 'decision': 'approve',
        })
        self.assertEqual(resp.status_code, 400)

    def test_reporter_cannot_submit_verification(self):
        self.client.force_authenticate(user=self.reporter)
        resp = self.client.post(f'/api/verifications/{self.card.id}/submit/', {
            'score': 80, 'decision': 'approve',
        })
        self.assertEqual(resp.status_code, 403)

    def test_card_auto_approves_when_threshold_met(self):
        self.client.post(f'/api/verifications/{self.card.id}/submit/', {
            'score': 80, 'decision': 'approve',
        })
        self.card.refresh_from_db()
        self.assertEqual(self.card.status, 'approved')
        self.assertIsNotNone(self.card.stars_awarded)

    def test_rejected_card_does_not_approve(self):
        self.client.post(f'/api/verifications/{self.card.id}/submit/', {
            'score': 10, 'decision': 'reject',
        })
        self.card.refresh_from_db()
        self.assertNotEqual(self.card.status, 'approved')


class ListVerificationsTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.reporter = make_user('r1', 'reporter')
        self.verifier = make_user('v1', 'verifier')
        self.card = make_card(self.reporter, status='pending')
        Verification.objects.create(
            report_card=self.card, verifier=self.verifier, score=70, decision='approve'
        )

    def test_list_verifications_for_card(self):
        self.client.force_authenticate(user=self.reporter)
        resp = self.client.get(f'/api/verifications/{self.card.id}/')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.data), 1)
