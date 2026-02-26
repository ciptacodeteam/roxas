"""
Payment-method viewsets.
"""
import logging

from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import permissions, viewsets
from rest_framework.filters import OrderingFilter, SearchFilter

from ..models import PaymentMethod
from ..serializers import PaymentMethodPublicSerializer, PaymentMethodSerializer
from .permissions import IsAdminOnly

logger = logging.getLogger(__name__)


class PaymentMethodViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Public read-only API for active payment methods.
    """

    queryset = PaymentMethod.objects.filter(is_active=True).order_by("type", "name")
    serializer_class = PaymentMethodPublicSerializer
    permission_classes = [permissions.AllowAny]


class AdminPaymentMethodViewSet(viewsets.ModelViewSet):
    """
    Admin full-CRUD API for payment methods.
    """

    queryset = PaymentMethod.objects.all().order_by("-created_at")
    serializer_class = PaymentMethodSerializer
    permission_classes = [IsAdminOnly]
    filter_backends = [SearchFilter, OrderingFilter, DjangoFilterBackend]
    search_fields = ["name", "midtrans_code"]
    filterset_fields = ["type", "is_active"]
    ordering_fields = ["name", "created_at", "type"]
