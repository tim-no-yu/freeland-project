from .models import ScoringParameter, ScoringRule


def has_enough_verifications(card, verifications):
    try:
        rule = ScoringRule.objects.get(card_type=card.card_type)
    except ScoringRule.DoesNotExist:
        return False
    approvals = [v for v in verifications if v.decision == 'approve']
    return len(approvals) >= rule.min_verifications


def compute_stars(card, verifications):
    try:
        rule = ScoringRule.objects.get(card_type=card.card_type)
    except ScoringRule.DoesNotExist:
        return 0

    approvals = [v for v in verifications if v.decision == 'approve']
    if not approvals:
        return 0

    if card.submission_values and card.intervention_type:
        raw = compute_ets_from_parameters(card.submission_values, card.intervention_type)
        return max(rule.min_stars, min(rule.max_stars, raw))

    avg_score = sum(v.score for v in approvals) / len(approvals)
    score_range = rule.max_stars - rule.min_stars
    stars = rule.min_stars + round((avg_score / 100) * score_range)
    return max(rule.min_stars, min(rule.max_stars, stars))


def compute_ets_from_parameters(submission_values, intervention_type):
    parameters = ScoringParameter.objects.filter(intervention_type=intervention_type)
    total = 0.0
    for param in parameters:
        value = submission_values.get(param.indicator_id, 0)
        if param.units == 'yes_no':
            total += param.ets_weight if value else 0
        else:
            total += float(value) * param.ets_weight
    return round(total)
