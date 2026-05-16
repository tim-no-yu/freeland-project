import csv

from django.http import HttpResponse, JsonResponse
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import Evidence, ReportCard, Witness
from .serializers import EvidenceSerializer, ReportCardSerializer, WitnessSerializer


@api_view(['GET', 'POST'])
def report_cards(request):
    if request.method == 'GET':
        queryset = ReportCard.objects.all()
        status_filter = request.query_params.get('status')
        type_filter = request.query_params.get('card_type')
        mine = request.query_params.get('mine')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        if type_filter:
            queryset = queryset.filter(card_type=type_filter)
        if mine:
            queryset = queryset.filter(submitter=request.user)
        return Response(ReportCardSerializer(queryset, many=True).data)

    serializer = ReportCardSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=400)
    serializer.save(submitter=request.user, status='draft')
    return Response(serializer.data, status=201)


@api_view(['GET', 'PATCH'])
def report_card_detail(request, card_id):
    try:
        card = ReportCard.objects.get(id=card_id)
    except ReportCard.DoesNotExist:
        return Response({'error': 'Not found'}, status=404)

    if request.method == 'GET':
        return Response(ReportCardSerializer(card).data)

    if card.submitter != request.user:
        return Response({'error': 'Only the submitter can edit this card'}, status=403)
    if card.status != 'draft':
        return Response({'error': 'Only drafts can be edited'}, status=400)
    serializer = ReportCardSerializer(card, data=request.data, partial=True)
    if not serializer.is_valid():
        return Response(serializer.errors, status=400)
    serializer.save()
    return Response(serializer.data)


@api_view(['POST'])
def submit_card(request, card_id):
    try:
        card = ReportCard.objects.get(id=card_id)
    except ReportCard.DoesNotExist:
        return Response({'error': 'Not found'}, status=404)

    if card.submitter != request.user:
        return Response({'error': 'Only the submitter can submit this card'}, status=403)
    if card.status != 'draft':
        return Response({'error': 'Only drafts can be submitted'}, status=400)

    card.status = 'pending'
    card.save()
    return Response(ReportCardSerializer(card).data)


@api_view(['POST'])
def upload_evidence(request, card_id):
    try:
        card = ReportCard.objects.get(id=card_id)
    except ReportCard.DoesNotExist:
        return Response({'error': 'Not found'}, status=404)

    if card.submitter != request.user:
        return Response({'error': 'Only the submitter can upload evidence'}, status=403)

    serializer = EvidenceSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=400)
    serializer.save(report_card=card)
    return Response(serializer.data, status=201)


@api_view(['DELETE'])
def delete_evidence(request, evidence_id):
    try:
        item = Evidence.objects.get(id=evidence_id)
    except Evidence.DoesNotExist:
        return Response({'error': 'Not found'}, status=404)

    if item.report_card.submitter != request.user:
        return Response({'error': 'Only the submitter can delete evidence'}, status=403)
    item.delete()
    return Response(status=204)


@api_view(['POST'])
def add_witness(request, card_id):
    try:
        card = ReportCard.objects.get(id=card_id)
    except ReportCard.DoesNotExist:
        return Response({'error': 'Not found'}, status=404)

    if card.submitter != request.user:
        return Response({'error': 'Only the submitter can add witnesses'}, status=403)

    serializer = WitnessSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=400)
    serializer.save(report_card=card)
    return Response(serializer.data, status=201)


@api_view(['DELETE'])
def delete_witness(request, witness_id):
    try:
        witness = Witness.objects.get(id=witness_id)
    except Witness.DoesNotExist:
        return Response({'error': 'Not found'}, status=404)

    if witness.report_card.submitter != request.user:
        return Response({'error': 'Only the submitter can remove witnesses'}, status=403)
    witness.delete()
    return Response(status=204)


TIER_ORDER = ['collaboration', 'action', 'impact']


@api_view(['POST'])
def upgrade_tier(request, card_id):
    try:
        card = ReportCard.objects.get(id=card_id)
    except ReportCard.DoesNotExist:
        return Response({'error': 'Not found'}, status=404)

    if card.submitter != request.user:
        return Response({'error': 'Only the submitter can upgrade this card'}, status=403)

    new_tier = request.data.get('card_type')
    if new_tier not in TIER_ORDER:
        return Response({'error': 'Invalid tier. Must be collaboration, action, or impact'}, status=400)

    current_index = TIER_ORDER.index(card.card_type)
    new_index = TIER_ORDER.index(new_tier)

    if new_index <= current_index:
        return Response({'error': f'Card is already at {card.card_type} tier or higher'}, status=400)

    if new_index != current_index + 1:
        return Response({'error': f'Must upgrade one tier at a time. Next tier is {TIER_ORDER[current_index + 1]}'}, status=400)

    card.card_type = new_tier
    card.status = 'pending'
    card.save()
    return Response(ReportCardSerializer(card).data)


@api_view(['GET'])
def export_verified(request):
    export_format = request.query_params.get('type', 'json')
    cards = ReportCard.objects.filter(status='approved')

    fieldnames = ['id', 'title', 'card_type', 'submitter', 'stars_awarded', 'approved_at']
    rows = [
        {
            'id': card.id,
            'title': card.title,
            'card_type': card.card_type,
            'submitter': card.submitter.username,
            'stars_awarded': card.stars_awarded,
            'approved_at': str(card.updated_at),
        }
        for card in cards
    ]

    if export_format == 'csv':
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="verified_cards.csv"'
        writer = csv.DictWriter(response, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)
        return response

    return JsonResponse(rows, safe=False)
