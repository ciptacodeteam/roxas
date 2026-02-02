from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils.translation import gettext_lazy as _
from django.conf import settings
import uuid


# ============================================
# ENUMS / CHOICES
# ============================================

class PaymentStatus(models.TextChoices):
    PENDING = "PENDING", _("Pending")
    SETTLEMENT = "SETTLEMENT", _("Settlement")
    EXPIRE = "EXPIRE", _("Expired")
    CANCEL = "CANCEL", _("Cancelled")
    DENY = "DENY", _("Denied")
    REFUND = "REFUND", _("Refunded")


class DigiflazzStatus(models.TextChoices):
    PENDING = "PENDING", _("Pending")
    SUKSES = "SUKSES", _("Success")
    GAGAL = "GAGAL", _("Failed")


class DigiflazzItemStatus(models.TextChoices):
    ACTIVE = "ACTIVE", _("Active")
    INACTIVE = "INACTIVE", _("Inactive")


class PriceSyncStatus(models.TextChoices):
    SUCCESS = "SUCCESS", _("Success")
    FAILED = "FAILED", _("Failed")
    IN_PROGRESS = "IN_PROGRESS", _("In Progress")


class PriceSyncType(models.TextChoices):
    PREPAID = "PREPAID", _("Prepaid")
    PASCA = "PASCA", _("Postpaid")
    FULL = "FULL", _("Full Sync")


class FeeType(models.TextChoices):
    PERCENTAGE = "PERCENTAGE", _("Percentage")
    FIXED = "FIXED", _("Fixed Amount")


class PaymentMethodType(models.TextChoices):
    QRIS = "QRIS", _("QRIS")
    E_WALLET = "E_WALLET", _("E-Wallet")
    MOBILE_BANKING = "MOBILE_BANKING", _("Mobile Banking")
    CREDIT_CARD = "CREDIT_CARD", _("Credit Card")
    BANK_TRANSFER = "BANK_TRANSFER", _("Bank Transfer")


class OrderStatus(models.TextChoices):
    PENDING = "PENDING", _("Pending - Awaiting Payment")
    PAID = "PAID", _("Paid - Processing Top-up")
    PROCESSING = "PROCESSING", _("Processing - Sent to Provider")
    COMPLETED = "COMPLETED", _("Completed - Top-up Successful")
    FAILED = "FAILED", _("Failed - Top-up Failed")
    REFUNDED = "REFUNDED", _("Refunded")
    EXPIRED = "EXPIRED", _("Expired - Payment Timeout")


class ApiProvider(models.TextChoices):
    DIGIFLAZZ = "DIGIFLAZZ", _("Digiflazz")
    MIDTRANS = "MIDTRANS", _("Midtrans")
    MAILGUN = "MAILGUN", _("Mailgun")


class ApiLogStatus(models.TextChoices):
    SUCCESS = "SUCCESS", _("Success")
    FAILED = "FAILED", _("Failed")
    TIMEOUT = "TIMEOUT", _("Timeout")
    ERROR = "ERROR", _("Error")


class DiscountType(models.TextChoices):
    PERCENTAGE = "PERCENTAGE", _("Percentage Discount")
    FIXED_AMOUNT = "FIXED_AMOUNT", _("Fixed Amount Discount")


class EmailStatus(models.TextChoices):
    PENDING = "PENDING", _("Pending")
    PROCESSING = "PROCESSING", _("Processing")
    SENT = "SENT", _("Sent")
    FAILED = "FAILED", _("Failed")


class EmailPriority(models.TextChoices):
    LOW = "LOW", _("Low")
    NORMAL = "NORMAL", _("Normal")
    HIGH = "HIGH", _("High")


# ============================================
# ABSTRACT BASE MODEL
# ============================================

class UUIDModel(models.Model):
    """Abstract base model with UUID primary key."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    class Meta:
        abstract = True


# ============================================
# PAYMENT METHOD MODELS
# ============================================

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


# ============================================
# PRODUCT MODELS
# ============================================

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
        help_text=_('Required input fields, e.g. ["userId", "serverId"]'),
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
        """Get the validation item for this product (if any)."""
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
    items_synced = models.IntegerField(
        default=0,
        verbose_name=_("Items Synced"),
    )
    items_updated = models.IntegerField(
        default=0,
        verbose_name=_("Items Updated"),
    )
    items_created = models.IntegerField(
        default=0,
        verbose_name=_("Items Created"),
    )
    error_message = models.TextField(
        blank=True,
        verbose_name=_("Error Message"),
    )
    started_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name=_("Started At"),
    )
    completed_at = models.DateTimeField(
        blank=True,
        null=True,
        verbose_name=_("Completed At"),
    )
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


# ============================================
# COUPON MODELS
# ============================================

class Coupon(UUIDModel):
    """Discount coupon."""
    
    code = models.CharField(
        max_length=50,
        unique=True,
        verbose_name=_("Coupon Code"),
        help_text=_('e.g., "WELCOME10"'),
    )
    description = models.TextField(
        blank=True,
        verbose_name=_("Description"),
    )
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
    is_active = models.BooleanField(
        default=True,
        verbose_name=_("Is Active"),
    )
    start_date = models.DateTimeField(
        blank=True,
        null=True,
        verbose_name=_("Start Date"),
    )
    end_date = models.DateTimeField(
        blank=True,
        null=True,
        verbose_name=_("End Date"),
    )
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
        "Order",
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


# ============================================
# FLASH SALE MODELS
# ============================================

class FlashSale(UUIDModel):
    """Flash sale event."""
    
    name = models.CharField(
        max_length=200,
        verbose_name=_("Flash Sale Name"),
    )
    start_time = models.DateTimeField(
        verbose_name=_("Start Time"),
    )
    end_time = models.DateTimeField(
        verbose_name=_("End Time"),
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name=_("Is Active"),
    )
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
        ProductItem,
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


# ============================================
# MARKETING BANNER MODELS
# ============================================

class MarketingBanner(UUIDModel):
    """Marketing banner for homepage."""
    
    title = models.CharField(
        max_length=200,
        blank=True,
        verbose_name=_("Title"),
    )
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
    description = models.TextField(
        blank=True,
        verbose_name=_("Description"),
    )
    is_active = models.BooleanField(
        default=True,
        verbose_name=_("Is Active"),
    )
    sort_order = models.IntegerField(
        default=0,
        verbose_name=_("Sort Order"),
    )
    start_date = models.DateTimeField(
        blank=True,
        null=True,
        verbose_name=_("Start Date"),
    )
    end_date = models.DateTimeField(
        blank=True,
        null=True,
        verbose_name=_("End Date"),
    )
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


# ============================================
# ORDER & TRANSACTION MODELS
# ============================================

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
        ProductItem,
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
        PaymentMethod,
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
    refund_reason = models.TextField(
        blank=True,
        verbose_name=_("Refund Reason"),
    )
    refunded_at = models.DateTimeField(
        blank=True,
        null=True,
        verbose_name=_("Refunded At"),
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    paid_at = models.DateTimeField(
        blank=True,
        null=True,
        verbose_name=_("Paid At"),
    )
    completed_at = models.DateTimeField(
        blank=True,
        null=True,
        verbose_name=_("Completed At"),
    )
    
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
        PaymentMethod,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name="payments",
        verbose_name=_("Payment Method"),
    )
    
    # Payment URLs and instructions (varies by payment method)
    payment_url = models.CharField(
        max_length=500,
        blank=True,
        null=True,
        verbose_name=_("Payment URL"),
    )
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
    
    # Expiry information
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
    paid_at = models.DateTimeField(
        blank=True,
        null=True,
        verbose_name=_("Paid At"),
    )
    expires_at = models.DateTimeField(
        blank=True,
        null=True,
        verbose_name=_("Expires At"),
    )
    
    # Raw webhook data
    webhook_data = models.JSONField(
        blank=True,
        null=True,
        verbose_name=_("Webhook Data"),
    )
    
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


class DigiflazzTransaction(UUIDModel):
    """Digiflazz API transaction record."""
    
    order = models.OneToOneField(
        Order,
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
    sku_code = models.CharField(
        max_length=100,
        verbose_name=_("SKU Code"),
    )
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
    message = models.TextField(
        blank=True,
        verbose_name=_("Message"),
    )
    serial_number = models.TextField(
        blank=True,
        verbose_name=_("Serial Number"),
        help_text=_("SN for vouchers"),
    )
    
    # Raw response data
    response_data = models.JSONField(
        blank=True,
        null=True,
        verbose_name=_("Response Data"),
    )
    webhook_data = models.JSONField(
        blank=True,
        null=True,
        verbose_name=_("Webhook Data"),
    )
    
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


# ============================================
# RATING MODELS
# ============================================

class ProductRating(UUIDModel):
    """Product rating/review."""
    
    product = models.ForeignKey(
        Product,
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
    rating = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        verbose_name=_("Rating"),
        help_text=_("1-5 stars"),
    )
    comment = models.TextField(
        blank=True,
        verbose_name=_("Comment"),
    )
    user_name = models.CharField(
        max_length=100,
        blank=True,
        verbose_name=_("User Name"),
        help_text=_("Display name for the reviewer"),
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


# ============================================
# API LOG MODELS
# ============================================

class ApiLog(UUIDModel):
    """Track external API calls (Digiflazz, Midtrans, etc.)."""
    
    provider = models.CharField(
        max_length=15,
        choices=ApiProvider.choices,
        verbose_name=_("Provider"),
    )
    endpoint = models.CharField(
        max_length=255,
        verbose_name=_("Endpoint"),
    )
    method = models.CharField(
        max_length=10,
        default="POST",
        verbose_name=_("HTTP Method"),
    )
    
    # Request details
    request_data = models.JSONField(
        blank=True,
        null=True,
        verbose_name=_("Request Data"),
        help_text=_("Sanitized request payload"),
    )
    
    # Response details
    status = models.CharField(
        max_length=10,
        choices=ApiLogStatus.choices,
        verbose_name=_("Status"),
    )
    status_code = models.IntegerField(
        blank=True,
        null=True,
        verbose_name=_("HTTP Status Code"),
    )
    response_data = models.JSONField(
        blank=True,
        null=True,
        verbose_name=_("Response Data"),
    )
    error_message = models.TextField(
        blank=True,
        verbose_name=_("Error Message"),
    )
    
    # Performance tracking
    response_time = models.IntegerField(
        blank=True,
        null=True,
        verbose_name=_("Response Time"),
        help_text=_("Response time in milliseconds"),
    )
    
    # Context
    order_id = models.UUIDField(
        blank=True,
        null=True,
        verbose_name=_("Order ID"),
    )
    ref_id = models.CharField(
        max_length=100,
        blank=True,
        verbose_name=_("Reference ID"),
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = _("API Log")
        verbose_name_plural = _("API Logs")
        ordering = ["-created_at"]
        db_table = "api_logs"
        indexes = [
            models.Index(fields=["provider", "status"]),
            models.Index(fields=["provider", "created_at"]),
            models.Index(fields=["status", "created_at"]),
            models.Index(fields=["order_id"]),
            models.Index(fields=["ref_id"]),
            models.Index(fields=["created_at"]),
        ]
    
    def __str__(self):
        return f"{self.get_provider_display()} - {self.endpoint} ({self.get_status_display()})"


# ============================================
# AUDIT LOG MODELS
# ============================================

class AuditLog(UUIDModel):
    """Audit trail for important changes."""
    
    entity_type = models.CharField(
        max_length=100,
        verbose_name=_("Entity Type"),
        help_text=_('e.g., "Order", "Product", "User"'),
    )
    entity_id = models.CharField(
        max_length=100,
        verbose_name=_("Entity ID"),
    )
    action = models.CharField(
        max_length=20,
        verbose_name=_("Action"),
        help_text=_('e.g., "CREATE", "UPDATE", "DELETE"'),
    )
    changes = models.JSONField(
        blank=True,
        null=True,
        verbose_name=_("Changes"),
        help_text=_("Track what changed"),
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name="audit_logs_main",
        verbose_name=_("User"),
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = _("Audit Log")
        verbose_name_plural = _("Audit Logs")
        ordering = ["-created_at"]
        db_table = "audit_logs"
        indexes = [
            models.Index(fields=["entity_type", "entity_id"]),
            models.Index(fields=["user", "created_at"]),
            models.Index(fields=["created_at"]),
            models.Index(fields=["action"]),
        ]
    
    def __str__(self):
        return f"{self.entity_type} {self.entity_id} - {self.action}"


# ============================================
# EMAIL QUEUE MODELS
# ============================================

class EmailQueue(UUIDModel):
    """Email queue for asynchronous email sending."""
    
    to = models.EmailField(
        verbose_name=_("To"),
    )
    subject = models.CharField(
        max_length=255,
        verbose_name=_("Subject"),
    )
    html = models.TextField(
        verbose_name=_("HTML Content"),
    )
    text = models.TextField(
        blank=True,
        verbose_name=_("Plain Text Content"),
    )
    
    status = models.CharField(
        max_length=15,
        choices=EmailStatus.choices,
        default=EmailStatus.PENDING,
        verbose_name=_("Status"),
    )
    priority = models.CharField(
        max_length=10,
        choices=EmailPriority.choices,
        default=EmailPriority.NORMAL,
        verbose_name=_("Priority"),
    )
    
    attempts = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0)],
        verbose_name=_("Attempts"),
    )
    max_attempts = models.IntegerField(
        default=3,
        validators=[MinValueValidator(1)],
        verbose_name=_("Max Attempts"),
    )
    last_error = models.TextField(
        blank=True,
        verbose_name=_("Last Error"),
    )
    
    scheduled_for = models.DateTimeField(
        blank=True,
        null=True,
        verbose_name=_("Scheduled For"),
        help_text=_("For delayed emails"),
    )
    sent_at = models.DateTimeField(
        blank=True,
        null=True,
        verbose_name=_("Sent At"),
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = _("Email Queue")
        verbose_name_plural = _("Email Queue")
        ordering = ["status", "priority", "scheduled_for", "created_at"]
        db_table = "email_queue"
        indexes = [
            models.Index(fields=["status", "priority", "scheduled_for"]),
            models.Index(fields=["status", "created_at"]),
            models.Index(fields=["created_at"]),
        ]
    
    def __str__(self):
        return f"Email to {self.to} - {self.get_status_display()}"
