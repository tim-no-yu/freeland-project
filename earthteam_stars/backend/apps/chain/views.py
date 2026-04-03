from rest_framework.decorators import api_view
from rest_framework.response import Response

from apps.report_cards.models import ReportCard
from .models import ChainTx
from .serializers import ChainTxSerializer


@api_view(['POST'])
def issue_chain_tx(request, card_id):
    try:
        card = ReportCard.objects.get(id=card_id, status='approved')
    except ReportCard.DoesNotExist:
        return Response({'error': 'Approved card not found'}, status=404)

    tx = ChainTx.objects.create(
        report_card=card,
        tx_signature=request.data.get('tx_signature'),
        memo_hash=request.data.get('memo_hash'),
        explorer_url=request.data.get('explorer_url'),
    )
    return Response(ChainTxSerializer(tx).data, status=201)


@api_view(['GET'])
def get_chain_tx(request, card_id):
    try:
        tx = ChainTx.objects.get(report_card_id=card_id)
    except ChainTx.DoesNotExist:
        return Response({'error': 'No transaction found for this card'}, status=404)
    return Response(ChainTxSerializer(tx).data)
