"""Payment method model for Midtrans integration."""
from django.db import models
from django.core.validators import MinValueValidator
from django.utils.translation import gettext_lazy as _

from .base import UUIDModel
from .choices import FeeType, PaymentMethodType


class PaymentMethod(UUIDModel):
    """Payment method configuration for Midtrans integration."""

    type = models.CharField(
        max_length=20,
        choices=PaymentMethodType.choices,
        verbose_name=_("Payment Type"),
    )
    name = models.CharField(
        max_length=100,
        verbose_name=_("Display Name"),
        help_text=_('e.g., "BCA Virtual Account", "GoPay"'),
    )
    description = models.TextField(
        blank=True,
        verbose_name=_("Description"),
    )
    icon = models.ImageField(
        upload_to="payment_methods/icons/",
        blank=True,
        verbose_name=_("Icon"),
    )

    # Fee configuration
    fee_type = models.CharField(
        max_length=15,
        choices=FeeType.choices,
        default=FeeType.PERCENTAGE,
        verbose_name=_("Fee Type"),
    )
    fee_value = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)],
        verbose_name=_("Fee Value"),
        help_text=_("Fee percentage (e.g., 2.5 for 2.5%) or fixed amount in IDR"),
    )

    # VAT configuration
    vat_type = models.CharField(
        max_length=15,
        choices=FeeType.choices,
        default=FeeType.PERCENTAGE,
        verbose_name=_("VAT Type"),
    )
    vat_value = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)],
        verbose_name=_("VAT Value"),
        help_text=_("VAT percentage (e.g., 11 for 11%) or fixed amount in IDR"),
    )

    is_active = models.BooleanField(
        default=True,
        verbose_name=_("Is Active"),
    )

    # Midtrans-specific
    midtrans_code = models.CharField(
        max_length=50,
        unique=True,
        verbose_name=_("Midtrans Code"),
        help_text=_('Code used in Midtrans API (e.g., "bca", "gopay")'),
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _("Payment Method")
        verbose_name_plural = _("Payment Methods")
        ordering = ["type", "name"]
        db_table = "payment_methods"
        indexes = [
            models.Index(fields=["is_active"]),
            models.Index(fields=["type"]),
            models.Index(fields=["midtrans_code"]),
        ]

    def __str__(self):
        return f"{self.name} ({self.get_type_display()})"
