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
            'id', 'type', 'name', 'description', 'icon',
            'fee_type', 'fee_value', 'vat_type', 'vat_value',
            'is_active', 'midtrans_code', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class PaymentMethodPublicSerializer(serializers.ModelSerializer):
    """Public serializer for PaymentMethod (excludes internal config)."""
    
    class Meta:
        model = PaymentMethod
        fields = [
            'id', 'type', 'name', 'description', 'icon',
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
            'id', 'name', 'slug', 'sort_order',
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
    product = serializers.SerializerMethodField()
    product_details = serializers.SerializerMethodField()
    
    class Meta:
        model = ProductItem
        fields = [
            'id', 'product', 'name', 'sku_code', 'icon_image', 'group',
            'base_price', 'normal_price', 'discounted_price', 'sell_price',
            'is_active', 'sort_order', 'last_synced_at', 'digiflazz_status',
            'created_at', 'updated_at', 'product_details'
        ]
        read_only_fields = ['id', 'last_synced_at', 'digiflazz_status', 'created_at', 'updated_at']
    
    def get_product(self, obj):
        """Get product information."""
        if obj.product:
            return {
                'id': str(obj.product.id),
                'name': obj.product.name,
            }
        return None
    
    def get_product_details(self, obj):
        """Get product name and category details."""
        if obj.product:
            return {
                'id': str(obj.product.id),
                'name': obj.product.name,
                'category_name': obj.product.category.name if obj.product.category else '',
            }
        return None


class ProductItemPublicSerializer(serializers.ModelSerializer):
    """Public serializer for ProductItem (excludes internal pricing and MLCU items)."""
    
    class Meta:
        model = ProductItem
        fields = [
            'id', 'name', 'icon_image', 'group',
            'sell_price', 'normal_price', 'discounted_price', 'is_active', 'sort_order'
        ]
        read_only_fields = ['id']


class MobileLegendValidationSerializer(serializers.Serializer):
    """Serializer for Mobile Legend ID + Server ID validation."""
    user_id = serializers.CharField(max_length=50, required=True)
    server_id = serializers.CharField(max_length=50, required=True)
    
    def validate(self, data):
        """Validate user_id and server_id format."""
        user_id = data.get('user_id', '').strip()
        server_id = data.get('server_id', '').strip()
        
        if not user_id or not server_id:
            raise serializers.ValidationError({
                'error': 'User ID dan Server ID harus diisi'
            })
        
        # Basic validation - should be numeric
        if not user_id.isdigit() or not server_id.isdigit():
            raise serializers.ValidationError({
                'error': 'User ID dan Server ID harus berupa angka'
            })
        
        return data


class ProductSerializer(serializers.ModelSerializer):
    """Serializer for Product with items."""
    items = serializers.SerializerMethodField()
    category = CategoryListSerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        source='category',
        write_only=True,
        required=False
    )
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_details = serializers.SerializerMethodField()
    supports_validation = serializers.SerializerMethodField()
    
    class Meta:
        model = Product
        fields = [
            'id', 'category', 'category_id', 'category_name', 'category_details', 'name', 'slug',
            'description', 'image', 'banner_image', 'input_fields',
            'instructions', 'is_active', 'sort_order', 'items',
            'supports_validation', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_items(self, obj):
        """Get product items excluding validation items."""
        items = obj.items.filter(is_active=True, is_validation_item=False).order_by('sort_order', 'name')
        return ProductItemPublicSerializer(items, many=True).data
    
    def get_supports_validation(self, obj):
        """Check if product has a validation item configured."""
        return obj.items.filter(is_active=True, is_validation_item=True).exists()
    
    def get_category_details(self, obj):
        """Get category details including instruction images."""
        if obj.category:
            return {
                'id': str(obj.category.id),
                'name': obj.category.name,
                'slug': obj.category.slug,
                'instruction_images': [
                    {
                        'id': str(img.id),
                        'image': img.image.url if img.image else None,
                        'alt_text': img.alt_text,
                        'sort_order': img.sort_order
                    }
                    for img in obj.category.instruction_images.all().order_by('sort_order')
                ]
            }
        return None


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
    product_slug = serializers.CharField(source='product_item.product.slug', read_only=True)
    icon_image = serializers.CharField(source='product_item.icon_image', read_only=True)
    normal_price = serializers.IntegerField(source='product_item.normal_price', read_only=True)
    discount_percentage = serializers.SerializerMethodField()
    
    class Meta:
        model = FlashSaleItem
        fields = [
            'id', 'flash_sale', 'product_item', 'product_item_name',
            'product_name', 'product_slug', 'icon_image', 'sale_price', 
            'normal_price', 'discount_percentage', 'stock', 'sold_count'
        ]
        read_only_fields = ['id', 'sold_count']
    
    def get_discount_percentage(self, obj):
        """Calculate discount percentage."""
        if obj.product_item.normal_price > 0:
            discount = ((obj.product_item.normal_price - obj.sale_price) / obj.product_item.normal_price) * 100
            return round(discount, 2)
        return 0
    
    def validate(self, data):
        """Validate flash sale item data."""
        sale_price = data.get('sale_price')
        stock = data.get('stock')
        product_item = data.get('product_item')
        flash_sale = data.get('flash_sale')
        
        # Validate sale_price is positive
        if sale_price is not None and sale_price <= 0:
            raise serializers.ValidationError({
                'sale_price': 'Sale price must be greater than 0'
            })
        
        # Validate stock is non-negative
        if stock is not None and stock < 0:
            raise serializers.ValidationError({
                'stock': 'Stock cannot be negative'
            })
        
        # Validate sale price is lower than normal price
        if product_item and sale_price is not None:
            if sale_price >= product_item.normal_price:
                raise serializers.ValidationError({
                    'sale_price': f'Sale price must be lower than normal price (Rp {product_item.normal_price:,})'
                })
        
        # Check for duplicate product_item in the same flash sale (only on create)
        if self.instance is None:  # Creating new item
            if product_item and flash_sale:
                existing = FlashSaleItem.objects.filter(
                    flash_sale=flash_sale,
                    product_item=product_item
                ).exists()
                
                if existing:
                    raise serializers.ValidationError({
                        'product_item': 'This product is already in the flash sale'
                    })
        
        return data


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
    product_item = ProductItemSerializer(read_only=True)
    payment_method = PaymentMethodPublicSerializer(read_only=True)
    payment = serializers.SerializerMethodField()
    digiflazz_transaction = serializers.SerializerMethodField()
    
    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'user', 'user_email', 'product_item',
            'customer_data', 'original_price', 'final_price',
            'payment_fee', 'vat_amount', 'total_amount', 'payment_method',
            'payment_expires_at', 'status', 'payment', 'digiflazz_transaction',
            'refund_amount', 'refund_reason', 'refunded_at',
            'created_at', 'updated_at', 'paid_at', 'completed_at'
        ]
        read_only_fields = [
            'id', 'order_number', 'created_at', 'updated_at',
            'paid_at', 'completed_at'
        ]
    
    def get_payment(self, obj):
        """Get payment details if exists."""
        if hasattr(obj, 'payment'):
            return {
                'id': str(obj.payment.id),
                'external_id': obj.payment.external_id,
                'transaction_id': obj.payment.transaction_id,
                'payment_method': PaymentMethodPublicSerializer(obj.payment.payment_method).data if obj.payment.payment_method else None,
                'amount': obj.payment.amount,
                'status': obj.payment.status,
                'payment_url': obj.payment.payment_url,
                'va_number': obj.payment.va_number,
                'qris_string': obj.payment.qris_string,
                'deeplink_url': obj.payment.deeplink_url,
                'redirect_url': obj.payment.redirect_url,
                'expires_at': obj.payment.expires_at,
                'paid_at': obj.payment.paid_at,
                'created_at': obj.payment.created_at,
            }
        return None
    
    def get_digiflazz_transaction(self, obj):
        """Get Digiflazz transaction details if exists."""
        if hasattr(obj, 'digiflazz_transaction'):
            tx = obj.digiflazz_transaction
            return {
                'ref_id': tx.ref_id,
                'trx_id': tx.trx_id,
                'status': tx.status,
                'message': tx.message,
                'serial_number': tx.serial_number,
                'sku_code': tx.sku_code,
                'customer_no': tx.customer_no,
                'created_at': tx.created_at,
                'updated_at': tx.updated_at,
            }
        return None


class OrderCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating orders with full validation and pricing calculation."""
    coupon_code = serializers.CharField(required=False, allow_blank=True, write_only=True)
    
    class Meta:
        model = Order
        fields = [
            'product_item', 'customer_data', 'payment_method', 'coupon_code'
        ]
    
    def validate_product_item(self, value):
        """Ensure product item is active and available."""
        if not value.is_active:
            raise serializers.ValidationError("Produk ini tidak tersedia.")
        if value.digiflazz_status == 'INACTIVE':
            raise serializers.ValidationError("Produk ini sedang tidak aktif di sistem.")
        return value
    
    def validate_payment_method(self, value):
        """Ensure payment method is active."""
        if not value.is_active:
            raise serializers.ValidationError("Metode pembayaran ini tidak tersedia.")
        return value
    
    def validate_customer_data(self, value):
        """Validate customer data based on product requirements."""
        if not isinstance(value, dict):
            raise serializers.ValidationError("Data pelanggan harus berupa object.")
        
        # Check for required fields (userId is required for all game products)
        if 'userId' not in value or not value['userId']:
            raise serializers.ValidationError("User ID harus diisi.")
        
        return value
    
    def validate(self, data):
        """Cross-field validation and price calculation."""
        product_item = data.get('product_item')
        payment_method = data.get('payment_method')
        coupon_code = data.get('coupon_code', '').strip().upper()
        
        if not product_item or not payment_method:
            raise serializers.ValidationError("Product item dan payment method harus diisi.")
        
        # Calculate base price (use sell_price from ProductItem)
        original_price = product_item.sell_price
        final_price = original_price
        coupon_discount = 0
        applied_coupon = None
        
        # Apply coupon if provided
        if coupon_code:
            try:
                coupon = Coupon.objects.get(code=coupon_code, is_active=True)
                
                # Check date validity
                now = timezone.now()
                if coupon.start_date and now < coupon.start_date:
                    raise serializers.ValidationError({
                        'coupon_code': 'Kupon belum dapat digunakan.'
                    })
                if coupon.end_date and now > coupon.end_date:
                    raise serializers.ValidationError({
                        'coupon_code': 'Kupon sudah kadaluarsa.'
                    })
                
                # Check usage limits
                if coupon.usage_limit and coupon.usage_count >= coupon.usage_limit:
                    raise serializers.ValidationError({
                        'coupon_code': 'Kupon sudah habis digunakan.'
                    })
                
                # Check user limit (requires authenticated user in context)
                user = self.context.get('request').user if self.context.get('request') else None
                if user and coupon.user_limit:
                    user_usage = CouponUsage.objects.filter(
                        coupon=coupon, user=user
                    ).count()
                    if user_usage >= coupon.user_limit:
                        raise serializers.ValidationError({
                            'coupon_code': 'Anda sudah mencapai batas penggunaan kupon ini.'
                        })
                
                # Check minimum purchase
                if coupon.min_purchase and original_price < coupon.min_purchase:
                    raise serializers.ValidationError({
                        'coupon_code': f'Minimal pembelian Rp {coupon.min_purchase:,} untuk kupon ini.'
                    })
                
                # Calculate discount
                if coupon.discount_type == 'PERCENTAGE':
                    coupon_discount = int(original_price * coupon.discount_value / 100)
                    if coupon.max_discount:
                        coupon_discount = min(coupon_discount, coupon.max_discount)
                else:  # FIXED_AMOUNT
                    coupon_discount = int(coupon.discount_value)
                
                final_price = max(0, original_price - coupon_discount)
                applied_coupon = coupon
                
            except Coupon.DoesNotExist:
                raise serializers.ValidationError({
                    'coupon_code': 'Kode kupon tidak valid.'
                })
        
        # Calculate payment fees
        from decimal import Decimal
        
        payment_fee = 0
        if payment_method.fee_type == 'PERCENTAGE':
            payment_fee = int(final_price * float(payment_method.fee_value) / 100)
        else:  # FIXED
            payment_fee = int(payment_method.fee_value)
        
        # Calculate VAT
        vat_amount = 0
        if payment_method.vat_type == 'PERCENTAGE':
            vat_amount = int((final_price + payment_fee) * float(payment_method.vat_value) / 100)
        else:  # FIXED
            vat_amount = int(payment_method.vat_value)
        
        # Total amount
        total_amount = final_price + payment_fee + vat_amount
        
        # Store calculated values in validated_data for use in create()
        data['_calculated_values'] = {
            'original_price': original_price,
            'final_price': final_price,
            'coupon_discount': coupon_discount,
            'payment_fee': payment_fee,
            'vat_amount': vat_amount,
            'total_amount': total_amount,
            'applied_coupon': applied_coupon,
        }
        
        return data
    
    def create(self, validated_data):
        """Create order with calculated pricing."""
        import uuid
        from datetime import timedelta
        
        # Remove temporary data
        calc_values = validated_data.pop('_calculated_values')
        validated_data.pop('coupon_code', None)
        
        # Generate unique order number
        order_number = f"ORD-{uuid.uuid4().hex[:12].upper()}"
        
        # Set payment expiry (24 hours from now)
        payment_expires_at = timezone.now() + timedelta(hours=24)
        
        # Create order
        order = Order.objects.create(
            order_number=order_number,
            original_price=calc_values['original_price'],
            final_price=calc_values['final_price'],
            payment_fee=calc_values['payment_fee'],
            vat_amount=calc_values['vat_amount'],
            total_amount=calc_values['total_amount'],
            payment_expires_at=payment_expires_at,
            status='PENDING',
            **validated_data
        )
        
        # Record coupon usage if applied
        if calc_values['applied_coupon']:
            coupon = calc_values['applied_coupon']
            CouponUsage.objects.create(
                coupon=coupon,
                user=order.user,
                order=order,
                discount_amount=calc_values['coupon_discount']
            )
            # Increment coupon usage count
            coupon.usage_count += 1
            coupon.save(update_fields=['usage_count'])
        
        return order


class OrderListSerializer(serializers.ModelSerializer):
    """Simplified order serializer for lists."""
    product_item_name = serializers.SerializerMethodField()
    payment_method_name = serializers.CharField(source='payment_method.name', read_only=True)
    
    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'product_item_name', 'total_amount',
            'payment_method_name', 'status', 'created_at'
        ]
        read_only_fields = ['id']
    
    def get_product_item_name(self, obj):
        """Get combined product and product item name."""
        if obj.product_item:
            if obj.product_item.product:
                return f"{obj.product_item.product.name} - {obj.product_item.name}"
            return obj.product_item.name
        return "Unknown Product"


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
