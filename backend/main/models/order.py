"""Order and Payment models."""
from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator
from django.utils.translation import gettext_lazy as _

from .base import UUIDModel
from .choices import OrderStatus, PaymentStatus


class Order(UUIDModel):
    """Customer order."""

    order_number = models.CharField(
        max_length=50,
        unique=True,
        verbose_name=_("Order Number"),
        help_text=_('e.g., "ORD-20231217-XXXX"'),
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.RESTRICT,
        related_name="orders_main",
        verbose_name=_("User"),
    )
    product_item = models.ForeignKey(
        "main.ProductItem",
        on_delete=models.RESTRICT,
        related_name="orders",
        verbose_name=_("Product Item"),
    )

    # Customer input (game ID, server ID, phone, etc.)
    customer_data = models.JSONField(
        verbose_name=_("Customer Data"),
        help_text=_('e.g., {"userId": "123456", "serverId": "1234"}'),
    )

    # Pricing
    original_price = models.IntegerField(
        validators=[MinValueValidator(0)],
        verbose_name=_("Original Price"),
    )
    final_price = models.IntegerField(
        validators=[MinValueValidator(0)],
        verbose_name=_("Final Price"),
        help_text=_("After discount (flash sale/coupon)"),
    )

    # Payment fee and VAT
    payment_fee = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0)],
        verbose_name=_("Payment Fee"),
    )
    vat_amount = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0)],
        verbose_name=_("VAT Amount"),
    )
    total_amount = models.IntegerField(
        validators=[MinValueValidator(0)],
        verbose_name=_("Total Amount"),
        help_text=_("final_price + payment_fee + vat_amount"),
    )

    # Payment method
    payment_method = models.ForeignKey(
        "main.PaymentMethod",
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name="orders",
        verbose_name=_("Payment Method"),
    )

    # Status
    status = models.CharField(
        max_length=15,
        choices=OrderStatus.choices,
        default=OrderStatus.PENDING,
        verbose_name=_("Status"),
    )

    # Payment and refund tracking
    payment_expires_at = models.DateTimeField(
        blank=True,
        null=True,
        verbose_name=_("Payment Expires At"),
    )
    refund_amount = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0)],
        verbose_name=_("Refund Amount"),
    )
    refund_reason = models.TextField(blank=True, verbose_name=_("Refund Reason"))
    refunded_at = models.DateTimeField(blank=True, null=True, verbose_name=_("Refunded At"))

    # Outcome tracking (set by webhook handlers)
    failure_reason = models.TextField(
        blank=True,
        verbose_name=_("Failure Reason"),
        help_text=_("Message from Digiflazz when top-up fails"),
    )
    completion_data = models.JSONField(
        blank=True,
        null=True,
        verbose_name=_("Completion Data"),
        help_text=_("Serial number and metadata from successful top-up"),
    )

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    paid_at = models.DateTimeField(blank=True, null=True, verbose_name=_("Paid At"))
    completed_at = models.DateTimeField(blank=True, null=True, verbose_name=_("Completed At"))

    class Meta:
        verbose_name = _("Order")
        verbose_name_plural = _("Orders")
        ordering = ["-created_at"]
        db_table = "orders"
        indexes = [
            models.Index(fields=["user"]),
            models.Index(fields=["order_number"]),
            models.Index(fields=["status"]),
            models.Index(fields=["created_at"]),
            models.Index(fields=["user", "status", "created_at"]),
            models.Index(fields=["status", "created_at", "user"]),
            models.Index(fields=["payment_method"]),
            models.Index(fields=["payment_expires_at"]),
        ]

    def __str__(self):
        return f"{self.order_number} - {self.user.email}"


class Payment(UUIDModel):
    """Payment record for Midtrans integration."""

    order = models.OneToOneField(
        Order,
        on_delete=models.CASCADE,
        related_name="payment",
        verbose_name=_("Order"),
    )

    # Midtrans data
    external_id = models.CharField(
        max_length=100,
        unique=True,
        verbose_name=_("External ID"),
        help_text=_("Your reference ID (order number)"),
    )
    transaction_id = models.CharField(
        max_length=100,
        unique=True,
        blank=True,
        null=True,
        verbose_name=_("Transaction ID"),
        help_text=_("Midtrans transaction ID"),
    )

    # Payment method reference
    payment_method = models.ForeignKey(
        "main.PaymentMethod",
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name="payments",
        verbose_name=_("Payment Method"),
    )

    # Payment URLs and instructions (varies by payment method)
    payment_url = models.CharField(max_length=500, blank=True, null=True, verbose_name=_("Payment URL"))
    va_number = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        verbose_name=_("VA Number"),
        help_text=_("Virtual Account number (for bank_transfer)"),
    )
    qris_string = models.TextField(
        blank=True,
        null=True,
        verbose_name=_("QRIS String"),
        help_text=_("QRIS payment string (for qris)"),
    )
    deeplink_url = models.CharField(
        max_length=500,
        blank=True,
        null=True,
        verbose_name=_("Deep link URL"),
        help_text=_("Deep link for e-wallets"),
    )
    redirect_url = models.CharField(
        max_length=500,
        blank=True,
        null=True,
        verbose_name=_("Redirect URL"),
        help_text=_("Redirect URL for credit card"),
    )

    amount = models.IntegerField(
        validators=[MinValueValidator(0)],
        verbose_name=_("Amount"),
        help_text=_("Amount charged (includes payment fee)"),
    )
    status = models.CharField(
        max_length=15,
        choices=PaymentStatus.choices,
        default=PaymentStatus.PENDING,
        verbose_name=_("Status"),
    )
    paid_at = models.DateTimeField(blank=True, null=True, verbose_name=_("Paid At"))
    expires_at = models.DateTimeField(blank=True, null=True, verbose_name=_("Expires At"))

    # Raw webhook data
    webhook_data = models.JSONField(blank=True, null=True, verbose_name=_("Webhook Data"))

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _("Payment")
        verbose_name_plural = _("Payments")
        ordering = ["-created_at"]
        db_table = "payments"
        indexes = [
            models.Index(fields=["external_id"]),
            models.Index(fields=["transaction_id"]),
            models.Index(fields=["status"]),
            models.Index(fields=["order"]),
            models.Index(fields=["payment_method"]),
            models.Index(fields=["created_at", "status"]),
        ]

    def __str__(self):
        return f"Payment {self.external_id} - {self.get_status_display()}"
