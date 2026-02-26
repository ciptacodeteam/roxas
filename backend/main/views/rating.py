"""
ProductRating viewsets.
"""
import logging

from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import permissions, viewsets
from rest_framework.filters import OrderingFilter, SearchFilter

from ..models import ProductRating
from ..serializers import ProductRatingCreateSerializer, ProductRatingSerializer
from .permissions import IsAdminOnly

logger = logging.getLogger(__name__)


class ProductRatingViewSet(viewsets.ModelViewSet):
    """
    Public rating API.  Listing is open; creating requires authentication.
    """

    queryset = (
        ProductRating.objects.filter(is_active=True)
        .select_related("product", "user")
        .order_by("-created_at")
    )
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ["product", "rating"]
    ordering_fields = ["created_at", "rating"]

    def get_serializer_class(self):
        if self.action == "create":
            return ProductRatingCreateSerializer
        return ProductRatingSerializer

    def get_permissions(self):
        if self.action == "create":
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class AdminProductRatingViewSet(viewsets.ModelViewSet):
    """Admin API for managing ratings (activate/deactivate)."""

    queryset = (
        ProductRating.objects.all()
        .select_related("product", "user")
        .order_by("-created_at")
    )
    serializer_class = ProductRatingSerializer
    permission_classes = [IsAdminOnly]
    filter_backends = [SearchFilter, DjangoFilterBackend, OrderingFilter]
    search_fields = ["user_name", "comment"]
    filterset_fields = ["product", "rating", "is_active"]
    ordering_fields = ["created_at", "rating"]
