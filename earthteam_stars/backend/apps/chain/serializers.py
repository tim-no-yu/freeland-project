from rest_framework import serializers
from .models import ChainTx


class ChainTxSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChainTx
        fields = ['id', 'tx_signature', 'memo_hash', 'explorer_url', 'issued_at']
