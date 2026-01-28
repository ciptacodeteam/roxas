from django.contrib import admin
from django.utils.html import format_html
from django.db.models import Count, Sum
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
# INLINE ADMINS
# ============================================

class CategoryInstructionImageInline(admin.TabularInline):
    model = CategoryInstructionImage
    extra = 1
    fields = ["image", "alt_text", "sort_order"]


class ProductItemInline(admin.TabularInline):
    model = ProductItem
    extra = 0
    fields = ["name", "sku_code", "base_price", "sell_price", "is_active", "sort_order"]
    readonly_fields = []
    show_change_link = True


class FlashSaleItemInline(admin.TabularInline):
    model = FlashSaleItem
    extra = 1
    fields = ["product_item", "sale_price", "stock", "sold_count"]
    readonly_fields = ["sold_count"]


# ============================================
# MODEL ADMINS
# ============================================

@admin.register(PaymentMethod)
class PaymentMethodAdmin(admin.ModelAdmin):
    list_display = ["name", "type", "bank", "fee_value", "vat_value", "is_active", "created_at"]
    list_filter = ["type", "is_active", "bank"]
    search_fields = ["name", "midtrans_code"]
    readonly_fields = ["id", "created_at", "updated_at"]
    
    fieldsets = (
        ("Basic Information", {
            "fields": ("type", "bank", "name", "description", "icon", "is_active")
        }),
        ("Midtrans Configuration", {
            "fields": ("midtrans_code",)
        }),
        ("Fee Configuration", {
            "fields": ("fee_type", "fee_value", "vat_type", "vat_value")
        }),
        ("Timestamps", {
            "fields": ("id", "created_at", "updated_at"),
            "classes": ("collapse",)
        }),
    )


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ["name", "slug", "product_count", "is_active", "sort_order", "created_at"]
    list_filter = ["is_active"]
    search_fields = ["name", "slug"]
    prepopulated_fields = {"slug": ("name",)}
    readonly_fields = ["id", "created_at", "updated_at", "product_count"]
    inlines = [CategoryInstructionImageInline]
    
    def product_count(self, obj):
        return obj.products.count()
    product_count.short_description = "Products"


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ["name", "category", "item_count", "is_active", "sort_order", "created_at"]
    list_filter = ["category", "is_active"]
    search_fields = ["name", "slug"]
    prepopulated_fields = {"slug": ("name",)}
    readonly_fields = ["id", "created_at", "updated_at", "item_count"]
    inlines = [ProductItemInline]
    
    fieldsets = (
        ("Basic Information", {
            "fields": ("category", "name", "slug", "description", "is_active", "sort_order")
        }),
        ("Images", {
            "fields": ("image", "banner_image")
        }),
        ("Configuration", {
            "fields": ("input_fields", "instructions")
        }),
        ("Statistics", {
            "fields": ("item_count",),
            "classes": ("collapse",)
        }),
        ("Timestamps", {
            "fields": ("id", "created_at", "updated_at"),
            "classes": ("collapse",)
        }),
    )
    
    def item_count(self, obj):
        return obj.items.count()
    item_count.short_description = "Items"


@admin.register(ProductItem)
class ProductItemAdmin(admin.ModelAdmin):
    list_display = ["name", "product", "sku_code", "base_price", "sell_price", "is_active", "last_synced_at"]
    list_filter = ["product__category", "product", "is_active", "digiflazz_status"]
    search_fields = ["name", "sku_code"]
    readonly_fields = ["id", "created_at", "updated_at", "last_synced_at", "digiflazz_status"]
    
    fieldsets = (
        ("Basic Information", {
            "fields": ("product", "name", "sku_code", "icon_image", "group", "is_active", "sort_order")
        }),
        ("Pricing", {
            "fields": ("base_price", "normal_price", "discounted_price", "sell_price")
        }),
        ("Sync Information", {
            "fields": ("last_synced_at", "digiflazz_status"),
            "classes": ("collapse",)
        }),
        ("Timestamps", {
            "fields": ("id", "created_at", "updated_at"),
            "classes": ("collapse",)
        }),
    )


@admin.register(PriceSync)
class PriceSyncAdmin(admin.ModelAdmin):
    list_display = ["started_at", "sync_type", "status", "items_synced", "items_updated", "items_created", "completed_at"]
    list_filter = ["status", "sync_type"]
    readonly_fields = ["id", "created_at", "updated_at", "started_at", "completed_at"]
    
    def has_add_permission(self, request):
        return False


@admin.register(Coupon)
class CouponAdmin(admin.ModelAdmin):
    list_display = ["code", "discount_type", "discount_value", "usage_count", "usage_limit", "is_active", "end_date"]
    list_filter = ["discount_type", "is_active"]
    search_fields = ["code", "description"]
    readonly_fields = ["id", "created_at", "updated_at", "usage_count"]
    
    fieldsets = (
        ("Basic Information", {
            "fields": ("code", "description", "is_active")
        }),
        ("Discount Configuration", {
            "fields": ("discount_type", "discount_value", "min_purchase", "max_discount")
        }),
        ("Usage Limits", {
            "fields": ("usage_limit", "usage_count", "user_limit")
        }),
        ("Validity Period", {
            "fields": ("start_date", "end_date")
        }),
        ("Timestamps", {
            "fields": ("id", "created_at", "updated_at"),
            "classes": ("collapse",)
        }),
    )


@admin.register(CouponUsage)
class CouponUsageAdmin(admin.ModelAdmin):
    list_display = ["coupon", "user", "order", "discount_amount", "created_at"]
    list_filter = ["coupon", "created_at"]
    search_fields = ["coupon__code", "user__email"]
    readonly_fields = ["id", "created_at"]
    
    def has_add_permission(self, request):
        return False


@admin.register(FlashSale)
class FlashSaleAdmin(admin.ModelAdmin):
    list_display = ["name", "start_time", "end_time", "item_count", "is_active"]
    list_filter = ["is_active", "start_time"]
    search_fields = ["name"]
    readonly_fields = ["id", "created_at", "updated_at", "item_count"]
    inlines = [FlashSaleItemInline]
    
    def item_count(self, obj):
        return obj.items.count()
    item_count.short_description = "Items"


@admin.register(FlashSaleItem)
class FlashSaleItemAdmin(admin.ModelAdmin):
    list_display = ["flash_sale", "product_item", "sale_price", "stock", "sold_count"]
    list_filter = ["flash_sale"]
    search_fields = ["product_item__name", "flash_sale__name"]
    readonly_fields = ["sold_count"]


@admin.register(MarketingBanner)
class MarketingBannerAdmin(admin.ModelAdmin):
    list_display = ["title", "is_active", "sort_order", "start_date", "end_date", "created_at"]
    list_filter = ["is_active", "start_date", "end_date"]
    search_fields = ["title", "description"]
    readonly_fields = ["id", "created_at", "updated_at"]
    
    fieldsets = (
        ("Basic Information", {
            "fields": ("title", "description", "is_active", "sort_order")
        }),
        ("Content", {
            "fields": ("image", "link")
        }),
        ("Schedule", {
            "fields": ("start_date", "end_date")
        }),
        ("Timestamps", {
            "fields": ("id", "created_at", "updated_at"),
            "classes": ("collapse",)
        }),
    )


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ["order_number", "user", "product_item", "status", "total_amount", "payment_method", "created_at"]
    list_filter = ["status", "created_at", "payment_method"]
    search_fields = ["order_number", "user__email"]
    readonly_fields = ["id", "created_at", "updated_at", "paid_at", "completed_at", "payment_status", "digiflazz_status"]
    
    fieldsets = (
        ("Order Information", {
            "fields": ("order_number", "user", "product_item", "status")
        }),
        ("Customer Data", {
            "fields": ("customer_data",)
        }),
        ("Pricing", {
            "fields": ("original_price", "final_price", "payment_fee", "vat_amount", "total_amount")
        }),
        ("Payment", {
            "fields": ("payment_method", "payment_expires_at", "payment_status")
        }),
        ("Refund", {
            "fields": ("refund_amount", "refund_reason", "refunded_at"),
            "classes": ("collapse",)
        }),
        ("Provider Status", {
            "fields": ("digiflazz_status",),
            "classes": ("collapse",)
        }),
        ("Timestamps", {
            "fields": ("id", "created_at", "updated_at", "paid_at", "completed_at"),
            "classes": ("collapse",)
        }),
    )
    
    def payment_status(self, obj):
        if hasattr(obj, 'payment'):
            return obj.payment.get_status_display()
        return "-"
    payment_status.short_description = "Payment Status"
    
    def digiflazz_status(self, obj):
        if hasattr(obj, 'digiflazz_transaction'):
            return obj.digiflazz_transaction.get_status_display()
        return "-"
    digiflazz_status.short_description = "Digiflazz Status"


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ["external_id", "order", "payment_method", "amount", "status", "paid_at", "created_at"]
    list_filter = ["status", "payment_method", "created_at"]
    search_fields = ["external_id", "transaction_id", "order__order_number"]
    readonly_fields = ["id", "created_at", "updated_at", "paid_at"]
    
    fieldsets = (
        ("Basic Information", {
            "fields": ("order", "external_id", "transaction_id", "payment_method", "status", "amount")
        }),
        ("Payment Details", {
            "fields": ("payment_url", "va_number", "qris_string", "deeplink_url", "redirect_url", "expires_at")
        }),
        ("Webhook Data", {
            "fields": ("webhook_data",),
            "classes": ("collapse",)
        }),
        ("Timestamps", {
            "fields": ("id", "created_at", "updated_at", "paid_at"),
            "classes": ("collapse",)
        }),
    )


@admin.register(DigiflazzTransaction)
class DigiflazzTransactionAdmin(admin.ModelAdmin):
    list_display = ["ref_id", "order", "sku_code", "status", "message", "created_at"]
    list_filter = ["status", "created_at"]
    search_fields = ["ref_id", "trx_id", "order__order_number"]
    readonly_fields = ["id", "created_at", "updated_at"]
    
    fieldsets = (
        ("Basic Information", {
            "fields": ("order", "ref_id", "trx_id", "sku_code", "customer_no", "status")
        }),
        ("Result", {
            "fields": ("message", "serial_number")
        }),
        ("Raw Data", {
            "fields": ("response_data", "webhook_data"),
            "classes": ("collapse",)
        }),
        ("Timestamps", {
            "fields": ("id", "created_at", "updated_at"),
            "classes": ("collapse",)
        }),
    )


@admin.register(ProductRating)
class ProductRatingAdmin(admin.ModelAdmin):
    list_display = ["product", "user", "rating", "user_name", "is_active", "created_at"]
    list_filter = ["product", "rating", "is_active"]
    search_fields = ["product__name", "user__email", "user_name", "comment"]
    readonly_fields = ["id", "created_at", "updated_at"]


@admin.register(ApiLog)
class ApiLogAdmin(admin.ModelAdmin):
    list_display = ["provider", "endpoint", "method", "status", "status_code", "response_time", "created_at"]
    list_filter = ["provider", "status", "created_at"]
    search_fields = ["endpoint", "ref_id"]
    readonly_fields = ["id", "created_at"]
    
    fieldsets = (
        ("Request Information", {
            "fields": ("provider", "endpoint", "method")
        }),
        ("Response Information", {
            "fields": ("status", "status_code", "response_time", "error_message")
        }),
        ("Context", {
            "fields": ("order_id", "ref_id")
        }),
        ("Raw Data", {
            "fields": ("request_data", "response_data"),
            "classes": ("collapse",)
        }),
        ("Timestamps", {
            "fields": ("id", "created_at"),
            "classes": ("collapse",)
        }),
    )
    
    def has_add_permission(self, request):
        return False


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ["entity_type", "entity_id", "action", "user", "created_at"]
    list_filter = ["entity_type", "action", "created_at"]
    search_fields = ["entity_type", "entity_id"]
    readonly_fields = ["id", "created_at"]
    
    def has_add_permission(self, request):
        return False


@admin.register(EmailQueue)
class EmailQueueAdmin(admin.ModelAdmin):
    list_display = ["to", "subject", "status", "priority", "attempts", "scheduled_for", "sent_at"]
    list_filter = ["status", "priority", "created_at"]
    search_fields = ["to", "subject"]
    readonly_fields = ["id", "created_at", "updated_at", "sent_at"]
    
    fieldsets = (
        ("Email Information", {
            "fields": ("to", "subject", "status", "priority")
        }),
        ("Content", {
            "fields": ("html", "text"),
            "classes": ("collapse",)
        }),
        ("Delivery", {
            "fields": ("scheduled_for", "sent_at", "attempts", "max_attempts", "last_error")
        }),
        ("Timestamps", {
            "fields": ("id", "created_at", "updated_at"),
            "classes": ("collapse",)
        }),
    )
