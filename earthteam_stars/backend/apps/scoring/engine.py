from .models import ScoringRule


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
    avg_score = sum(v.score for v in approvals) / len(approvals)
    score_range = rule.max_stars - rule.min_stars
    stars = rule.min_stars + round((avg_score / 100) * score_range)
    return max(rule.min_stars, min(rule.max_stars, stars))
