from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.users.permissions import IsAdmin
from .models import ScoringRule
from .serializers import ScoringRuleSerializer


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def scoring_rules(request):
    rules = ScoringRule.objects.all()
    return Response(ScoringRuleSerializer(rules, many=True).data)


@api_view(['PATCH'])
@permission_classes([IsAdmin])
def update_scoring_rule(request, rule_id):
    try:
        rule = ScoringRule.objects.get(id=rule_id)
    except ScoringRule.DoesNotExist:
        return Response({'error': 'Not found'}, status=404)
    serializer = ScoringRuleSerializer(rule, data=request.data, partial=True)
    if not serializer.is_valid():
        return Response(serializer.errors, status=400)
    serializer.save(updated_by=request.user)
    return Response(serializer.data)
