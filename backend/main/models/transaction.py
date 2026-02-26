"""Digiflazz transaction models."""
from django.db import models
from django.utils.translation import gettext_lazy as _

from .base import UUIDModel
from .choices import DigiflazzStatus


class DigiflazzTransaction(UUIDModel):
    """Digiflazz API transaction record."""

    order = models.OneToOneField(
        "main.Order",
        on_delete=models.CASCADE,
        related_name="digiflazz_transaction",
        verbose_name=_("Order"),
    )

    # Digiflazz data
    ref_id = models.CharField(
        max_length=100,
        unique=True,
        verbose_name=_("Reference ID"),
        help_text=_("Your reference ID"),
    )
    trx_id = models.CharField(
        max_length=100,
        blank=True,
        verbose_name=_("Transaction ID"),
        help_text=_("Digiflazz transaction ID"),
    )
    sku_code = models.CharField(max_length=100, verbose_name=_("SKU Code"))
    customer_no = models.CharField(
        max_length=100,
        verbose_name=_("Customer No"),
        help_text=_("Game ID / phone number"),
    )

    status = models.CharField(
        max_length=10,
        choices=DigiflazzStatus.choices,
        default=DigiflazzStatus.PENDING,
        verbose_name=_("Status"),
    )
    message = models.TextField(blank=True, verbose_name=_("Message"))
    serial_number = models.TextField(blank=True, verbose_name=_("Serial Number"), help_text=_("SN for vouchers"))

    # Raw response data
    response_data = models.JSONField(blank=True, null=True, verbose_name=_("Response Data"))
    webhook_data = models.JSONField(blank=True, null=True, verbose_name=_("Webhook Data"))

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _("Digiflazz Transaction")
        verbose_name_plural = _("Digiflazz Transactions")
        ordering = ["-created_at"]
        db_table = "digiflazz_transactions"
        indexes = [
            models.Index(fields=["ref_id"]),
            models.Index(fields=["status"]),
            models.Index(fields=["order"]),
            models.Index(fields=["trx_id"]),
            models.Index(fields=["created_at", "status"]),
        ]

    def __str__(self):
        return f"Digiflazz {self.ref_id} - {self.get_status_display()}"


class DigiflazzAccountCheck(UUIDModel):
    """
    Digiflazz account validation check record.

    Stores validation transactions (CHECK-*, MLCHECK-*) that verify
    account existence without creating actual orders.
    """

    ref_id = models.CharField(
        max_length=100,
        unique=True,
        verbose_name=_("Reference ID"),
        help_text=_("Validation reference ID (CHECK-* or MLCHECK-*)"),
    )

    # Product being validated
    product = models.ForeignKey(
        "main.Product",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="account_checks",
        verbose_name=_("Product"),
    )

    # Validation details
    sku_code = models.CharField(
        max_length=100,
        verbose_name=_("SKU Code"),
        help_text=_("Digiflazz SKU code used for validation"),
    )
    customer_no = models.CharField(
        max_length=100,
        verbose_name=_("Customer No"),
        help_text=_("Game ID / phone number being validated"),
    )
    user_id = models.CharField(
        max_length=50,
        blank=True,
        verbose_name=_("User ID"),
        help_text=_("User ID portion (for games with separate user/server)"),
    )
    server_id = models.CharField(
        max_length=50,
        blank=True,
        verbose_name=_("Server ID"),
        help_text=_("Server ID portion (for games like Mobile Legends)"),
    )

    # Validation result
    is_valid = models.BooleanField(
        default=False,
        verbose_name=_("Is Valid"),
        help_text=_("Whether the account was found and validated"),
    )
    account_name = models.CharField(
        max_length=255,
        blank=True,
        verbose_name=_("Account Name"),
        help_text=_("Account name returned by Digiflazz (SN field)"),
    )

    # Digiflazz response
    status = models.CharField(
        max_length=10,
        choices=DigiflazzStatus.choices,
        default=DigiflazzStatus.PENDING,
        verbose_name=_("Status"),
    )
    message = models.TextField(blank=True, verbose_name=_("Message"))
    rc = models.CharField(max_length=10, blank=True, verbose_name=_("Response Code"))

    # Raw response data
    response_data = models.JSONField(
        blank=True,
        null=True,
        verbose_name=_("Response Data"),
        help_text=_("Full response from Digiflazz create_transaction API"),
    )
    webhook_data = models.JSONField(
        blank=True,
        null=True,
        verbose_name=_("Webhook Data"),
        help_text=_("Webhook callback data (if received)"),
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _("Digiflazz Account Check")
        verbose_name_plural = _("Digiflazz Account Checks")
        ordering = ["-created_at"]
        db_table = "digiflazz_account_checks"
        indexes = [
            models.Index(fields=["ref_id"]),
            models.Index(fields=["customer_no"]),
            models.Index(fields=["is_valid"]),
            models.Index(fields=["created_at"]),
            models.Index(fields=["product", "created_at"]),
        ]

    def __str__(self):
        icon = "✓" if self.is_valid else "✗"
        return f"{icon} {self.ref_id} - {self.customer_no}"
