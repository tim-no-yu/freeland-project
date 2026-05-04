from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from apps.report_cards.models import ReportCard
from apps.verifications.models import Verification
from .models import User
from .serializers import RegisterSerializer, UserSerializer


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    serializer = RegisterSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=400)
    serializer.save()
    return Response(serializer.data, status=201)


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def me(request):
    if request.method == 'GET':
        return Response(UserSerializer(request.user).data)
    serializer = UserSerializer(request.user, data=request.data, partial=True)
    if not serializer.is_valid():
        return Response(serializer.errors, status=400)
    serializer.save()
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    user = request.user

    if user.role == 'reporter':
        cards = ReportCard.objects.filter(submitter=user)
        return Response({
            'total_submitted': cards.count(),
            'pending': cards.filter(status='pending').count(),
            'approved': cards.filter(status='approved').count(),
            'rejected': cards.filter(status='rejected').count(),
            'total_stars': sum(c.stars_awarded or 0 for c in cards.filter(status='approved')),
        })

    if user.role == 'verifier':
        verifications = Verification.objects.filter(verifier=user)
        total = verifications.count()
        approvals = verifications.filter(decision='approve').count()
        return Response({
            'queue_size': ReportCard.objects.filter(status='pending').count(),
            'total_verified': total,
            'approved': approvals,
            'rejected': verifications.filter(decision='reject').count(),
            'approval_rate': round((approvals / total * 100), 1) if total else 0,
        })

    return Response({
        'total_cards': ReportCard.objects.count(),
        'pending': ReportCard.objects.filter(status='pending').count(),
        'approved': ReportCard.objects.filter(status='approved').count(),
        'rejected': ReportCard.objects.filter(status='rejected').count(),
        'total_verifications': Verification.objects.count(),
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def verifier_reputation(request, verifier_id):
    try:
        verifier = User.objects.get(id=verifier_id, role='verifier')
    except User.DoesNotExist:
        return Response({'error': 'Verifier not found'}, status=404)

    verifications = Verification.objects.filter(verifier=verifier)
    total = verifications.count()
    approvals = verifications.filter(decision='approve').count()
    avg_score = (
        sum(v.score for v in verifications) / total if total else 0
    )

    return Response({
        'id': verifier.id,
        'username': verifier.username,
        'total_verified': total,
        'approved': approvals,
        'rejected': total - approvals,
        'approval_rate': round((approvals / total * 100), 1) if total else 0,
        'average_score_given': round(avg_score, 1),
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_verifiers(request):
    verifiers = User.objects.filter(role='verifier')
    result = []
    for v in verifiers:
        total = Verification.objects.filter(verifier=v).count()
        approvals = Verification.objects.filter(verifier=v, decision='approve').count()
        result.append({
            'id': v.id,
            'username': v.username,
            'total_verified': total,
            'approval_rate': round((approvals / total * 100), 1) if total else 0,
        })
    return Response(result)
