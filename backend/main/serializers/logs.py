"""Log serializers: ApiLog, AuditLog, EmailQueue."""
from rest_framework import serializers
from ..models.logs import ApiLog, AuditLog, EmailQueue


class ApiLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = ApiLog
        fields = [
            'id', 'provider', 'endpoint', 'method', 'status', 'status_code',
            'response_time', 'error_message', 'request_data', 'response_data',
            'order_id', 'ref_id', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class AuditLogSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source='user.email', read_only=True)

    class Meta:
        model = AuditLog
        fields = [
            'id', 'entity_type', 'entity_id', 'action', 'user',
            'user_email', 'changes', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class EmailQueueSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmailQueue
        fields = [
            'id', 'to', 'subject', 'html', 'text', 'status', 'priority',
            'scheduled_for', 'sent_at', 'attempts', 'max_attempts',
            'last_error', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'sent_at', 'attempts', 'created_at', 'updated_at']
