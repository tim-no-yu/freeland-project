from django.contrib.auth import authenticate
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from apps.report_cards.models import ReportCard, Evidence, Witness
from apps.verifications.models import Verification
from apps.scoring.engine import compute_stars
from apps.users.models import User
from apps.users.permissions import IsVerifier

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


CATEGORY_TO_INTERVENTION = {
    'wildlife_protection': 'poaching',
    'habitat_protection': 'habitat_protection',
    'regenerative_agriculture': 'regenerative_agriculture',
}

INTERVENTION_TO_CATEGORY = {
    'poaching': 'wildlife_protection',
    'trafficking': 'wildlife_protection',
    'market_demand': 'wildlife_protection',
    'general': 'wildlife_protection',
    'habitat_protection': 'habitat_protection',
    'regenerative_agriculture': 'regenerative_agriculture',
}


def derive_star_level(stars):
    """
    Map a numeric Stars award onto the four-tier display label used by the
    frontend. Thresholds are intentionally simple for the MVP and can be
    promoted into ScoringRule later if leadership wants per-category tiers.
    """
    if not stars or stars <= 0:
        return None
    if stars <= 5:
        return 'copper'
    if stars <= 12:
        return 'silver'
    if stars <= 20:
        return 'gold'
    return 'platinum'


def serialize_user(user):
    return {
        'id': user.id,
        'email': user.email,
        'name': user.username,
        'role': user.role,
        'wallet_address': user.wallet_address or '',
    }


def serialize_evidence(e):
    return {
        'id': e.id,
        'report_card_id': e.report_card_id,
        'file_url': e.file or '',
        'file_name': e.caption or (e.file or '').split('/')[-1],
        'file_type': '',
        'description': e.caption or '',
        'uploaded_at': e.uploaded_at.isoformat() if e.uploaded_at else '',
    }


def serialize_witness(w):
    return {
        'id': w.id,
        'name': w.name,
        'email': w.email or '',
        'organization': w.contact or '',
        'relationship': '',
    }


def serialize_card(card, full=False):
    submitter = card.submitter
    tags_raw = card.tags or ''
    tags = [t.strip() for t in tags_raw.split(',') if t.strip()]
    category = INTERVENTION_TO_CATEGORY.get(card.intervention_type or 'general', 'wildlife_protection')
    status = 'submitted' if card.status == 'pending' else card.status

    data = {
        'id': card.id,
        'type': card.card_type,
        'reporter': {
            'id': submitter.id,
            'name': submitter.username,
            'email': submitter.email,
            'organization': '',
        },
        'title': card.title,
        'description': card.description,
        'category': category,
        'problem_statement': card.problem_statement or '',
        'tags': tags,
        'notes': card.outputs or '',
        'outcomes': card.outcomes or '',
        'results': card.results or '',
        'baseline_description': card.baseline_data or '',
        'geographic_area_sqkm': float(card.geographic_area_sqkm) if card.geographic_area_sqkm is not None else None,
        'location': '',
        'activity_date': None,
        'status': status,
        'verification_stage': card.verification_stage,
        'stars_awarded': card.stars_awarded,
        'star_level': derive_star_level(card.stars_awarded),
        'created_at': card.created_at.isoformat(),
        'updated_at': card.updated_at.isoformat(),
    }

    if full:
        data['evidence'] = [serialize_evidence(e) for e in card.evidence.all()]
        data['witnesses'] = [serialize_witness(w) for w in card.witnesses.all()]
        data['verifications'] = []
        chain = getattr(card, 'chain_tx', None)
        if chain:
            data['chain_record'] = {
                'id': chain.id,
                'report_card_id': card.id,
                'transaction_hash': chain.tx_signature or '',
                'wallet_address': chain.wallet_address or '',
                'token_amount': chain.token_amount or 0,
                'memo': chain.memo_hash or '',
                'network': chain.network or 'devnet',
                'status': chain.status,
                'explorer_url': chain.explorer_url or '',
                'created_at': chain.issued_at.isoformat(),
            }
        else:
            data['chain_record'] = None

    return data


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    value = request.data.get('username') or request.data.get('email', '')
    password = request.data.get('password', '')

    user = authenticate(username=value, password=password)
    if not user:
        try:
            user_obj = User.objects.get(email=value)
            user = authenticate(username=user_obj.username, password=password)
        except User.DoesNotExist:
            pass

    if not user:
        return Response({'error': 'Invalid credentials'}, status=401)

    refresh = RefreshToken.for_user(user)
    return Response({
        'access': str(refresh.access_token),
        'refresh': str(refresh),
    })


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def me(request):
    if request.method == 'GET':
        return Response(serialize_user(request.user))
    wallet = request.data.get('wallet_address')
    if wallet is not None:
        request.user.wallet_address = wallet
        request.user.save()
    return Response(serialize_user(request.user))


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def report_cards(request):
    if request.method == 'GET':
        queryset = ReportCard.objects.select_related('submitter').all()
        status_filter = request.query_params.get('status')
        type_filter = request.query_params.get('type') or request.query_params.get('card_type')
        mine = request.query_params.get('mine')
        if status_filter:
            backend_status = 'pending' if status_filter == 'submitted' else status_filter
            queryset = queryset.filter(status=backend_status)
        if type_filter:
            queryset = queryset.filter(card_type=type_filter)
        if mine:
            queryset = queryset.filter(submitter=request.user)
        return Response([serialize_card(c) for c in queryset])

    data = request.data
    card_type = data.get('type', 'action')
    category = data.get('category', 'wildlife_protection')
    tags = data.get('tags', [])
    tags_str = ','.join(tags) if isinstance(tags, list) else (tags or '')

    card = ReportCard.objects.create(
        submitter=request.user,
        card_type=card_type,
        intervention_type=CATEGORY_TO_INTERVENTION.get(category, 'general'),
        title=data.get('title', ''),
        description=data.get('description', ''),
        problem_statement=data.get('problem_statement', ''),
        outputs=data.get('notes', ''),
        outcomes=data.get('outcomes', ''),
        results=data.get('results', ''),
        tags=tags_str,
        baseline_data=data.get('baseline_description', ''),
        geographic_area_sqkm=data.get('geographic_area_sqkm'),
        status='draft',
    )

    for w in data.get('witnesses', []):
        Witness.objects.create(
            report_card=card,
            name=w.get('name', ''),
            email=w.get('email', ''),
            contact=w.get('organization', ''),
        )

    return Response(serialize_card(card, full=True), status=201)


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def report_card_detail(request, card_id):
    try:
        card = ReportCard.objects.select_related('submitter').get(id=card_id)
    except ReportCard.DoesNotExist:
        return Response({'error': 'Not found'}, status=404)

    if request.method == 'GET':
        return Response(serialize_card(card, full=True))

    if card.submitter != request.user:
        return Response({'error': 'Only the submitter can edit this card'}, status=403)
    if card.status != 'draft':
        return Response({'error': 'Only drafts can be edited'}, status=400)

    data = request.data
    if 'title' in data:
        card.title = data['title']
    if 'description' in data:
        card.description = data['description']
    if 'problem_statement' in data:
        card.problem_statement = data['problem_statement']
    if 'results' in data:
        card.results = data['results']
    if 'outcomes' in data:
        card.outcomes = data['outcomes']
    if 'notes' in data:
        card.outputs = data['notes']
    if 'tags' in data:
        tags = data['tags']
        card.tags = ','.join(tags) if isinstance(tags, list) else (tags or '')
    if 'category' in data:
        card.intervention_type = CATEGORY_TO_INTERVENTION.get(data['category'], 'general')
    if 'geographic_area_sqkm' in data:
        card.geographic_area_sqkm = data['geographic_area_sqkm']
    card.save()
    return Response(serialize_card(card, full=True))


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_card(request, card_id):
    try:
        card = ReportCard.objects.get(id=card_id)
    except ReportCard.DoesNotExist:
        return Response({'error': 'Not found'}, status=404)

    if card.submitter != request.user:
        return Response({'error': 'Only the submitter can submit this card'}, status=403)
    if card.status != 'draft':
        return Response({'error': 'Only drafts can be submitted'}, status=400)

    if card.card_type == 'collaboration':
        card.status = 'approved'
        card.stars_awarded = 1
        card.verification_stage = 'complete'
    else:
        card.status = 'pending'
    card.save()
    return Response(serialize_card(card, full=True))


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def upload_evidence(request, card_id):
    try:
        card = ReportCard.objects.get(id=card_id)
    except ReportCard.DoesNotExist:
        return Response({'error': 'Not found'}, status=404)

    if card.submitter != request.user:
        return Response({'error': 'Only the submitter can upload evidence'}, status=403)

    file = request.FILES.get('file')
    caption = request.data.get('description') or request.data.get('caption', '')

    if not file:
        return Response({'error': 'No file provided'}, status=400)

    evidence = Evidence.objects.create(report_card=card, file=file, caption=caption)
    return Response(serialize_evidence(evidence), status=201)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def verifier_queue(request):
    if request.user.role not in ('verifier', 'admin'):
        return Response({'error': 'Verifiers only'}, status=403)

    card_type = request.query_params.get('type') or request.query_params.get('card_type')
    queryset = ReportCard.objects.select_related('submitter').filter(status='pending')
    if card_type:
        queryset = queryset.filter(card_type=card_type)

    already_verified = set(
        Verification.objects.filter(verifier=request.user)
        .values_list('report_card_id', 'stage')
    )
    result = [c for c in queryset if (c.id, c.verification_stage) not in already_verified]
    return Response([serialize_card(c) for c in result])


@api_view(['POST'])
@permission_classes([IsVerifier])
def submit_review(request):
    card_id = request.data.get('report_card')
    if not card_id:
        return Response({'error': 'report_card is required'}, status=400)

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

    decision = request.data.get('decision')
    if decision not in ('approve', 'reject'):
        return Response({'error': 'decision must be approve or reject'}, status=400)

    scores = request.data.get('scores', {})
    total = sum(scores.values()) if scores else 0
    max_score = len(scores) * 5 if scores else 15
    score = round((total / max_score) * 100) if max_score else 0

    comment = request.data.get('comments', '')

    verification = Verification.objects.create(
        report_card=card,
        verifier=request.user,
        score=score,
        decision=decision,
        comment=comment,
        stage=current_stage,
    )

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

    return Response({
        'id': verification.id,
        'report_card_id': card.id,
        'decision': decision,
        'score': score,
        'comments': comment,
        'created_at': verification.created_at.isoformat(),
    }, status=201)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_verified(request):
    import csv
    from django.http import HttpResponse, JsonResponse

    export_format = request.query_params.get('format', 'json')
    cards = ReportCard.objects.filter(status='approved').select_related('submitter')

    rows = [
        {
            'id': card.id,
            'title': card.title,
            'type': card.card_type,
            'category': INTERVENTION_TO_CATEGORY.get(card.intervention_type or 'general', 'wildlife_protection'),
            'status': 'approved',
            'stars_awarded': card.stars_awarded,
            'submitter': card.submitter.username,
        }
        for card in cards
    ]

    if export_format == 'csv':
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="verified_cards.csv"'
        writer = csv.DictWriter(response, fieldnames=['id', 'title', 'type', 'category', 'status', 'stars_awarded', 'submitter'])
        writer.writeheader()
        writer.writerows(rows)
        return response

    return JsonResponse(rows, safe=False)
