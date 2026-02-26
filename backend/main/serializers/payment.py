"""Payment method serializers."""
from rest_framework import serializers
from ..models.payment import PaymentMethod


class PaymentMethodSerializer(serializers.ModelSerializer):
    """Full serializer for PaymentMethod (admin use)."""

    class Meta:
        model = PaymentMethod
        fields = [
            'id', 'type', 'name', 'description', 'icon',
            'fee_type', 'fee_value', 'vat_type', 'vat_value',
            'is_active', 'midtrans_code', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class PaymentMethodPublicSerializer(serializers.ModelSerializer):
    """Public serializer for PaymentMethod (excludes internal config)."""

    class Meta:
        model = PaymentMethod
        fields = [
            'id', 'type', 'name', 'description', 'icon',
            'fee_type', 'fee_value', 'vat_type', 'vat_value',
        ]
        read_only_fields = ['id']
