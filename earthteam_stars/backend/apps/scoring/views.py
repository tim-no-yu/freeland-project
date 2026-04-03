from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import ScoringRule
from .serializers import ScoringRuleSerializer


@api_view(['GET'])
def scoring_rules(request):
    rules = ScoringRule.objects.all()
    return Response(ScoringRuleSerializer(rules, many=True).data)


@api_view(['PATCH'])
def update_scoring_rule(request, rule_id):
    if request.user.role != 'admin':
        return Response({'error': 'Only admins can update scoring rules'}, status=403)
    try:
        rule = ScoringRule.objects.get(id=rule_id)
    except ScoringRule.DoesNotExist:
        return Response({'error': 'Not found'}, status=404)
    serializer = ScoringRuleSerializer(rule, data=request.data, partial=True)
    if not serializer.is_valid():
        return Response(serializer.errors, status=400)
    serializer.save(updated_by=request.user)
    return Response(serializer.data)
