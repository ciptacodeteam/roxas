"""ProductRating model."""
from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils.translation import gettext_lazy as _

from .base import UUIDModel


class ProductRating(UUIDModel):
    """Product rating/review."""

    product = models.ForeignKey(
        "main.Product",
        on_delete=models.CASCADE,
        related_name="ratings",
        verbose_name=_("Product"),
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name="product_ratings_main",
        verbose_name=_("User"),
    )
    order = models.ForeignKey(
        "main.Order",
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name="product_rating",
        verbose_name=_("Order"),
        help_text=_("The order this rating is associated with"),
    )
    rating = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        verbose_name=_("Rating"),
        help_text=_("1-5 stars"),
    )
    comment = models.TextField(blank=True, verbose_name=_("Comment"))
    user_name = models.CharField(
        max_length=100,
        blank=True,
        verbose_name=_("User Name"),
        help_text=_("Display name for the reviewer"),
    )
    is_active = models.BooleanField(default=True, verbose_name=_("Is Active"))
    sort_order = models.IntegerField(default=0, verbose_name=_("Sort Order"))
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _("Product Rating")
        verbose_name_plural = _("Product Ratings")
        ordering = ["product", "-created_at"]
        db_table = "product_ratings"
        indexes = [
            models.Index(fields=["product"]),
            models.Index(fields=["product", "is_active"]),
            models.Index(fields=["is_active"]),
            models.Index(fields=["user"]),
        ]

    def __str__(self):
        return f"{self.product.name} - {self.rating} stars"
