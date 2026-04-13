from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.report_cards.models import ReportCard
from apps.scoring.engine import compute_stars, has_enough_verifications
from apps.users.permissions import IsVerifier
from .models import Verification
from .serializers import VerificationSerializer


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

    already_verified = Verification.objects.filter(report_card=card, verifier=request.user).exists()
    if already_verified:
        return Response({'error': 'You already verified this card'}, status=400)

    serializer = VerificationSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=400)
    serializer.save(report_card=card, verifier=request.user)

    all_verifications = list(Verification.objects.filter(report_card=card))
    if has_enough_verifications(card, all_verifications):
        card.stars_awarded = compute_stars(card, all_verifications)
        card.status = 'approved'
        card.save()

    return Response(serializer.data, status=201)
