"""Promotion serializers: Coupon, FlashSale, MarketingBanner."""
from rest_framework import serializers
from django.utils import timezone

from ..models.promotion import (
    Coupon,
    CouponUsage,
    FlashSale,
    FlashSaleItem,
    MarketingBanner,
)


# ── Coupon ────────────────────────────────────────────────────────────────────

class CouponSerializer(serializers.ModelSerializer):
    is_valid = serializers.SerializerMethodField()

    class Meta:
        model = Coupon
        fields = [
            'id', 'code', 'description', 'discount_type', 'discount_value',
            'min_purchase', 'max_discount', 'usage_limit', 'usage_count',
            'user_limit', 'start_date', 'end_date', 'is_active', 'is_valid',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'usage_count', 'created_at', 'updated_at']

    def get_is_valid(self, obj) -> bool:
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
    code = serializers.CharField(max_length=50)
    user_id = serializers.UUIDField(required=False)
    order_amount = serializers.IntegerField(min_value=0)


class CouponUsageSerializer(serializers.ModelSerializer):
    coupon_code = serializers.CharField(source='coupon.code', read_only=True)

    class Meta:
        model = CouponUsage
        fields = ['id', 'coupon', 'coupon_code', 'user', 'order', 'discount_amount', 'created_at']
        read_only_fields = ['id', 'created_at']


# ── Flash sale ────────────────────────────────────────────────────────────────

class FlashSaleItemSerializer(serializers.ModelSerializer):
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
            'normal_price', 'discount_percentage', 'stock', 'sold_count',
        ]
        read_only_fields = ['id', 'sold_count']

    def get_discount_percentage(self, obj) -> float:
        normal = obj.product_item.normal_price
        if normal > 0:
            return round(((normal - obj.sale_price) / normal) * 100, 2)
        return 0

    def validate(self, data):
        sale_price = data.get('sale_price')
        stock = data.get('stock')
        product_item = data.get('product_item')
        flash_sale = data.get('flash_sale')

        if sale_price is not None and sale_price <= 0:
            raise serializers.ValidationError({'sale_price': 'Sale price must be greater than 0'})
        if stock is not None and stock < 0:
            raise serializers.ValidationError({'stock': 'Stock cannot be negative'})
        if product_item and sale_price is not None and sale_price >= product_item.normal_price:
            raise serializers.ValidationError(
                {'sale_price': f'Sale price must be lower than normal price (Rp {product_item.normal_price:,})'}
            )
        if self.instance is None and product_item and flash_sale:
            if FlashSaleItem.objects.filter(flash_sale=flash_sale, product_item=product_item).exists():
                raise serializers.ValidationError({'product_item': 'This product is already in the flash sale'})
        return data


class FlashSaleSerializer(serializers.ModelSerializer):
    items = FlashSaleItemSerializer(many=True, read_only=True)
    is_active_now = serializers.SerializerMethodField()

    class Meta:
        model = FlashSale
        fields = ['id', 'name', 'start_time', 'end_time', 'is_active', 'is_active_now', 'items', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_is_active_now(self, obj) -> bool:
        if not obj.is_active:
            return False
        now = timezone.now()
        return obj.start_time <= now <= obj.end_time


# ── Marketing banner ──────────────────────────────────────────────────────────

class MarketingBannerSerializer(serializers.ModelSerializer):
    is_active_now = serializers.SerializerMethodField()

    class Meta:
        model = MarketingBanner
        fields = [
            'id', 'title', 'description', 'image', 'link',
            'is_active', 'is_active_now', 'sort_order',
            'start_date', 'end_date', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_is_active_now(self, obj) -> bool:
        if not obj.is_active:
            return False
        now = timezone.now()
        if obj.start_date and now < obj.start_date:
            return False
        if obj.end_date and now > obj.end_date:
            return False
        return True
