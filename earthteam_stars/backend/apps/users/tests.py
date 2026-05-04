from django.test import TestCase
from rest_framework.test import APIClient
from .models import User


def make_user(username='user1', role='reporter'):
    return User.objects.create_user(username=username, password='pass', role=role)


class AuthTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_register(self):
        resp = self.client.post('/api/auth/register/', {
            'username': 'newuser',
            'password': 'pass123',
            'email': 'new@test.com',
            'role': 'reporter',
        })
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(resp.data['role'], 'reporter')

    def test_login_returns_tokens(self):
        make_user('loginuser')
        resp = self.client.post('/api/auth/token/', {
            'username': 'loginuser', 'password': 'pass',
        })
        self.assertEqual(resp.status_code, 200)
        self.assertIn('access', resp.data)
        self.assertIn('refresh', resp.data)

    def test_login_wrong_password(self):
        make_user('loginuser')
        resp = self.client.post('/api/auth/token/', {
            'username': 'loginuser', 'password': 'wrong',
        })
        self.assertEqual(resp.status_code, 401)

    def test_token_refresh(self):
        make_user('refreshuser')
        login = self.client.post('/api/auth/token/', {
            'username': 'refreshuser', 'password': 'pass',
        })
        resp = self.client.post('/api/auth/token/refresh/', {
            'refresh': login.data['refresh'],
        })
        self.assertEqual(resp.status_code, 200)
        self.assertIn('access', resp.data)


class MeTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = make_user()
        self.client.force_authenticate(user=self.user)

    def test_get_me(self):
        resp = self.client.get('/api/auth/me/')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data['username'], 'user1')
        self.assertEqual(resp.data['role'], 'reporter')

    def test_unauthenticated_cannot_get_me(self):
        self.client.force_authenticate(user=None)
        resp = self.client.get('/api/auth/me/')
        self.assertEqual(resp.status_code, 401)

    def test_patch_me(self):
        resp = self.client.patch('/api/auth/me/', {'wallet_address': 'abc123'})
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data['wallet_address'], 'abc123')


class VerifierReputationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.reporter = make_user('r1', role='reporter')
        self.verifier = make_user('v1', role='verifier')
        self.client.force_authenticate(user=self.reporter)

    def test_get_verifier_reputation(self):
        resp = self.client.get(f'/api/auth/verifiers/{self.verifier.id}/')
        self.assertEqual(resp.status_code, 200)
        self.assertIn('total_verified', resp.data)
        self.assertIn('approval_rate', resp.data)
        self.assertIn('average_score_given', resp.data)

    def test_list_verifiers(self):
        resp = self.client.get('/api/auth/verifiers/')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.data), 1)

    def test_non_verifier_id_returns_404(self):
        resp = self.client.get(f'/api/auth/verifiers/{self.reporter.id}/')
        self.assertEqual(resp.status_code, 404)


class DashboardStatsTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_reporter_stats(self):
        user = make_user('r1', role='reporter')
        self.client.force_authenticate(user=user)
        resp = self.client.get('/api/auth/stats/')
        self.assertEqual(resp.status_code, 200)
        self.assertIn('total_submitted', resp.data)
        self.assertIn('total_stars', resp.data)

    def test_verifier_stats(self):
        user = make_user('v1', role='verifier')
        self.client.force_authenticate(user=user)
        resp = self.client.get('/api/auth/stats/')
        self.assertEqual(resp.status_code, 200)
        self.assertIn('queue_size', resp.data)
        self.assertIn('total_verified', resp.data)

    def test_admin_stats(self):
        user = make_user('a1', role='admin')
        self.client.force_authenticate(user=user)
        resp = self.client.get('/api/auth/stats/')
        self.assertEqual(resp.status_code, 200)
        self.assertIn('total_cards', resp.data)
        self.assertIn('total_verifications', resp.data)
