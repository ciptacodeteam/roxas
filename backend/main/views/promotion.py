"""
Promotion viewsets: Coupon, FlashSale, MarketingBanner.
"""
import logging

from django.db.models import Q
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter, SearchFilter
from rest_framework.response import Response

from ..models import Coupon, CouponUsage, FlashSale, FlashSaleItem, MarketingBanner
from ..serializers import (
    CouponSerializer,
    CouponUsageSerializer,
    CouponValidationSerializer,
    FlashSaleItemSerializer,
    FlashSaleSerializer,
    MarketingBannerSerializer,
)
from .permissions import IsAdminOnly

logger = logging.getLogger(__name__)


class CouponViewSet(viewsets.GenericViewSet):
    """
    Public coupon API: list, validate, and find applicable coupons.
    """

    permission_classes = [permissions.AllowAny]
    serializer_class = CouponValidationSerializer

    def _active_coupons(self):
        now = timezone.now()
        return Coupon.objects.filter(
            is_active=True
        ).filter(
            Q(start_date__isnull=True) | Q(start_date__lte=now)
        ).filter(
            Q(end_date__isnull=True) | Q(end_date__gte=now)
        )

    def list(self, request):
        """List all currently active coupons."""
        serializer = CouponSerializer(self._active_coupons().order_by("-created_at"), many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["post"])
    def applicable(self, request):
        """Return all active coupons plus a list of IDs applicable for the given amount."""
        order_amount = request.data.get("order_amount", 0)
        user_id = request.data.get("user_id")

        coupons = self._active_coupons()
        applicable_ids, all_data = [], []

        for coupon in coupons:
            if coupon.usage_limit and coupon.usage_count >= coupon.usage_limit:
                continue
            is_applicable = True
            if user_id and coupon.user_limit:
                used = CouponUsage.objects.filter(coupon=coupon, user_id=user_id).count()
                if used >= coupon.user_limit:
                    is_applicable = False
            if coupon.min_purchase and order_amount < coupon.min_purchase:
                is_applicable = False

            all_data.append(CouponSerializer(coupon).data)
            if is_applicable:
                applicable_ids.append(str(coupon.id))

        return Response({"coupons": all_data, "applicable_ids": applicable_ids})

    @action(detail=False, methods=["post"])
    def validate(self, request):
        """Validate a coupon code and return discount details."""
        ser = self.get_serializer(data=request.data)
        ser.is_valid(raise_exception=True)

        code = ser.validated_data["code"]
        order_amount = ser.validated_data["order_amount"]
        user_id = ser.validated_data.get("user_id")
        now = timezone.now()

        try:
            coupon = Coupon.objects.get(code=code)
        except Coupon.DoesNotExist:
            return Response(
                {"valid": False, "error": "Kode kupon tidak valid"},
                status=status.HTTP_404_NOT_FOUND,
            )

        if not coupon.is_active:
            return Response({"valid": False, "error": "Kupon tidak aktif"}, status=status.HTTP_400_BAD_REQUEST)
        if coupon.start_date and now < coupon.start_date:
            return Response({"valid": False, "error": "Kupon belum dapat digunakan"}, status=status.HTTP_400_BAD_REQUEST)
        if coupon.end_date and now > coupon.end_date:
            return Response({"valid": False, "error": "Kupon sudah kadaluarsa"}, status=status.HTTP_400_BAD_REQUEST)
        if coupon.usage_limit and coupon.usage_count >= coupon.usage_limit:
            return Response({"valid": False, "error": "Kupon sudah habis digunakan"}, status=status.HTTP_400_BAD_REQUEST)
        if user_id and coupon.user_limit:
            used = CouponUsage.objects.filter(coupon=coupon, user_id=user_id).count()
            if used >= coupon.user_limit:
                return Response(
                    {"valid": False, "error": "Anda sudah mencapai batas penggunaan kupon ini"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        if coupon.min_purchase and order_amount < coupon.min_purchase:
            return Response(
                {"valid": False, "error": f"Minimal pembelian Rp {coupon.min_purchase:,}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if coupon.discount_type == "PERCENTAGE":
            discount = int(order_amount * coupon.discount_value / 100)
            if coupon.max_discount:
                discount = min(discount, coupon.max_discount)
        else:
            discount = int(coupon.discount_value)

        return Response(
            {
                "valid": True,
                "coupon": CouponSerializer(coupon).data,
                "discount_amount": discount,
                "final_amount": order_amount - discount,
            }
        )


class AdminCouponViewSet(viewsets.ModelViewSet):
    """Admin full-CRUD API for coupons."""

    queryset = Coupon.objects.all().order_by("-created_at")
    serializer_class = CouponSerializer
    permission_classes = [IsAdminOnly]
    filter_backends = [SearchFilter, OrderingFilter, DjangoFilterBackend]
    search_fields = ["code", "description"]
    filterset_fields = ["is_active", "discount_type"]
    ordering_fields = ["code", "created_at", "end_date"]


class FlashSaleViewSet(viewsets.ReadOnlyModelViewSet):
    """Public read-only API for currently active flash sales."""

    serializer_class = FlashSaleSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        now = timezone.now()
        return (
            FlashSale.objects.filter(is_active=True, start_time__lte=now, end_time__gte=now)
            .prefetch_related("items__product_item")
            .order_by("-start_time")
        )


class AdminFlashSaleViewSet(viewsets.ModelViewSet):
    """Admin full-CRUD API for flash sales."""

    queryset = FlashSale.objects.all().order_by("-created_at")
    serializer_class = FlashSaleSerializer
    permission_classes = [IsAdminOnly]
    filter_backends = [SearchFilter, OrderingFilter, DjangoFilterBackend]
    search_fields = ["name"]
    filterset_fields = ["is_active"]
    ordering_fields = ["name", "start_time", "created_at"]


class AdminFlashSaleItemViewSet(viewsets.ModelViewSet):
    """Admin full-CRUD API for individual flash sale items."""

    serializer_class = FlashSaleItemSerializer
    permission_classes = [IsAdminOnly]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ["flash_sale", "product_item"]
    search_fields = ["product_item__name", "product_item__product__name"]
    ordering_fields = ["sale_price", "stock", "sold_count"]
    ordering = ["-flash_sale__start_time", "product_item__name"]

    def get_queryset(self):
        return FlashSaleItem.objects.select_related(
            "flash_sale",
            "product_item",
            "product_item__product",
        ).prefetch_related("product_item__product__category")

    def perform_create(self, serializer):
        instance = serializer.save()
        logger.info(
            "Flash sale item created: %s added to %s at Rp %s",
            instance.product_item.name,
            instance.flash_sale.name,
            f"{instance.sale_price:,}",
        )

    def perform_update(self, serializer):
        instance = serializer.save()
        logger.info("Flash sale item updated: %s in %s", instance.product_item.name, instance.flash_sale.name)

    def perform_destroy(self, instance):
        flash_sale_name = instance.flash_sale.name
        product_name = instance.product_item.name
        instance.delete()
        logger.info("Flash sale item deleted: %s removed from %s", product_name, flash_sale_name)


class MarketingBannerViewSet(viewsets.ReadOnlyModelViewSet):
    """Public read-only API for active marketing banners."""

    serializer_class = MarketingBannerSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        now = timezone.now()
        return MarketingBanner.objects.filter(
            is_active=True
        ).filter(
            Q(start_date__isnull=True) | Q(start_date__lte=now)
        ).filter(
            Q(end_date__isnull=True) | Q(end_date__gte=now)
        ).order_by("sort_order")


class AdminMarketingBannerViewSet(viewsets.ModelViewSet):
    """Admin full-CRUD API for marketing banners."""

    queryset = MarketingBanner.objects.all().order_by("sort_order", "-created_at")
    serializer_class = MarketingBannerSerializer
    permission_classes = [IsAdminOnly]
    filter_backends = [SearchFilter, OrderingFilter, DjangoFilterBackend]
    search_fields = ["title", "description"]
    filterset_fields = ["is_active"]
    ordering_fields = ["title", "sort_order", "created_at"]
