"""
main.models package
===================
Re-exports every model and choice class from the sub-modules.
Consuming code continues to use ``from main.models import Foo`` unchanged.
"""

# ── Choices / enums ──────────────────────────────────────────────────────────
from .choices import (
    PaymentStatus,
    DigiflazzStatus,
    DigiflazzItemStatus,
    PriceSyncStatus,
    PriceSyncType,
    FeeType,
    PaymentMethodType,
    OrderStatus,
    ApiProvider,
    ApiLogStatus,
    DiscountType,
    EmailStatus,
    EmailPriority,
)

# ── Abstract base ─────────────────────────────────────────────────────────────
from .base import UUIDModel

# ── Payment ───────────────────────────────────────────────────────────────────
from .payment import PaymentMethod

# ── Products ──────────────────────────────────────────────────────────────────
from .product import (
    Category,
    CategoryInstructionImage,
    Product,
    ProductItem,
    PriceSync,
)

# ── Promotions ────────────────────────────────────────────────────────────────
from .promotion import (
    Coupon,
    CouponUsage,
    FlashSale,
    FlashSaleItem,
    MarketingBanner,
)

# ── Orders ────────────────────────────────────────────────────────────────────
from .order import Order, Payment

# ── Digiflazz transactions ────────────────────────────────────────────────────
from .transaction import DigiflazzTransaction, DigiflazzAccountCheck

# ── Ratings ───────────────────────────────────────────────────────────────────
from .rating import ProductRating

# ── Logs ──────────────────────────────────────────────────────────────────────
from .logs import ApiLog, AuditLog, EmailQueue

__all__ = [
    # choices
    "PaymentStatus",
    "DigiflazzStatus",
    "DigiflazzItemStatus",
    "PriceSyncStatus",
    "PriceSyncType",
    "FeeType",
    "PaymentMethodType",
    "OrderStatus",
    "ApiProvider",
    "ApiLogStatus",
    "DiscountType",
    "EmailStatus",
    "EmailPriority",
    # base
    "UUIDModel",
    # payment
    "PaymentMethod",
    # product
    "Category",
    "CategoryInstructionImage",
    "Product",
    "ProductItem",
    "PriceSync",
    # promotion
    "Coupon",
    "CouponUsage",
    "FlashSale",
    "FlashSaleItem",
    "MarketingBanner",
    # order
    "Order",
    "Payment",
    # transaction
    "DigiflazzTransaction",
    "DigiflazzAccountCheck",
    # rating
    "ProductRating",
    # logs
    "ApiLog",
    "AuditLog",
    "EmailQueue",
]
