from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.report_cards.models import ReportCard
from apps.report_cards.serializers import ReportCardSerializer
from apps.scoring.engine import compute_stars
from apps.users.permissions import IsVerifier, IsVerifierOrAdmin
from .models import Verification
from .serializers import VerificationSerializer

STAGE_ORDER = {
    'collaboration': ['collaboration'],
    'action': ['collaboration', 'action'],
    'impact': ['collaboration', 'action', 'impact'],
}


def next_stage(current_stage, card_type):
    stages = STAGE_ORDER.get(card_type, ['collaboration'])
    try:
        idx = stages.index(current_stage)
    except ValueError:
        return 'complete'
    if idx + 1 < len(stages):
        return stages[idx + 1]
    return 'complete'


def stage_has_enough_approvals(card, stage):
    return Verification.objects.filter(
        report_card=card, stage=stage, decision='approve'
    ).count() >= 1


@api_view(['GET'])
@permission_classes([IsVerifierOrAdmin])
def verifier_queue(request):
    card_type = request.query_params.get('card_type')
    queryset = ReportCard.objects.filter(status='pending')
    if card_type:
        queryset = queryset.filter(card_type=card_type)

    already_verified = set(
        Verification.objects.filter(verifier=request.user)
        .values_list('report_card_id', 'stage')
    )

    result = [c for c in queryset if (c.id, c.verification_stage) not in already_verified]
    return Response(ReportCardSerializer(result, many=True).data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_verifications(request, card_id):
    try:
        card = ReportCard.objects.get(id=card_id)
    except ReportCard.DoesNotExist:
        return Response({'error': 'Not found'}, status=404)
    items = Verification.objects.filter(report_card=card)
    return Response(VerificationSerializer(items, many=True).data)


@api_view(['POST'])
@permission_classes([IsVerifier])
def submit_verification(request, card_id):
    try:
        card = ReportCard.objects.get(id=card_id)
    except ReportCard.DoesNotExist:
        return Response({'error': 'Not found'}, status=404)

    if card.status != 'pending':
        return Response({'error': 'Card is not pending verification'}, status=400)

    current_stage = card.verification_stage

    if Verification.objects.filter(
        report_card=card, verifier=request.user, stage=current_stage
    ).exists():
        return Response(
            {'error': f'You already verified the {current_stage} stage of this card'},
            status=400,
        )

    serializer = VerificationSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=400)
    serializer.save(report_card=card, verifier=request.user, stage=current_stage)

    if stage_has_enough_approvals(card, current_stage):
        advanced = next_stage(current_stage, card.card_type)
        if advanced == 'complete':
            all_verifications = list(Verification.objects.filter(report_card=card))
            card.stars_awarded = compute_stars(card, all_verifications)
            card.status = 'approved'
            card.verification_stage = 'complete'
        else:
            card.verification_stage = advanced
        card.save()

    return Response(serializer.data, status=201)
