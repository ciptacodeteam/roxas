"""Product-related models: Category, Product, ProductItem, PriceSync."""
from django.db import models
from django.core.validators import MinValueValidator
from django.utils.translation import gettext_lazy as _

from .base import UUIDModel
from .choices import DigiflazzItemStatus, PriceSyncStatus, PriceSyncType


class Category(UUIDModel):
    """Game category (e.g., Mobile Games, PC Games)."""

    name = models.CharField(
        max_length=100,
        unique=True,
        verbose_name=_("Category Name"),
    )
    slug = models.SlugField(
        max_length=100,
        unique=True,
        verbose_name=_("Slug"),
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name=_("Is Active"),
    )
    sort_order = models.IntegerField(
        default=0,
        verbose_name=_("Sort Order"),
        help_text=_("Lower numbers appear first"),
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _("Category")
        verbose_name_plural = _("Categories")
        ordering = ["sort_order", "name"]
        db_table = "categories"
        indexes = [
            models.Index(fields=["is_active", "sort_order"]),
            models.Index(fields=["slug"]),
        ]

    def __str__(self):
        return self.name


class CategoryInstructionImage(UUIDModel):
    """Instruction images showing how to top-up for a category."""

    category = models.ForeignKey(
        Category,
        on_delete=models.CASCADE,
        related_name="instruction_images",
        verbose_name=_("Category"),
    )
    image_url = models.CharField(
        max_length=500,
        verbose_name=_("Image URL"),
    )
    alt_text = models.CharField(
        max_length=255,
        blank=True,
        verbose_name=_("Alt Text"),
        help_text=_("For accessibility"),
    )
    sort_order = models.IntegerField(
        default=0,
        verbose_name=_("Sort Order"),
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _("Category Instruction Image")
        verbose_name_plural = _("Category Instruction Images")
        ordering = ["category", "sort_order"]
        db_table = "category_instruction_images"
        indexes = [
            models.Index(fields=["category", "sort_order"]),
        ]

    def __str__(self):
        return f"{self.category.name} - Instruction #{self.sort_order}"


class Product(UUIDModel):
    """Game product (e.g., Mobile Legends, Free Fire)."""

    category = models.ForeignKey(
        Category,
        on_delete=models.RESTRICT,
        related_name="products",
        verbose_name=_("Category"),
    )
    name = models.CharField(
        max_length=200,
        verbose_name=_("Product Name"),
    )
    slug = models.SlugField(
        max_length=200,
        unique=True,
        verbose_name=_("Slug"),
    )
    input_fields = models.JSONField(
        default=list,
        verbose_name=_("Input Fields"),
        help_text=_(
            'Structured field definitions rendered by the frontend. '
            'Each item: {"key", "label", "type", "placeholder", "hint", "required", "validation": {"pattern", "min_length", "max_length"}}. '
            'Use main.input_field_presets.INPUT_FIELD_PRESETS for common configurations.'
        ),
    )
    customer_no_template = models.CharField(
        max_length=200,
        blank=True,
        default="{userId}",
        verbose_name=_("Customer No Template"),
        help_text=_(
            'Python str.format template that builds the customer_no sent to Digiflazz. '
            'Keys must match field "key" values in input_fields. '
            'Examples: "{userId}{serverId}" (Games w/ server), "{userId}" (Games ID only), '
            '"{phoneNumber}" (Pulsa/Data), "{customerNo}" (PLN/PDAM/BPJS/etc), '
            '"{noIdentitas},{noRangka}" (SAMSAT), "" (no input needed).'
        ),
    )
    description = models.TextField(
        blank=True,
        verbose_name=_("Description"),
    )
    image = models.ImageField(
        upload_to="products/%Y/%m/",
        blank=True,
        verbose_name=_("Product Image"),
    )
    banner_image = models.ImageField(
        upload_to="products/banners/%Y/%m/",
        blank=True,
        verbose_name=_("Banner Image"),
    )
    instructions = models.TextField(
        blank=True,
        verbose_name=_("Instructions"),
        help_text=_("How to find game ID/user ID"),
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name=_("Is Active"),
    )
    sort_order = models.IntegerField(
        default=0,
        verbose_name=_("Sort Order"),
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _("Product")
        verbose_name_plural = _("Products")
        ordering = ["sort_order", "name"]
        db_table = "products"
        indexes = [
            models.Index(fields=["category"]),
            models.Index(fields=["slug"]),
            models.Index(fields=["is_active", "sort_order"]),
        ]

    def __str__(self):
        return f"{self.name} ({self.category.name})"

    def get_validation_item(self):
        """Return the validation item for this product (if any)."""
        return self.items.filter(is_validation_item=True, is_active=True).first()


class ProductItem(UUIDModel):
    """Specific product item (e.g., 86 Diamonds, 172 Diamonds)."""

    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="items",
        verbose_name=_("Product"),
    )
    name = models.CharField(
        max_length=200,
        verbose_name=_("Item Name"),
        help_text=_('e.g., "86 Diamonds"'),
    )
    sku_code = models.CharField(
        max_length=100,
        unique=True,
        verbose_name=_("SKU Code"),
        help_text=_("Digiflazz buyer_sku_code"),
    )
    icon_image = models.ImageField(
        upload_to="product_items/%Y/%m/",
        blank=True,
        verbose_name=_("Icon Image"),
    )
    group = models.CharField(
        max_length=100,
        blank=True,
        verbose_name=_("Group"),
        help_text=_('e.g., "Diamond", "Weekly Pass"'),
    )

    # Pricing (in IDR, stored as integers for precision)
    base_price = models.IntegerField(
        validators=[MinValueValidator(0)],
        verbose_name=_("Base Price"),
        help_text=_("Cost from Digiflazz (in IDR)"),
    )
    normal_price = models.IntegerField(
        validators=[MinValueValidator(0)],
        verbose_name=_("Normal Price"),
        help_text=_("Regular selling price (in IDR)"),
    )
    discounted_price = models.IntegerField(
        blank=True,
        null=True,
        validators=[MinValueValidator(0)],
        verbose_name=_("Discounted Price"),
        help_text=_("Sale price (optional, in IDR)"),
    )
    sell_price = models.IntegerField(
        validators=[MinValueValidator(0)],
        verbose_name=_("Sell Price"),
        help_text=_("Current effective selling price (in IDR)"),
    )

    is_active = models.BooleanField(
        default=True,
        verbose_name=_("Is Active"),
    )
    is_validation_item = models.BooleanField(
        default=False,
        verbose_name=_("Is Validation Item"),
        help_text=_("Items used for validation (e.g., 'Cek Username') - hidden from public listings"),
    )
    sort_order = models.IntegerField(
        default=0,
        verbose_name=_("Sort Order"),
    )

    # Price sync tracking
    last_synced_at = models.DateTimeField(
        blank=True,
        null=True,
        verbose_name=_("Last Synced At"),
    )
    digiflazz_status = models.CharField(
        max_length=10,
        choices=DigiflazzItemStatus.choices,
        blank=True,
        null=True,
        verbose_name=_("Digiflazz Status"),
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _("Product Item")
        verbose_name_plural = _("Product Items")
        ordering = ["product", "sort_order", "name"]
        db_table = "product_items"
        indexes = [
            models.Index(fields=["product"]),
            models.Index(fields=["sku_code"]),
            models.Index(fields=["product", "is_active", "sku_code"]),
            models.Index(fields=["is_active", "sort_order"]),
        ]

    def __str__(self):
        return f"{self.product.name} - {self.name}"


class PriceSync(UUIDModel):
    """Global price sync tracking from Digiflazz."""

    sync_type = models.CharField(
        max_length=15,
        choices=PriceSyncType.choices,
        verbose_name=_("Sync Type"),
    )
    status = models.CharField(
        max_length=15,
        choices=PriceSyncStatus.choices,
        verbose_name=_("Status"),
    )
    items_synced = models.IntegerField(default=0, verbose_name=_("Items Synced"))
    items_updated = models.IntegerField(default=0, verbose_name=_("Items Updated"))
    items_created = models.IntegerField(default=0, verbose_name=_("Items Created"))
    error_message = models.TextField(blank=True, verbose_name=_("Error Message"))
    started_at = models.DateTimeField(auto_now_add=True, verbose_name=_("Started At"))
    completed_at = models.DateTimeField(blank=True, null=True, verbose_name=_("Completed At"))
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _("Price Sync")
        verbose_name_plural = _("Price Syncs")
        ordering = ["-started_at"]
        db_table = "price_syncs"
        indexes = [
            models.Index(fields=["status"]),
            models.Index(fields=["started_at"]),
            models.Index(fields=["status", "started_at"]),
        ]

    def __str__(self):
        return f"Sync {self.get_sync_type_display()} - {self.get_status_display()} ({self.started_at})"
