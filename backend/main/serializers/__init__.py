"""
main.serializers package
========================
Re-exports every serializer from sub-modules so existing imports like
``from main.serializers import OrderSerializer`` continue to work.
"""

from .payment import PaymentMethodSerializer, PaymentMethodPublicSerializer

from .product import (
    CategoryInstructionImageSerializer,
    CategorySerializer,
    CategoryListSerializer,
    ProductItemPublicSerializer,
    ProductItemSerializer,
    ProductSerializer,
    ProductListSerializer,
    PriceSyncSerializer,
)

from .promotion import (
    CouponSerializer,
    CouponValidationSerializer,
    CouponUsageSerializer,
    FlashSaleItemSerializer,
    FlashSaleSerializer,
    MarketingBannerSerializer,
)

from .order import (
    OrderListSerializer,
    OrderSerializer,
    OrderCreateSerializer,
    PaymentSerializer,
    PaymentPublicSerializer,
    DigiflazzTransactionSerializer,
)

from .rating import ProductRatingSerializer, ProductRatingCreateSerializer

from .logs import ApiLogSerializer, AuditLogSerializer, EmailQueueSerializer

__all__ = [
    "PaymentMethodSerializer",
    "PaymentMethodPublicSerializer",
    "CategoryInstructionImageSerializer",
    "CategorySerializer",
    "CategoryListSerializer",
    "ProductItemPublicSerializer",
    "ProductItemSerializer",
    "ProductSerializer",
    "ProductListSerializer",
    "PriceSyncSerializer",
    "CouponSerializer",
    "CouponValidationSerializer",
    "CouponUsageSerializer",
    "FlashSaleItemSerializer",
    "FlashSaleSerializer",
    "MarketingBannerSerializer",
    "OrderListSerializer",
    "OrderSerializer",
    "OrderCreateSerializer",
    "PaymentSerializer",
    "PaymentPublicSerializer",
    "DigiflazzTransactionSerializer",
    "ProductRatingSerializer",
    "ProductRatingCreateSerializer",
    "ApiLogSerializer",
    "AuditLogSerializer",
    "EmailQueueSerializer",
]
