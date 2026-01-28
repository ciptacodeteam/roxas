"""
Django REST Framework serializers for the main app.
"""
from rest_framework import serializers
from django.utils import timezone
from .models import (
    PaymentMethod,
    Category,
    CategoryInstructionImage,
    Product,
    ProductItem,
    PriceSync,
    Coupon,
    CouponUsage,
    FlashSale,
    FlashSaleItem,
    MarketingBanner,
    Order,
    Payment,
    DigiflazzTransaction,
    ProductRating,
    ApiLog,
    AuditLog,
    EmailQueue,
)


# ============================================
# PAYMENT METHOD SERIALIZERS
# ============================================

class PaymentMethodSerializer(serializers.ModelSerializer):
    """Serializer for PaymentMethod model."""
    
    class Meta:
        model = PaymentMethod
        fields = [
            'id', 'type', 'bank', 'name', 'description', 'icon',
            'fee_type', 'fee_value', 'vat_type', 'vat_value',
            'is_active', 'midtrans_code', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class PaymentMethodPublicSerializer(serializers.ModelSerializer):
    """Public serializer for PaymentMethod (excludes internal config)."""
    
    class Meta:
        model = PaymentMethod
        fields = [
            'id', 'type', 'bank', 'name', 'description', 'icon',
            'fee_type', 'fee_value', 'vat_type', 'vat_value'
        ]
        read_only_fields = ['id']


# ============================================
# CATEGORY SERIALIZERS
# ============================================

class CategoryInstructionImageSerializer(serializers.ModelSerializer):
    """Serializer for CategoryInstructionImage model."""
    
    class Meta:
        model = CategoryInstructionImage
        fields = ['id', 'category', 'image', 'alt_text', 'sort_order', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class CategorySerializer(serializers.ModelSerializer):
    """Serializer for Category with instruction images."""
    instruction_images = CategoryInstructionImageSerializer(many=True, read_only=True)
    product_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Category
        fields = [
            'id', 'name', 'slug', 'description', 'sort_order',
            'is_active', 'instruction_images', 'product_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_product_count(self, obj):
        """Get count of active products in this category."""
        return obj.products.filter(is_active=True).count()


class CategoryListSerializer(serializers.ModelSerializer):
    """Simplified category serializer for lists."""
    product_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'sort_order', 'product_count']
        read_only_fields = ['id']
    
    def get_product_count(self, obj):
        return obj.products.filter(is_active=True).count()


# ============================================
# PRODUCT SERIALIZERS
# ============================================

class ProductItemSerializer(serializers.ModelSerializer):
    """Serializer for ProductItem model."""
    
    class Meta:
        model = ProductItem
        fields = [
            'id', 'product', 'name', 'sku_code', 'icon_image', 'group',
            'base_price', 'normal_price', 'discounted_price', 'sell_price',
            'is_active', 'sort_order', 'last_synced_at', 'digiflazz_status',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'last_synced_at', 'digiflazz_status', 'created_at', 'updated_at']


class ProductItemPublicSerializer(serializers.ModelSerializer):
    """Public serializer for ProductItem (excludes internal pricing)."""
    
    class Meta:
        model = ProductItem
        fields = [
            'id', 'name', 'sku_code', 'icon_image', 'group',
            'sell_price', 'normal_price', 'discounted_price', 'sort_order'
        ]
        read_only_fields = ['id']


class ProductSerializer(serializers.ModelSerializer):
    """Serializer for Product with items."""
    items = ProductItemPublicSerializer(many=True, read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    
    class Meta:
        model = Product
        fields = [
            'id', 'category', 'category_name', 'name', 'slug',
            'description', 'image', 'banner_image', 'input_fields',
            'instructions', 'is_active', 'sort_order', 'items',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ProductListSerializer(serializers.ModelSerializer):
    """Simplified product serializer for lists."""
    category_name = serializers.CharField(source='category.name', read_only=True)
    item_count = serializers.SerializerMethodField()
    min_price = serializers.SerializerMethodField()
    
    class Meta:
        model = Product
        fields = [
            'id', 'category_name', 'name', 'slug', 'image',
            'sort_order', 'item_count', 'min_price'
        ]
        read_only_fields = ['id']
    
    def get_item_count(self, obj):
        return obj.items.filter(is_active=True).count()
    
    def get_min_price(self, obj):
        """Get minimum price from active items."""
        min_item = obj.items.filter(is_active=True).order_by('sell_price').first()
        return min_item.sell_price if min_item else None


# ============================================
# PRICE SYNC SERIALIZERS
# ============================================

class PriceSyncSerializer(serializers.ModelSerializer):
    """Serializer for PriceSync model."""
    
    class Meta:
        model = PriceSync
        fields = [
            'id', 'sync_type', 'status', 'started_at', 'completed_at',
            'items_synced', 'items_updated', 'items_created', 'error_message',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


# ============================================
# COUPON SERIALIZERS
# ============================================

class CouponSerializer(serializers.ModelSerializer):
    """Serializer for Coupon model."""
    is_valid = serializers.SerializerMethodField()
    
    class Meta:
        model = Coupon
        fields = [
            'id', 'code', 'description', 'discount_type', 'discount_value',
            'min_purchase', 'max_discount', 'usage_limit', 'usage_count',
            'user_limit', 'start_date', 'end_date', 'is_active', 'is_valid',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'usage_count', 'created_at', 'updated_at']
    
    def get_is_valid(self, obj):
        """Check if coupon is currently valid."""
        if not obj.is_active:
            return False
        now = timezone.now()
        if obj.start_date and now < obj.start_date:
            return False
        if obj.end_date and now > obj.end_date:
            return False
        if obj.usage_limit and obj.usage_count >= obj.usage_limit:
            return False
        return True


class CouponValidationSerializer(serializers.Serializer):
    """Serializer for validating a coupon code."""
    code = serializers.CharField(max_length=50)
    user_id = serializers.UUIDField(required=False)
    order_amount = serializers.IntegerField(min_value=0)


class CouponUsageSerializer(serializers.ModelSerializer):
    """Serializer for CouponUsage model."""
    coupon_code = serializers.CharField(source='coupon.code', read_only=True)
    
    class Meta:
        model = CouponUsage
        fields = [
            'id', 'coupon', 'coupon_code', 'user', 'order',
            'discount_amount', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


# ============================================
# FLASH SALE SERIALIZERS
# ============================================

class FlashSaleItemSerializer(serializers.ModelSerializer):
    """Serializer for FlashSaleItem model."""
    product_item_name = serializers.CharField(source='product_item.name', read_only=True)
    product_name = serializers.CharField(source='product_item.product.name', read_only=True)
    normal_price = serializers.IntegerField(source='product_item.normal_price', read_only=True)
    discount_percentage = serializers.SerializerMethodField()
    
    class Meta:
        model = FlashSaleItem
        fields = [
            'id', 'flash_sale', 'product_item', 'product_item_name',
            'product_name', 'sale_price', 'normal_price', 'discount_percentage',
            'stock', 'sold_count'
        ]
        read_only_fields = ['id', 'sold_count']
    
    def get_discount_percentage(self, obj):
        """Calculate discount percentage."""
        if obj.product_item.normal_price > 0:
            discount = ((obj.product_item.normal_price - obj.sale_price) / obj.product_item.normal_price) * 100
            return round(discount, 2)
        return 0


class FlashSaleSerializer(serializers.ModelSerializer):
    """Serializer for FlashSale with items."""
    items = FlashSaleItemSerializer(many=True, read_only=True)
    is_active_now = serializers.SerializerMethodField()
    
    class Meta:
        model = FlashSale
        fields = [
            'id', 'name', 'start_time', 'end_time', 'is_active',
            'is_active_now', 'items', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_is_active_now(self, obj):
        """Check if flash sale is currently active."""
        if not obj.is_active:
            return False
        now = timezone.now()
        return obj.start_time <= now <= obj.end_time


# ============================================
# MARKETING SERIALIZERS
# ============================================

class MarketingBannerSerializer(serializers.ModelSerializer):
    """Serializer for MarketingBanner model."""
    is_active_now = serializers.SerializerMethodField()
    
    class Meta:
        model = MarketingBanner
        fields = [
            'id', 'title', 'description', 'image', 'link',
            'is_active', 'is_active_now', 'sort_order',
            'start_date', 'end_date', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_is_active_now(self, obj):
        """Check if banner is currently active."""
        if not obj.is_active:
            return False
        now = timezone.now()
        if obj.start_date and now < obj.start_date:
            return False
        if obj.end_date and now > obj.end_date:
            return False
        return True


# ============================================
# ORDER SERIALIZERS
# ============================================

class OrderSerializer(serializers.ModelSerializer):
    """Serializer for Order model."""
    user_email = serializers.CharField(source='user.email', read_only=True)
    product_item_name = serializers.CharField(source='product_item.name', read_only=True)
    payment_method_name = serializers.CharField(source='payment_method.name', read_only=True)
    
    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'user', 'user_email', 'product_item',
            'product_item_name', 'customer_data', 'original_price', 'final_price',
            'payment_fee', 'vat_amount', 'total_amount', 'payment_method',
            'payment_method_name', 'payment_expires_at', 'status',
            'refund_amount', 'refund_reason', 'refunded_at',
            'created_at', 'updated_at', 'paid_at', 'completed_at'
        ]
        read_only_fields = [
            'id', 'order_number', 'created_at', 'updated_at',
            'paid_at', 'completed_at'
        ]


class OrderCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating orders."""
    coupon_code = serializers.CharField(required=False, allow_blank=True, write_only=True)
    
    class Meta:
        model = Order
        fields = [
            'product_item', 'customer_data', 'payment_method', 'coupon_code'
        ]
    
    def validate_product_item(self, value):
        """Ensure product item is active."""
        if not value.is_active:
            raise serializers.ValidationError("This product item is not available.")
        return value
    
    def validate_payment_method(self, value):
        """Ensure payment method is active."""
        if not value.is_active:
            raise serializers.ValidationError("This payment method is not available.")
        return value


class OrderListSerializer(serializers.ModelSerializer):
    """Simplified order serializer for lists."""
    product_item_name = serializers.CharField(source='product_item.name', read_only=True)
    payment_method_name = serializers.CharField(source='payment_method.name', read_only=True)
    
    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'product_item_name', 'total_amount',
            'payment_method_name', 'status', 'created_at'
        ]
        read_only_fields = ['id']


# ============================================
# PAYMENT SERIALIZERS
# ============================================

class PaymentSerializer(serializers.ModelSerializer):
    """Serializer for Payment model."""
    order_number = serializers.CharField(source='order.order_number', read_only=True)
    payment_method_name = serializers.CharField(source='payment_method.name', read_only=True)
    
    class Meta:
        model = Payment
        fields = [
            'id', 'order', 'order_number', 'external_id', 'transaction_id',
            'payment_method', 'payment_method_name', 'amount', 'status',
            'payment_url', 'va_number', 'qris_string', 'deeplink_url',
            'redirect_url', 'expires_at', 'webhook_data',
            'created_at', 'updated_at', 'paid_at'
        ]
        read_only_fields = [
            'id', 'external_id', 'transaction_id', 'created_at',
            'updated_at', 'paid_at'
        ]


class PaymentPublicSerializer(serializers.ModelSerializer):
    """Public serializer for Payment (excludes sensitive data)."""
    payment_method_name = serializers.CharField(source='payment_method.name', read_only=True)
    
    class Meta:
        model = Payment
        fields = [
            'id', 'external_id', 'payment_method_name', 'amount', 'status',
            'payment_url', 'va_number', 'qris_string', 'deeplink_url',
            'redirect_url', 'expires_at', 'created_at'
        ]
        read_only_fields = ['id']


# ============================================
# DIGIFLAZZ SERIALIZERS
# ============================================

class DigiflazzTransactionSerializer(serializers.ModelSerializer):
    """Serializer for DigiflazzTransaction model."""
    order_number = serializers.CharField(source='order.order_number', read_only=True)
    
    class Meta:
        model = DigiflazzTransaction
        fields = [
            'id', 'order', 'order_number', 'ref_id', 'trx_id', 'sku_code',
            'customer_no', 'status', 'message', 'serial_number',
            'response_data', 'webhook_data', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


# ============================================
# RATING SERIALIZERS
# ============================================

class ProductRatingSerializer(serializers.ModelSerializer):
    """Serializer for ProductRating model."""
    product_name = serializers.CharField(source='product.name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    
    class Meta:
        model = ProductRating
        fields = [
            'id', 'product', 'product_name', 'user', 'user_email',
            'user_name', 'rating', 'comment', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate_rating(self, value):
        """Ensure rating is between 1 and 5."""
        if not 1 <= value <= 5:
            raise serializers.ValidationError("Rating must be between 1 and 5.")
        return value


class ProductRatingCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating product ratings."""
    
    class Meta:
        model = ProductRating
        fields = ['product', 'user_name', 'rating', 'comment']
    
    def validate_rating(self, value):
        if not 1 <= value <= 5:
            raise serializers.ValidationError("Rating must be between 1 and 5.")
        return value


# ============================================
# LOGGING SERIALIZERS
# ============================================

class ApiLogSerializer(serializers.ModelSerializer):
    """Serializer for ApiLog model."""
    
    class Meta:
        model = ApiLog
        fields = [
            'id', 'provider', 'endpoint', 'method', 'status', 'status_code',
            'response_time', 'error_message', 'request_data', 'response_data',
            'order_id', 'ref_id', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class AuditLogSerializer(serializers.ModelSerializer):
    """Serializer for AuditLog model."""
    user_email = serializers.CharField(source='user.email', read_only=True)
    
    class Meta:
        model = AuditLog
        fields = [
            'id', 'entity_type', 'entity_id', 'action', 'user',
            'user_email', 'changes', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


# ============================================
# EMAIL SERIALIZERS
# ============================================

class EmailQueueSerializer(serializers.ModelSerializer):
    """Serializer for EmailQueue model."""
    
    class Meta:
        model = EmailQueue
        fields = [
            'id', 'to', 'subject', 'html', 'text', 'status', 'priority',
            'scheduled_for', 'sent_at', 'attempts', 'max_attempts',
            'last_error', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'sent_at', 'attempts', 'created_at', 'updated_at'
        ]
