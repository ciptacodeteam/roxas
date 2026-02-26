"""
main.views package
==================
Re-exports every ViewSet and permission class so existing imports remain valid.
"""

from .permissions import IsAdminOnly, IsAdminOrReadOnly, IsOwnerOrAdmin

from .payment import AdminPaymentMethodViewSet, PaymentMethodViewSet

from .category import (
    AdminCategoryInstructionImageViewSet,
    AdminCategoryViewSet,
    CategoryViewSet,
)

from .product import (
    AdminPriceSyncViewSet,
    AdminProductItemViewSet,
    AdminProductViewSet,
    ProductItemViewSet,
    ProductViewSet,
)

from .promotion import (
    AdminCouponViewSet,
    AdminFlashSaleItemViewSet,
    AdminFlashSaleViewSet,
    AdminMarketingBannerViewSet,
    CouponViewSet,
    FlashSaleViewSet,
    MarketingBannerViewSet,
)

from .order import AdminOrderViewSet, OrderViewSet, PaymentViewSet

from .rating import AdminProductRatingViewSet, ProductRatingViewSet

from .logs import AdminApiLogViewSet, AdminAuditLogViewSet, AdminEmailQueueViewSet

__all__ = [
    # permissions
    "IsAdminOnly",
    "IsAdminOrReadOnly",
    "IsOwnerOrAdmin",
    # payment
    "PaymentMethodViewSet",
    "AdminPaymentMethodViewSet",
    # category
    "CategoryViewSet",
    "AdminCategoryViewSet",
    "AdminCategoryInstructionImageViewSet",
    # product
    "ProductViewSet",
    "ProductItemViewSet",
    "AdminProductViewSet",
    "AdminProductItemViewSet",
    "AdminPriceSyncViewSet",
    # promotion
    "CouponViewSet",
    "AdminCouponViewSet",
    "FlashSaleViewSet",
    "AdminFlashSaleViewSet",
    "AdminFlashSaleItemViewSet",
    "MarketingBannerViewSet",
    "AdminMarketingBannerViewSet",
    # order / payment
    "OrderViewSet",
    "AdminOrderViewSet",
    "PaymentViewSet",
    # rating
    "ProductRatingViewSet",
    "AdminProductRatingViewSet",
    # logs
    "AdminApiLogViewSet",
    "AdminAuditLogViewSet",
    "AdminEmailQueueViewSet",
]
