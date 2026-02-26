"""Category and product serializers."""
from rest_framework import serializers
from django.utils import timezone

from ..models.product import (
    Category,
    CategoryInstructionImage,
    Product,
    ProductItem,
    PriceSync,
)


# ── Category ──────────────────────────────────────────────────────────────────

class CategoryInstructionImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = CategoryInstructionImage
        fields = ['id', 'category', 'image_url', 'alt_text', 'sort_order', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class CategorySerializer(serializers.ModelSerializer):
    """Full category serializer with instruction images and product count."""
    instruction_images = CategoryInstructionImageSerializer(many=True, read_only=True)
    # product_count is injected by annotate() in the viewset queryset; fallback to counting
    product_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = [
            'id', 'name', 'slug', 'sort_order',
            'is_active', 'instruction_images', 'product_count',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_product_count(self, obj) -> int:
        # Use annotated value when available (avoids N+1)
        if hasattr(obj, 'active_product_count'):
            return obj.active_product_count
        return obj.products.filter(is_active=True).count()


class CategoryListSerializer(serializers.ModelSerializer):
    """Lightweight category serializer for list views."""
    product_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'sort_order', 'product_count']
        read_only_fields = ['id']

    def get_product_count(self, obj) -> int:
        if hasattr(obj, 'active_product_count'):
            return obj.active_product_count
        return obj.products.filter(is_active=True).count()


# ── Product items ─────────────────────────────────────────────────────────────

class ProductItemPublicSerializer(serializers.ModelSerializer):
    """Public-facing product item serializer (excludes validation items & internal pricing)."""

    class Meta:
        model = ProductItem
        fields = [
            'id', 'name', 'icon_image', 'group',
            'sell_price', 'normal_price', 'discounted_price',
            'is_active', 'sort_order',
        ]
        read_only_fields = ['id']


class ProductItemSerializer(serializers.ModelSerializer):
    """Full product item serializer (admin)."""
    product = serializers.SerializerMethodField()
    product_details = serializers.SerializerMethodField()

    class Meta:
        model = ProductItem
        fields = [
            'id', 'product', 'name', 'sku_code', 'icon_image', 'group',
            'base_price', 'normal_price', 'discounted_price', 'sell_price',
            'is_active', 'is_validation_item', 'sort_order',
            'last_synced_at', 'digiflazz_status',
            'created_at', 'updated_at', 'product_details',
        ]
        read_only_fields = ['id', 'last_synced_at', 'digiflazz_status', 'created_at', 'updated_at']

    def get_product(self, obj):
        if obj.product_id:
            return {'id': str(obj.product_id), 'name': obj.product.name}
        return None

    def get_product_details(self, obj):
        if obj.product_id:
            cat_name = obj.product.category.name if obj.product.category_id else ''
            return {
                'id': str(obj.product_id),
                'name': obj.product.name,
                'category_name': cat_name,
            }
        return None


# ── Products ──────────────────────────────────────────────────────────────────

class ProductSerializer(serializers.ModelSerializer):
    """Full product serializer (detail view)."""
    items = serializers.SerializerMethodField()
    category = CategoryListSerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        source='category',
        write_only=True,
        required=False,
    )
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_details = serializers.SerializerMethodField()
    supports_validation = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 'category', 'category_id', 'category_name', 'category_details',
            'name', 'slug', 'description', 'image', 'banner_image',
            'input_fields', 'customer_no_template',
            'instructions', 'is_active', 'sort_order', 'items',
            'supports_validation', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_items(self, obj):
        items = obj.items.filter(is_active=True, is_validation_item=False).order_by('sort_order', 'name')
        return ProductItemPublicSerializer(items, many=True).data

    def get_supports_validation(self, obj) -> bool:
        return obj.items.filter(is_active=True, is_validation_item=True).exists()

    def get_category_details(self, obj):
        if not obj.category_id:
            return None
        cat = obj.category
        return {
            'id': str(cat.id),
            'name': cat.name,
            'slug': cat.slug,
            'instruction_images': [
                {
                    'id': str(img.id),
                    'image_url': img.image_url,
                    'alt_text': img.alt_text,
                    'sort_order': img.sort_order,
                }
                for img in cat.instruction_images.all().order_by('sort_order')
            ],
        }


class ProductListSerializer(serializers.ModelSerializer):
    """Lightweight product serializer for list views."""
    category_name = serializers.CharField(source='category.name', read_only=True)
    # Annotated by viewset queryset; fallback to DB queries
    item_count = serializers.SerializerMethodField()
    min_price = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = ['id', 'category_name', 'name', 'slug', 'image', 'sort_order', 'item_count', 'min_price']
        read_only_fields = ['id']

    def get_item_count(self, obj) -> int:
        if hasattr(obj, 'active_item_count'):
            return obj.active_item_count
        return obj.items.filter(is_active=True).count()

    def get_min_price(self, obj):
        if hasattr(obj, 'min_sell_price'):
            return obj.min_sell_price
        item = obj.items.filter(is_active=True).order_by('sell_price').first()
        return item.sell_price if item else None


# ── Price sync ────────────────────────────────────────────────────────────────

class PriceSyncSerializer(serializers.ModelSerializer):
    class Meta:
        model = PriceSync
        fields = [
            'id', 'sync_type', 'status', 'started_at', 'completed_at',
            'items_synced', 'items_updated', 'items_created', 'error_message',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
