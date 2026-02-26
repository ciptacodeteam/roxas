"""Promotion-related models: Coupon, CouponUsage, FlashSale, FlashSaleItem, MarketingBanner."""
from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator
from django.utils.translation import gettext_lazy as _

from .base import UUIDModel
from .choices import DiscountType


class Coupon(UUIDModel):
    """Discount coupon."""

    code = models.CharField(
        max_length=50,
        unique=True,
        verbose_name=_("Coupon Code"),
        help_text=_('e.g., "WELCOME10"'),
    )
    description = models.TextField(blank=True, verbose_name=_("Description"))
    discount_type = models.CharField(
        max_length=15,
        choices=DiscountType.choices,
        verbose_name=_("Discount Type"),
    )
    discount_value = models.IntegerField(
        validators=[MinValueValidator(0)],
        verbose_name=_("Discount Value"),
        help_text=_("Percentage or fixed amount in IDR"),
    )
    min_purchase = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0)],
        verbose_name=_("Minimum Purchase"),
        help_text=_("Minimum purchase amount to use coupon (in IDR)"),
    )
    max_discount = models.IntegerField(
        blank=True,
        null=True,
        validators=[MinValueValidator(0)],
        verbose_name=_("Maximum Discount"),
        help_text=_("Maximum discount amount (for percentage coupons)"),
    )
    usage_limit = models.IntegerField(
        blank=True,
        null=True,
        validators=[MinValueValidator(1)],
        verbose_name=_("Usage Limit"),
        help_text=_("Total usage limit (null = unlimited)"),
    )
    usage_count = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0)],
        verbose_name=_("Usage Count"),
    )
    user_limit = models.IntegerField(
        default=1,
        blank=True,
        null=True,
        validators=[MinValueValidator(1)],
        verbose_name=_("User Limit"),
        help_text=_("Limit per user (null = unlimited per user)"),
    )
    is_active = models.BooleanField(default=True, verbose_name=_("Is Active"))
    start_date = models.DateTimeField(blank=True, null=True, verbose_name=_("Start Date"))
    end_date = models.DateTimeField(blank=True, null=True, verbose_name=_("End Date"))
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _("Coupon")
        verbose_name_plural = _("Coupons")
        ordering = ["-created_at"]
        db_table = "coupons"
        indexes = [
            models.Index(fields=["is_active"]),
            models.Index(fields=["end_date"]),
            models.Index(fields=["code"]),
            models.Index(fields=["is_active", "end_date", "created_at"]),
        ]

    def __str__(self):
        return f"{self.code} ({self.get_discount_type_display()})"


class CouponUsage(UUIDModel):
    """Track coupon usage per order."""

    coupon = models.ForeignKey(
        Coupon,
        on_delete=models.CASCADE,
        related_name="usages",
        verbose_name=_("Coupon"),
    )
    order = models.OneToOneField(
        "main.Order",
        on_delete=models.CASCADE,
        related_name="coupon_usage",
        verbose_name=_("Order"),
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="coupon_usages_main",
        verbose_name=_("User"),
    )
    discount_amount = models.IntegerField(
        validators=[MinValueValidator(0)],
        verbose_name=_("Discount Amount"),
        help_text=_("Actual discount applied (in IDR)"),
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _("Coupon Usage")
        verbose_name_plural = _("Coupon Usages")
        ordering = ["-created_at"]
        db_table = "coupon_usages"
        indexes = [
            models.Index(fields=["coupon"]),
            models.Index(fields=["user"]),
            models.Index(fields=["order"]),
        ]

    def __str__(self):
        return f"{self.coupon.code} - {self.user.email}"


class FlashSale(UUIDModel):
    """Flash sale event."""

    name = models.CharField(max_length=200, verbose_name=_("Flash Sale Name"))
    start_time = models.DateTimeField(verbose_name=_("Start Time"))
    end_time = models.DateTimeField(verbose_name=_("End Time"))
    is_active = models.BooleanField(default=True, verbose_name=_("Is Active"))
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _("Flash Sale")
        verbose_name_plural = _("Flash Sales")
        ordering = ["-start_time"]
        db_table = "flash_sales"
        indexes = [
            models.Index(fields=["is_active"]),
            models.Index(fields=["start_time"]),
            models.Index(fields=["end_time"]),
            models.Index(fields=["is_active", "end_time", "start_time"]),
        ]

    def __str__(self):
        return f"{self.name} ({self.start_time.date()})"


class FlashSaleItem(UUIDModel):
    """Product item in flash sale."""

    flash_sale = models.ForeignKey(
        FlashSale,
        on_delete=models.CASCADE,
        related_name="items",
        verbose_name=_("Flash Sale"),
    )
    product_item = models.ForeignKey(
        "main.ProductItem",
        on_delete=models.RESTRICT,
        related_name="flash_sale_items",
        verbose_name=_("Product Item"),
    )
    sale_price = models.IntegerField(
        validators=[MinValueValidator(0)],
        verbose_name=_("Sale Price"),
        help_text=_("Discounted price (in IDR)"),
    )
    stock = models.IntegerField(
        validators=[MinValueValidator(0)],
        verbose_name=_("Stock"),
        help_text=_("Limited stock for flash sale"),
    )
    sold_count = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0)],
        verbose_name=_("Sold Count"),
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _("Flash Sale Item")
        verbose_name_plural = _("Flash Sale Items")
        ordering = ["flash_sale", "product_item"]
        db_table = "flash_sale_items"
        constraints = [
            models.UniqueConstraint(
                fields=["flash_sale", "product_item"],
                name="unique_flash_sale_product_item"
            )
        ]
        indexes = [
            models.Index(fields=["flash_sale"]),
            models.Index(fields=["product_item"]),
        ]

    def __str__(self):
        return f"{self.flash_sale.name} - {self.product_item.name}"


class MarketingBanner(UUIDModel):
    """Marketing banner for homepage."""

    title = models.CharField(max_length=200, blank=True, verbose_name=_("Title"))
    image = models.ImageField(
        upload_to="banners/%Y/%m/",
        verbose_name=_("Banner Image"),
    )
    link = models.CharField(
        max_length=500,
        blank=True,
        verbose_name=_("Link URL"),
        help_text=_("URL when banner is clicked"),
    )
    description = models.TextField(blank=True, verbose_name=_("Description"))
    is_active = models.BooleanField(default=True, verbose_name=_("Is Active"))
    sort_order = models.IntegerField(default=0, verbose_name=_("Sort Order"))
    start_date = models.DateTimeField(blank=True, null=True, verbose_name=_("Start Date"))
    end_date = models.DateTimeField(blank=True, null=True, verbose_name=_("End Date"))
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _("Marketing Banner")
        verbose_name_plural = _("Marketing Banners")
        ordering = ["sort_order", "-created_at"]
        db_table = "marketing_banners"
        indexes = [
            models.Index(fields=["is_active"]),
            models.Index(fields=["sort_order"]),
            models.Index(fields=["start_date"]),
            models.Index(fields=["end_date"]),
            models.Index(fields=["is_active", "sort_order", "created_at"]),
            models.Index(fields=["start_date", "end_date", "is_active"]),
        ]

    def __str__(self):
        return self.title or f"Banner #{self.id}"
