from django.test import TestCase
from rest_framework.test import APIClient
from apps.users.models import User
from apps.report_cards.models import ReportCard
from apps.verifications.models import Verification
from .models import ScoringRule, ScoringParameter
from .engine import compute_stars, has_enough_verifications, compute_ets_from_parameters


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


# 
# Parameter seed verification — confirms all 83 rows from the Excel match
# 

EXPECTED_PARAMETERS = [
    # Collaboration (general)
    ('1.1.1', 'general', 'yes_no', 1.0),
    ('1.1.2', 'general', 'yes_no', 5.0),
    ('1.1.3', 'general', 'yes_no', 10.0),
    ('1.1.4', 'general', 'yes_no', 5.0),
    # Integrity (general)
    ('4.1.1', 'general', 'yes_no', 5.0),
    ('4.1.2', 'general', 'yes_no', 5.0),
    ('4.1.3', 'general', 'yes_no', 5.0),
    # Market demand — output
    ('out_1', 'market_demand', 'number', 10.0),
    ('out_2', 'market_demand', 'number', 0.2),
    ('out_3', 'market_demand', 'number', 10.0),
    ('out_4', 'market_demand', 'number', 10.0),
    # Market demand — outcome
    ('oc_1',  'market_demand', 'percent', 10.0),
    ('oc_2',  'market_demand', 'percent', 10.0),
    ('oc_3',  'market_demand', 'percent', 10.0),
    ('oc_4',  'market_demand', 'percent', 10.0),
    ('oc_5',  'market_demand', 'yes_no',  45.0),
    # Market demand — impact
    ('imp_1', 'market_demand', 'percent', 15.0),
    ('imp_2', 'market_demand', 'percent', 15.0),
    ('imp_3', 'market_demand', 'yes_no',  200.0),
    # Poaching — output
    ('out_5',  'poaching', 'number', 10.0),
    ('out_6',  'poaching', 'number', 1.0),
    ('out_7',  'poaching', 'number', 1.0),
    ('out_8',  'poaching', 'number', 1.0),
    ('out_9',  'poaching', 'number', 10.0),
    ('out_10', 'poaching', 'number', 5.0),
    ('out_11', 'poaching', 'number', 10.0),
    ('out_12', 'poaching', 'number', 25.0),
    # Poaching — outcome
    ('oc_6', 'poaching', 'percent', 10.0),
    ('oc_7', 'poaching', 'percent', 10.0),
    ('oc_8', 'poaching', 'percent', 10.0),
    ('oc_9', 'poaching', 'yes_no',  45.0),
    # Poaching — impact
    ('imp_4', 'poaching', 'percent', 15.0),
    ('imp_5', 'poaching', 'percent', 15.0),
    ('imp_6', 'poaching', 'percent', 15.0),
    ('imp_7', 'poaching', 'percent', 15.0),
    # Trafficking — output
    ('out_13', 'trafficking', 'number', 1.0),
    ('out_14', 'trafficking', 'number', 1.0),
    ('out_15', 'trafficking', 'number', 10.0),
    ('out_16', 'trafficking', 'number', 25.0),
    ('out_17', 'trafficking', 'number', 50.0),
    ('out_18', 'trafficking', 'number', 0.2),
    # Trafficking — outcome
    ('oc_10', 'trafficking', 'percent', 10.0),
    ('oc_11', 'trafficking', 'percent', 10.0),
    ('oc_12', 'trafficking', 'yes_no',  100.0),
    ('oc_13', 'trafficking', 'percent', 10.0),
    ('oc_14', 'trafficking', 'yes_no',  100.0),
    ('oc_15', 'trafficking', 'number',  150.0),
    # Trafficking — impact
    ('imp_8',  'trafficking', 'yes_no',  200.0),
    ('imp_9',  'trafficking', 'yes_no',  500.0),
    ('imp_10', 'trafficking', 'percent', 15.0),
    # Regenerative agriculture — output
    ('out_19', 'regenerative_agriculture', 'number',  1.0),
    ('out_20', 'regenerative_agriculture', 'number',  10.0),
    ('out_21', 'regenerative_agriculture', 'percent', 1.0),
    ('out_22', 'regenerative_agriculture', 'number',  1.0),
    ('out_23', 'regenerative_agriculture', 'yes_no',  10.0),
    ('out_24', 'regenerative_agriculture', 'number',  1.0),
    # Regenerative agriculture — outcome
    ('oc_16', 'regenerative_agriculture', 'percent', 10.0),
    ('oc_17', 'regenerative_agriculture', 'percent', 10.0),
    ('oc_18', 'regenerative_agriculture', 'percent', 10.0),
    ('oc_19', 'regenerative_agriculture', 'percent', 10.0),
    ('oc_20', 'regenerative_agriculture', 'percent', 10.0),
    ('oc_21', 'regenerative_agriculture', 'yes_no',  45.0),
    ('oc_22', 'regenerative_agriculture', 'number',  5.0),
    ('oc_23', 'regenerative_agriculture', 'percent', 10.0),
    # Regenerative agriculture — impact
    ('imp_11', 'regenerative_agriculture', 'percent', 15.0),
    ('imp_12', 'regenerative_agriculture', 'percent', 15.0),
    ('imp_13', 'regenerative_agriculture', 'yes_no',  200.0),
    ('imp_14', 'regenerative_agriculture', 'percent', 15.0),
    ('imp_15', 'regenerative_agriculture', 'yes_no',  100.0),
    # Habitat protection — output
    ('out_25', 'habitat_protection', 'number',  2.0),
    ('out_26', 'habitat_protection', 'yes_no',  25.0),
    ('out_27', 'habitat_protection', 'number',  1.0),
    ('out_28', 'habitat_protection', 'yes_no',  15.0),
    # Habitat protection — outcome
    ('oc_24', 'habitat_protection', 'percent', 10.0),
    ('oc_25', 'habitat_protection', 'percent', 10.0),
    ('oc_26', 'habitat_protection', 'percent', 10.0),
    ('oc_27', 'habitat_protection', 'number',  10.0),
    ('oc_28', 'habitat_protection', 'yes_no',  45.0),
    # Habitat protection — impact
    ('imp_16', 'habitat_protection', 'percent', 15.0),
    ('imp_17', 'habitat_protection', 'percent', 15.0),
    ('imp_18', 'habitat_protection', 'percent', 50.0),
    ('imp_19', 'habitat_protection', 'percent', 50.0),
    ('imp_20', 'habitat_protection', 'yes_no',  250.0),
    # Generic output (Section 2.1) — all action/impact cards
    ('2.1.1', 'general', 'yes_no', 5.0),
    ('2.1.3', 'general', 'yes_no', 5.0),
    ('2.1.4', 'general', 'yes_no', 5.0),
    ('2.1.5', 'general', 'yes_no', 5.0),
    # Generic outcome (Section 2.2)
    ('2.2.2', 'general', 'yes_no', 5.0),
    ('2.2.3', 'general', 'yes_no', 5.0),
    ('2.2.4', 'general', 'yes_no', 5.0),
    ('2.2.5', 'general', 'yes_no', 5.0),
    ('2.2.6', 'general', 'yes_no', 5.0),
    # Generic impact (Section 3.1)
    ('3.1.2', 'general', 'yes_no', 5.0),
    ('3.1.3', 'general', 'yes_no', 5.0),
    ('3.1.4', 'general', 'yes_no', 5.0),
]


class ParameterSeedTests(TestCase):
    def test_total_parameter_count_is_95(self):
        self.assertEqual(ScoringParameter.objects.count(), 95)

    def test_all_parameters_exist_with_correct_weight_and_units(self):
        errors = []
        for indicator_id, intervention_type, units, ets_weight in EXPECTED_PARAMETERS:
            try:
                p = ScoringParameter.objects.get(
                    indicator_id=indicator_id,
                    intervention_type=intervention_type,
                )
            except ScoringParameter.DoesNotExist:
                errors.append(f'MISSING: {indicator_id} / {intervention_type}')
                continue
            if p.units != units:
                errors.append(
                    f'{indicator_id}/{intervention_type}: units expected {units}, got {p.units}'
                )
            if abs(p.ets_weight - ets_weight) > 0.001:
                errors.append(
                    f'{indicator_id}/{intervention_type}: weight expected {ets_weight}, got {p.ets_weight}'
                )
        if errors:
            self.fail('\n'.join(errors))

    def test_general_parameters_count(self):
        # 4 collaboration + 3 integrity + 4 generic output + 5 generic outcome + 3 generic impact
        self.assertEqual(
            ScoringParameter.objects.filter(intervention_type='general').count(), 19
        )

    def test_market_demand_parameters_count(self):
        self.assertEqual(
            ScoringParameter.objects.filter(intervention_type='market_demand').count(), 12
        )

    def test_poaching_parameters_count(self):
        self.assertEqual(
            ScoringParameter.objects.filter(intervention_type='poaching').count(), 16
        )

    def test_trafficking_parameters_count(self):
        self.assertEqual(
            ScoringParameter.objects.filter(intervention_type='trafficking').count(), 15
        )

    def test_regenerative_agriculture_parameters_count(self):
        self.assertEqual(
            ScoringParameter.objects.filter(intervention_type='regenerative_agriculture').count(), 19
        )

    def test_habitat_protection_parameters_count(self):
        self.assertEqual(
            ScoringParameter.objects.filter(intervention_type='habitat_protection').count(), 14
        )


class ETSComputationTests(TestCase):
    def test_market_demand_yes_no_parameter(self):
        # oc_5 (social acceptability) = yes_no, weight 45.0
        result = compute_ets_from_parameters({'oc_5': 1}, 'market_demand')
        self.assertEqual(result, 45)

    def test_market_demand_number_parameter(self):
        # out_1 (events) = number, weight 10.0 — 3 events = 30 ETS
        result = compute_ets_from_parameters({'out_1': 3}, 'market_demand')
        self.assertEqual(result, 30)

    def test_market_demand_percent_parameter(self):
        # oc_1 (purchase reduction) = percent, weight 10.0 — 50% = 500 ETS
        result = compute_ets_from_parameters({'oc_1': 50}, 'market_demand')
        self.assertEqual(result, 500)

    def test_market_demand_combined(self):
        # out_1=1 (×10=10) + oc_5=1 (×45=45) = 55
        result = compute_ets_from_parameters({'out_1': 1, 'oc_5': 1}, 'market_demand')
        self.assertEqual(result, 55)

    def test_market_demand_impact_high_weight(self):
        # imp_3 (reduced poaching pressure) = yes_no, weight 200.0
        result = compute_ets_from_parameters({'imp_3': 1}, 'market_demand')
        self.assertEqual(result, 200)

    def test_poaching_number_parameter(self):
        # out_9 (weapons removed) = number, weight 10.0 — 5 weapons = 50 ETS
        result = compute_ets_from_parameters({'out_9': 5}, 'poaching')
        self.assertEqual(result, 50)

    def test_poaching_yes_no_parameter(self):
        # oc_9 (reduced recurrence) = yes_no, weight 45.0
        result = compute_ets_from_parameters({'oc_9': 1}, 'poaching')
        self.assertEqual(result, 45)

    def test_poaching_combined(self):
        # out_9=1 (×10=10) + oc_9=1 (×45=45) = 55
        result = compute_ets_from_parameters({'out_9': 1, 'oc_9': 1}, 'poaching')
        self.assertEqual(result, 55)

    def test_trafficking_arrest_weight(self):
        # out_16 (traffickers arrested) = number, weight 25.0 — 2 = 50
        result = compute_ets_from_parameters({'out_16': 2}, 'trafficking')
        self.assertEqual(result, 50)

    def test_trafficking_network_dismantled(self):
        # imp_9 (dismantling major networks) = yes_no, weight 500.0
        result = compute_ets_from_parameters({'imp_9': 1}, 'trafficking')
        self.assertEqual(result, 500)

    def test_trafficking_combined(self):
        # out_16=1 (×25=25) + imp_9=1 (×500=500) = 525
        result = compute_ets_from_parameters({'out_16': 1, 'imp_9': 1}, 'trafficking')
        self.assertEqual(result, 525)

    def test_regenerative_agriculture_yield_stability(self):
        # oc_21 (yield stability) = yes_no, weight 45.0
        result = compute_ets_from_parameters({'oc_21': 1}, 'regenerative_agriculture')
        self.assertEqual(result, 45)

    def test_regenerative_agriculture_farmers(self):
        # out_20 (new farmers) = number, weight 10.0 — 10 farmers = 100 ETS
        result = compute_ets_from_parameters({'out_20': 10}, 'regenerative_agriculture')
        self.assertEqual(result, 100)

    def test_regenerative_agriculture_combined(self):
        # out_20=1 (×10=10) + oc_21=1 (×45=45) = 55
        result = compute_ets_from_parameters({'out_20': 1, 'oc_21': 1}, 'regenerative_agriculture')
        self.assertEqual(result, 55)

    def test_habitat_protection_management_plan(self):
        # out_26 (management plans) = yes_no, weight 25.0
        result = compute_ets_from_parameters({'out_26': 1}, 'habitat_protection')
        self.assertEqual(result, 25)

    def test_habitat_protection_connectivity(self):
        # oc_28 (improved connectivity) = yes_no, weight 45.0
        result = compute_ets_from_parameters({'oc_28': 1}, 'habitat_protection')
        self.assertEqual(result, 45)

    def test_habitat_protection_permanence(self):
        # imp_20 (long-term integrity >10-30 years) = yes_no, weight 250.0
        result = compute_ets_from_parameters({'imp_20': 1}, 'habitat_protection')
        self.assertEqual(result, 250)

    def test_habitat_protection_combined(self):
        # out_26=1 (×25=25) + oc_28=1 (×45=45) = 70
        result = compute_ets_from_parameters({'out_26': 1, 'oc_28': 1}, 'habitat_protection')
        self.assertEqual(result, 70)

    def test_generic_output_params_included_in_intervention_specific_compute(self):
        # 2.1.1 (targets defined) is a generic param — should count when computing poaching ETS
        result = compute_ets_from_parameters({'2.1.1': 1}, 'poaching')
        self.assertEqual(result, 5)

    def test_generic_outcome_params_included_in_intervention_specific_compute(self):
        # 2.2.3 (attribution logic) = yes_no, weight 5 — should count for market_demand
        result = compute_ets_from_parameters({'2.2.3': 1}, 'market_demand')
        self.assertEqual(result, 5)

    def test_generic_impact_params_included_in_intervention_specific_compute(self):
        # 3.1.2 (permanence) = yes_no, weight 5 — should count for habitat_protection
        result = compute_ets_from_parameters({'3.1.2': 1}, 'habitat_protection')
        self.assertEqual(result, 5)

    def test_generic_and_specific_params_combine(self):
        # out_9=1 (poaching, ×10=10) + 2.1.1=1 (generic, ×5=5) = 15
        result = compute_ets_from_parameters({'out_9': 1, '2.1.1': 1}, 'poaching')
        self.assertEqual(result, 15)

    def test_all_12_generic_params_combined(self):
        # 4 output + 5 outcome + 3 impact, all yes_no at 5 ETS = 60 ETS
        values = {
            '2.1.1': 1, '2.1.3': 1, '2.1.4': 1, '2.1.5': 1,
            '2.2.2': 1, '2.2.3': 1, '2.2.4': 1, '2.2.5': 1, '2.2.6': 1,
            '3.1.2': 1, '3.1.3': 1, '3.1.4': 1,
        }
        result = compute_ets_from_parameters(values, 'poaching')
        self.assertEqual(result, 60)

    def test_collaboration_params_not_included_in_intervention_specific_compute(self):
        # 1.1.1 is a collaboration param under general — should NOT be included when
        # computing for poaching (only output/outcome/impact tiers from general are included)
        result = compute_ets_from_parameters({'1.1.1': 1}, 'poaching')
        self.assertEqual(result, 0)

    def test_integrity_params_not_included_in_intervention_specific_compute(self):
        # 4.1.1 is an integrity param under general — same exclusion rule
        result = compute_ets_from_parameters({'4.1.1': 1}, 'poaching')
        self.assertEqual(result, 0)

    def test_unknown_indicator_is_ignored(self):
        result = compute_ets_from_parameters({'nonexistent_id': 999}, 'poaching')
        self.assertEqual(result, 0)

    def test_zero_value_contributes_nothing(self):
        result = compute_ets_from_parameters({'out_9': 0, 'oc_9': 0}, 'poaching')
        self.assertEqual(result, 0)

    def test_yes_no_zero_treated_as_no(self):
        result = compute_ets_from_parameters({'imp_9': 0}, 'trafficking')
        self.assertEqual(result, 0)

    def test_collaboration_parameters_compute(self):
        # 1.1.1=1 (×1=1) + 1.1.3=1 (×10=10) = 11
        result = compute_ets_from_parameters({'1.1.1': 1, '1.1.3': 1}, 'general')
        self.assertEqual(result, 11)

    def test_integrity_parameters_compute(self):
        # 4.1.1=1 (×5=5) + 4.1.2=1 (×5=5) + 4.1.3=1 (×5=5) = 15
        result = compute_ets_from_parameters({'4.1.1': 1, '4.1.2': 1, '4.1.3': 1}, 'general')
        self.assertEqual(result, 15)


class ETSStarComputeTests(TestCase):
    def setUp(self):
        self.reporter = make_user('r_ets')
        self.verifier = make_user('v_ets', 'verifier')

    def test_compute_stars_uses_ets_when_submission_values_present(self):
        # Action card with poaching intervention, 1 weapon removed (out_9 × 10 = 10 ETS)
        # Action rule: min 2, max 100 — 10 is within range
        card = ReportCard.objects.create(
            submitter=self.reporter,
            title='T', description='D',
            card_type='action',
            status='pending',
            intervention_type='poaching',
            submission_values={'out_9': 1},
        )
        v = make_verification(card, self.verifier, 80)
        stars = compute_stars(card, [v])
        self.assertEqual(stars, 10)

    def test_compute_stars_clamps_ets_to_min(self):
        # out_9=0 produces 0 ETS, which clamps up to min_stars (2)
        card = ReportCard.objects.create(
            submitter=self.reporter,
            title='T', description='D',
            card_type='action',
            status='pending',
            intervention_type='poaching',
            submission_values={'out_9': 0},
        )
        v = make_verification(card, self.verifier, 80)
        stars = compute_stars(card, [v])
        self.assertEqual(stars, 2)

    def test_compute_stars_clamps_ets_to_max(self):
        # Action card — dismantling a major trafficking network = 500 ETS, clamps to max 100
        card = ReportCard.objects.create(
            submitter=self.reporter,
            title='T', description='D',
            card_type='action',
            status='pending',
            intervention_type='trafficking',
            submission_values={'imp_9': 1},
        )
        v = make_verification(card, self.verifier, 80)
        stars = compute_stars(card, [v])
        self.assertEqual(stars, 100)

    def test_compute_stars_falls_back_to_average_without_submission_values(self):
        card = ReportCard.objects.create(
            submitter=self.reporter,
            title='T', description='D',
            card_type='action',
            status='pending',
        )
        v = make_verification(card, self.verifier, 100)
        stars = compute_stars(card, [v])
        # avg_score=100, score_range=98 (100-2), result=2+98=100
        self.assertEqual(stars, 100)

    def test_compute_stars_returns_zero_with_no_approvals(self):
        card = make_card(self.reporter, 'action')
        v = make_verification(card, self.verifier, 80, decision='reject')
        stars = compute_stars(card, [v])
        self.assertEqual(stars, 0)
