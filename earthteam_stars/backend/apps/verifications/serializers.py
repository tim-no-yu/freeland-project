from rest_framework import serializers
from apps.users.serializers import UserSerializer
from .models import Verification


class VerificationSerializer(serializers.ModelSerializer):
    verifier = UserSerializer(read_only=True)

    class Meta:
        model = Verification
        fields = ['id', 'verifier', 'score', 'comment', 'decision', 'created_at']
