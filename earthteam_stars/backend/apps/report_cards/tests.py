from django.test import TestCase
from rest_framework.test import APIClient
from apps.users.models import User
from .models import ReportCard, Witness


def make_reporter(username='reporter1'):
    return User.objects.create_user(username=username, password='pass', role='reporter')


def make_verifier(username='verifier1'):
    return User.objects.create_user(username=username, password='pass', role='verifier')


def make_card(user, status='draft', card_type='collaboration'):
    return ReportCard.objects.create(
        submitter=user,
        title='Test Card',
        description='Test description',
        card_type=card_type,
        status=status,
    )


class ReportCardCreateTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.reporter = make_reporter()
        self.client.force_authenticate(user=self.reporter)

    def test_create_card_returns_draft(self):
        resp = self.client.post('/api/report-cards/', {
            'title': 'My Card',
            'description': 'Description',
            'card_type': 'collaboration',
        })
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(resp.data['status'], 'draft')

    def test_unauthenticated_cannot_create(self):
        self.client.force_authenticate(user=None)
        resp = self.client.post('/api/report-cards/', {
            'title': 'x', 'description': 'x', 'card_type': 'collaboration',
        })
        self.assertEqual(resp.status_code, 401)


class ReportCardEditTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.reporter = make_reporter()
        self.other = make_reporter('reporter2')
        self.client.force_authenticate(user=self.reporter)
        self.card = make_card(self.reporter, status='draft')

    def test_owner_can_edit_draft(self):
        resp = self.client.patch(f'/api/report-cards/{self.card.id}/', {'title': 'New Title'})
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data['title'], 'New Title')

    def test_non_owner_cannot_edit(self):
        self.client.force_authenticate(user=self.other)
        resp = self.client.patch(f'/api/report-cards/{self.card.id}/', {'title': 'Hack'})
        self.assertEqual(resp.status_code, 403)

    def test_pending_card_cannot_be_edited(self):
        self.card.status = 'pending'
        self.card.save()
        resp = self.client.patch(f'/api/report-cards/{self.card.id}/', {'title': 'x'})
        self.assertEqual(resp.status_code, 400)


class SubmitCardTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.reporter = make_reporter()
        self.other = make_reporter('reporter2')
        self.client.force_authenticate(user=self.reporter)
        self.card = make_card(self.reporter, status='draft')

    def test_owner_can_submit_draft(self):
        resp = self.client.post(f'/api/report-cards/{self.card.id}/submit/')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data['status'], 'pending')

    def test_non_owner_cannot_submit(self):
        self.client.force_authenticate(user=self.other)
        resp = self.client.post(f'/api/report-cards/{self.card.id}/submit/')
        self.assertEqual(resp.status_code, 403)

    def test_already_pending_cannot_submit_again(self):
        self.card.status = 'pending'
        self.card.save()
        resp = self.client.post(f'/api/report-cards/{self.card.id}/submit/')
        self.assertEqual(resp.status_code, 400)


class WitnessTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.reporter = make_reporter()
        self.other = make_reporter('reporter2')
        self.client.force_authenticate(user=self.reporter)
        self.card = make_card(self.reporter)

    def test_owner_can_add_witness(self):
        resp = self.client.post(f'/api/report-cards/{self.card.id}/witnesses/', {
            'name': 'Jane Doe', 'email': 'jane@test.com',
        })
        self.assertEqual(resp.status_code, 201)

    def test_non_owner_cannot_add_witness(self):
        self.client.force_authenticate(user=self.other)
        resp = self.client.post(f'/api/report-cards/{self.card.id}/witnesses/', {
            'name': 'Hack', 'email': 'hack@test.com',
        })
        self.assertEqual(resp.status_code, 403)

    def test_owner_can_delete_witness(self):
        witness = Witness.objects.create(report_card=self.card, name='Jane')
        resp = self.client.delete(f'/api/report-cards/witnesses/{witness.id}/')
        self.assertEqual(resp.status_code, 204)

    def test_non_owner_cannot_delete_witness(self):
        witness = Witness.objects.create(report_card=self.card, name='Jane')
        self.client.force_authenticate(user=self.other)
        resp = self.client.delete(f'/api/report-cards/witnesses/{witness.id}/')
        self.assertEqual(resp.status_code, 403)


class TierUpgradeTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.reporter = make_reporter()
        self.other = make_reporter('reporter2')
        self.client.force_authenticate(user=self.reporter)
        self.card = make_card(self.reporter, status='pending', card_type='collaboration')

    def test_upgrade_collaboration_to_action(self):
        resp = self.client.post(f'/api/report-cards/{self.card.id}/upgrade/', {'card_type': 'action'})
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data['card_type'], 'action')
        self.assertEqual(resp.data['status'], 'pending')

    def test_cannot_skip_tier(self):
        resp = self.client.post(f'/api/report-cards/{self.card.id}/upgrade/', {'card_type': 'impact'})
        self.assertEqual(resp.status_code, 400)

    def test_cannot_downgrade(self):
        self.card.card_type = 'action'
        self.card.save()
        resp = self.client.post(f'/api/report-cards/{self.card.id}/upgrade/', {'card_type': 'collaboration'})
        self.assertEqual(resp.status_code, 400)

    def test_non_owner_cannot_upgrade(self):
        self.client.force_authenticate(user=self.other)
        resp = self.client.post(f'/api/report-cards/{self.card.id}/upgrade/', {'card_type': 'action'})
        self.assertEqual(resp.status_code, 403)


class ListFilterTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.reporter = make_reporter()
        self.other = make_reporter('reporter2')
        self.client.force_authenticate(user=self.reporter)
        make_card(self.reporter, status='draft')
        make_card(self.reporter, status='pending')
        make_card(self.other, status='draft')

    def test_list_all_cards(self):
        resp = self.client.get('/api/report-cards/')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.data), 3)

    def test_filter_by_status(self):
        resp = self.client.get('/api/report-cards/?status=draft')
        self.assertEqual(len(resp.data), 2)

    def test_filter_mine(self):
        resp = self.client.get('/api/report-cards/?mine=true')
        self.assertEqual(len(resp.data), 2)


class ExportTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.reporter = make_reporter()
        self.client.force_authenticate(user=self.reporter)

    def test_export_json_empty(self):
        resp = self.client.get('/api/report-cards/export/')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.json(), [])

    def test_export_csv_empty(self):
        resp = self.client.get('/api/report-cards/export/?type=csv')
        self.assertEqual(resp.status_code, 200)
        self.assertIn('text/csv', resp['Content-Type'])

    def test_export_csv_with_data(self):
        make_card(self.reporter, status='approved')
        resp = self.client.get('/api/report-cards/export/?type=csv')
        self.assertEqual(resp.status_code, 200)
        content = resp.content.decode()
        self.assertIn('id', content)
        self.assertIn('title', content)
