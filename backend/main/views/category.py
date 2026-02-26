"""
Category viewsets.
"""
import logging

from django.db.models import Count, Q
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import permissions, viewsets
from rest_framework.filters import OrderingFilter, SearchFilter

from ..models import Category, CategoryInstructionImage
from ..serializers import (
    CategoryInstructionImageSerializer,
    CategoryListSerializer,
    CategorySerializer,
)
from .permissions import IsAdminOnly

logger = logging.getLogger(__name__)


def _category_qs(base_qs):
    """Annotate a Category queryset with active_product_count to avoid N+1."""
    return base_qs.annotate(
        active_product_count=Count(
            "products", filter=Q(products__is_active=True), distinct=True
        )
    )


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Public read-only API for active categories.
    Slug-based lookup.  Lists use CategoryListSerializer (with product count).
    """

    permission_classes = [permissions.AllowAny]
    lookup_field = "slug"

    def get_queryset(self):
        return _category_qs(
            Category.objects.filter(is_active=True)
        ).order_by("sort_order", "name")

    def get_serializer_class(self):
        if self.action == "list":
            return CategoryListSerializer
        return CategorySerializer


class AdminCategoryViewSet(viewsets.ModelViewSet):
    """
    Admin full-CRUD API for categories.
    """

    permission_classes = [IsAdminOnly]
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ["name", "slug", "description"]
    ordering_fields = ["name", "sort_order", "created_at"]

    def get_queryset(self):
        return _category_qs(Category.objects.all()).order_by("sort_order", "name")

    def get_serializer_class(self):
        return CategorySerializer


class AdminCategoryInstructionImageViewSet(viewsets.ModelViewSet):
    """
    Admin API for category instruction images.
    """

    queryset = CategoryInstructionImage.objects.all().order_by("category", "sort_order")
    serializer_class = CategoryInstructionImageSerializer
    permission_classes = [IsAdminOnly]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ["category"]
    ordering_fields = ["sort_order", "created_at"]
