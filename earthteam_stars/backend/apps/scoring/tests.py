from django.test import TestCase
from rest_framework.test import APIClient
from apps.users.models import User
from apps.report_cards.models import ReportCard
from apps.verifications.models import Verification
from .models import ScoringRule
from .engine import compute_stars, has_enough_verifications


def make_user(username, role='reporter'):
    return User.objects.create_user(username=username, password='pass', role=role)


def make_card(user, card_type='collaboration'):
    return ReportCard.objects.create(
        submitter=user, title='T', description='D', card_type=card_type, status='pending'
    )


def make_verification(card, verifier, score, decision='approve'):
    return Verification.objects.create(
        report_card=card, verifier=verifier, score=score, decision=decision
    )


class ScoringEngineTests(TestCase):
    def setUp(self):
        self.reporter = make_user('r1')
        self.verifier = make_user('v1', 'verifier')
        ScoringRule.objects.get_or_create(
            card_type='collaboration',
            defaults={'min_stars': 1, 'max_stars': 21, 'min_verifications': 1},
        )
        ScoringRule.objects.get_or_create(
            card_type='action',
            defaults={'min_stars': 5, 'max_stars': 100, 'min_verifications': 5},
        )

    def test_not_enough_verifications(self):
        card = make_card(self.reporter, 'action')
        v = make_verification(card, self.verifier, 80)
        self.assertFalse(has_enough_verifications(card, [v]))

    def test_enough_verifications(self):
        card = make_card(self.reporter, 'collaboration')
        v = make_verification(card, self.verifier, 80)
        self.assertTrue(has_enough_verifications(card, [v]))

    def test_compute_stars_clamps_to_min(self):
        card = make_card(self.reporter, 'collaboration')
        v = make_verification(card, self.verifier, 0)
        stars = compute_stars(card, [v])
        self.assertGreaterEqual(stars, 1)

    def test_compute_stars_clamps_to_max(self):
        card = make_card(self.reporter, 'collaboration')
        v = make_verification(card, self.verifier, 100)
        stars = compute_stars(card, [v])
        self.assertLessEqual(stars, 21)

    def test_rejects_do_not_count_toward_threshold(self):
        card = make_card(self.reporter, 'collaboration')
        v = make_verification(card, self.verifier, 50, decision='reject')
        self.assertFalse(has_enough_verifications(card, [v]))


class ScoringRulesAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.reporter = make_user('r1')
        self.admin = make_user('a1', 'admin')
        ScoringRule.objects.get_or_create(
            card_type='collaboration',
            defaults={'min_stars': 1, 'max_stars': 21, 'min_verifications': 1},
        )

    def test_anyone_can_get_rules(self):
        self.client.force_authenticate(user=self.reporter)
        resp = self.client.get('/api/scoring-rules/')
        self.assertEqual(resp.status_code, 200)
        self.assertGreaterEqual(len(resp.data), 1)

    def test_admin_can_update_rule(self):
        self.client.force_authenticate(user=self.admin)
        rule = ScoringRule.objects.first()
        resp = self.client.patch(f'/api/scoring-rules/{rule.id}/', {'max_stars': 25})
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data['max_stars'], 25)

    def test_reporter_cannot_update_rule(self):
        self.client.force_authenticate(user=self.reporter)
        rule = ScoringRule.objects.first()
        resp = self.client.patch(f'/api/scoring-rules/{rule.id}/', {'max_stars': 999})
        self.assertEqual(resp.status_code, 403)
