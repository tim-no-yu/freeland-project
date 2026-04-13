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
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        if type_filter:
            queryset = queryset.filter(card_type=type_filter)
        serializer = ReportCardSerializer(queryset, many=True)
        return Response(serializer.data)

    serializer = ReportCardSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=400)
    serializer.save(submitter=request.user, status='pending')
    return Response(serializer.data, status=201)


@api_view(['GET', 'PATCH'])
def report_card_detail(request, card_id):
    try:
        card = ReportCard.objects.get(id=card_id)
    except ReportCard.DoesNotExist:
        return Response({'error': 'Not found'}, status=404)

    if request.method == 'GET':
        return Response(ReportCardSerializer(card).data)

    if card.status != 'draft':
        return Response({'error': 'Only drafts can be edited'}, status=400)
    serializer = ReportCardSerializer(card, data=request.data, partial=True)
    if not serializer.is_valid():
        return Response(serializer.errors, status=400)
    serializer.save()
    return Response(serializer.data)


@api_view(['POST'])
def upload_evidence(request, card_id):
    try:
        card = ReportCard.objects.get(id=card_id)
    except ReportCard.DoesNotExist:
        return Response({'error': 'Not found'}, status=404)

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
    item.delete()
    return Response(status=204)


@api_view(['POST'])
def add_witness(request, card_id):
    try:
        card = ReportCard.objects.get(id=card_id)
    except ReportCard.DoesNotExist:
        return Response({'error': 'Not found'}, status=404)
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
    witness.delete()
    return Response(status=204)


@api_view(['GET'])
def export_verified(request):
    export_format = request.query_params.get('format', 'json')
    cards = ReportCard.objects.filter(status='approved')

    rows = []
    for card in cards:
        rows.append({
            'id': card.id,
            'title': card.title,
            'card_type': card.card_type,
            'submitter': card.submitter.username,
            'stars_awarded': card.stars_awarded,
            'approved_at': str(card.updated_at),
        })

    if export_format == 'csv':
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="verified_cards.csv"'
        writer = csv.DictWriter(response, fieldnames=rows[0].keys() if rows else [])
        writer.writeheader()
        writer.writerows(rows)
        return response

    return JsonResponse(rows, safe=False)
