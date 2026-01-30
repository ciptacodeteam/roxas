"""
URL configuration for the main app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    # Public ViewSets
    PaymentMethodViewSet,
    CategoryViewSet,
    ProductViewSet,
    ProductItemViewSet,
    CouponViewSet,
    FlashSaleViewSet,
    MarketingBannerViewSet,
    OrderViewSet,
    PaymentViewSet,
    ProductRatingViewSet,
    # Admin ViewSets
    AdminPaymentMethodViewSet,
    AdminCategoryViewSet,
    AdminCategoryInstructionImageViewSet,
    AdminProductViewSet,
    AdminProductItemViewSet,
    AdminPriceSyncViewSet,
    AdminCouponViewSet,
    AdminFlashSaleViewSet,
    AdminFlashSaleItemViewSet,
    AdminMarketingBannerViewSet,
    AdminOrderViewSet,
    AdminProductRatingViewSet,
    AdminApiLogViewSet,
    AdminAuditLogViewSet,
    AdminEmailQueueViewSet,
)

# Create router for public endpoints
public_router = DefaultRouter()
public_router.register(r'payment-methods', PaymentMethodViewSet, basename='payment-method')
public_router.register(r'categories', CategoryViewSet, basename='category')
public_router.register(r'products', ProductViewSet, basename='product')
public_router.register(r'product-items', ProductItemViewSet, basename='product-item')
public_router.register(r'coupons', CouponViewSet, basename='coupon')
public_router.register(r'flash-sales', FlashSaleViewSet, basename='flash-sale')
public_router.register(r'banners', MarketingBannerViewSet, basename='banner')
public_router.register(r'orders', OrderViewSet, basename='order')
public_router.register(r'payments', PaymentViewSet, basename='payment')
public_router.register(r'ratings', ProductRatingViewSet, basename='rating')

# Create router for admin endpoints
admin_router = DefaultRouter()
admin_router.register(r'payment-methods', AdminPaymentMethodViewSet, basename='admin-payment-method')
admin_router.register(r'categories', AdminCategoryViewSet, basename='admin-category')
admin_router.register(r'category-instruction-images', AdminCategoryInstructionImageViewSet, basename='admin-category-instruction-image')
admin_router.register(r'products', AdminProductViewSet, basename='admin-product')
admin_router.register(r'product-items', AdminProductItemViewSet, basename='admin-product-item')
admin_router.register(r'price-syncs', AdminPriceSyncViewSet, basename='admin-price-sync')
admin_router.register(r'coupons', AdminCouponViewSet, basename='admin-coupon')
admin_router.register(r'flash-sales', AdminFlashSaleViewSet, basename='admin-flash-sale')
admin_router.register(r'flash-sale-items', AdminFlashSaleItemViewSet, basename='admin-flash-sale-item')
admin_router.register(r'marketing-banners', AdminMarketingBannerViewSet, basename='admin-marketing-banner')
admin_router.register(r'orders', AdminOrderViewSet, basename='admin-order')
admin_router.register(r'ratings', AdminProductRatingViewSet, basename='admin-rating')
admin_router.register(r'api-logs', AdminApiLogViewSet, basename='admin-api-log')
admin_router.register(r'audit-logs', AdminAuditLogViewSet, basename='admin-audit-log')
admin_router.register(r'email-queue', AdminEmailQueueViewSet, basename='admin-email-queue')

# Import webhook views
from .webhooks import (
    digiflazz_webhook, digiflazz_webhook_ping,
    midtrans_webhook, midtrans_webhook_ping
)

# Import dashboard views
from .dashboard import dashboard_stats

urlpatterns = [
    # Public endpoints
    path('', include(public_router.urls)),
    
    # Admin endpoints
    path('admin/', include(admin_router.urls)),
    path('admin/dashboard/', dashboard_stats, name='admin-dashboard'),
    
    # Webhooks - Digiflazz
    path('webhooks/digiflazz/', digiflazz_webhook, name='digiflazz-webhook'),
    path('webhooks/digiflazz/ping/', digiflazz_webhook_ping, name='digiflazz-webhook-ping'),
    
    # Webhooks - Midtrans
    path('webhooks/midtrans/', midtrans_webhook, name='midtrans-webhook'),
    path('webhooks/midtrans/ping/', midtrans_webhook_ping, name='midtrans-webhook-ping'),
]
