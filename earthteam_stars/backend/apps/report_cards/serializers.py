from rest_framework import serializers
from apps.users.serializers import UserSerializer
from .models import Evidence, ReportCard, Witness


class EvidenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Evidence
        fields = ['id', 'file', 'caption', 'uploaded_at']


class WitnessSerializer(serializers.ModelSerializer):
    class Meta:
        model = Witness
        fields = ['id', 'name', 'email', 'contact']


class ReportCardSerializer(serializers.ModelSerializer):
    submitter = UserSerializer(read_only=True)
    evidence = EvidenceSerializer(many=True, read_only=True)
    witnesses = WitnessSerializer(many=True, read_only=True)

    class Meta:
        model = ReportCard
        fields = [
            'id', 'submitter', 'card_type', 'title', 'description',
            'outputs', 'outcomes', 'status', 'stars_awarded',
            'evidence', 'witnesses', 'created_at', 'updated_at',
        ]
        read_only_fields = ['status', 'stars_awarded', 'submitter']
