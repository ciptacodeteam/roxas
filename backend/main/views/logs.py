"""
Admin-only logging viewsets (ApiLog, AuditLog, EmailQueue).
"""
import logging

from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.response import Response

from ..models import ApiLog, AuditLog, EmailQueue
from ..serializers import ApiLogSerializer, AuditLogSerializer, EmailQueueSerializer
from .permissions import IsAdminOnly

logger = logging.getLogger(__name__)


class AdminApiLogViewSet(viewsets.ReadOnlyModelViewSet):
    """Read-only API-log viewer for staff."""

    queryset = ApiLog.objects.all().order_by("-created_at")
    serializer_class = ApiLogSerializer
    permission_classes = [IsAdminOnly]
    filter_backends = [SearchFilter, DjangoFilterBackend, OrderingFilter]
    search_fields = ["endpoint", "ref_id"]
    filterset_fields = ["provider", "status"]
    ordering_fields = ["created_at", "response_time"]


class AdminAuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """Read-only audit-log viewer for staff."""

    queryset = AuditLog.objects.all().select_related("user").order_by("-created_at")
    serializer_class = AuditLogSerializer
    permission_classes = [IsAdminOnly]
    filter_backends = [SearchFilter, DjangoFilterBackend, OrderingFilter]
    search_fields = ["entity_type", "entity_id", "user__email"]
    filterset_fields = ["entity_type", "action"]
    ordering_fields = ["created_at"]


class AdminEmailQueueViewSet(viewsets.ModelViewSet):
    """Admin API for viewing and retrying queued emails."""

    queryset = EmailQueue.objects.all().order_by("-created_at")
    serializer_class = EmailQueueSerializer
    permission_classes = [IsAdminOnly]
    filter_backends = [SearchFilter, DjangoFilterBackend, OrderingFilter]
    search_fields = ["to", "subject"]
    filterset_fields = ["status", "priority"]
    ordering_fields = ["created_at", "scheduled_for", "attempts"]

    @action(detail=True, methods=["post"])
    def retry(self, request, pk=None):
        """Reset a failed or pending email so it will be retried."""
        email = self.get_object()
        if email.status == "SENT":
            return Response({"error": "Email already sent"}, status=status.HTTP_400_BAD_REQUEST)

        email.status = "PENDING"
        email.attempts = 0
        email.last_error = None
        email.save()
        # TODO: Trigger email sending via Celery task
        return Response(EmailQueueSerializer(email).data)
