from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.report_cards.models import ReportCard
from apps.report_cards.serializers import ReportCardSerializer
from apps.users.permissions import IsAdmin
from .models import ChainTx
from .serializers import ChainTxSerializer


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def pending_chain(request):
    issued_ids = ChainTx.objects.values_list('report_card_id', flat=True)
    cards = ReportCard.objects.filter(status='approved').exclude(id__in=issued_ids)
    return Response(ReportCardSerializer(cards, many=True).data)


@api_view(['POST'])
@permission_classes([IsAdmin])
def issue_chain_tx(request, card_id):
    try:
        card = ReportCard.objects.get(id=card_id, status='approved')
    except ReportCard.DoesNotExist:
        return Response({'error': 'Approved card not found'}, status=404)

    if ChainTx.objects.filter(report_card=card).exists():
        return Response({'error': 'Transaction already recorded for this card'}, status=400)

    required = ['tx_signature', 'memo_hash', 'explorer_url']
    missing = [f for f in required if not request.data.get(f)]
    if missing:
        return Response({'error': f'Missing required fields: {", ".join(missing)}'}, status=400)

    tx = ChainTx.objects.create(
        report_card=card,
        tx_signature=request.data['tx_signature'],
        memo_hash=request.data['memo_hash'],
        explorer_url=request.data['explorer_url'],
    )
    return Response(ChainTxSerializer(tx).data, status=201)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_chain_tx(request, card_id):
    try:
        tx = ChainTx.objects.get(report_card_id=card_id)
    except ChainTx.DoesNotExist:
        return Response({'error': 'No transaction found for this card'}, status=404)
    return Response(ChainTxSerializer(tx).data)
