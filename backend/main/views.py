"""
Django REST Framework ViewSets for the main app.
"""
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from django.db.models import Q, Count, Avg
from django.shortcuts import get_object_or_404

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
from .serializers import (
    PaymentMethodSerializer,
    PaymentMethodPublicSerializer,
    CategorySerializer,
    CategoryListSerializer,
    CategoryInstructionImageSerializer,
    ProductSerializer,
    ProductListSerializer,
    ProductItemSerializer,
    ProductItemPublicSerializer,
    PriceSyncSerializer,
    CouponSerializer,
    CouponValidationSerializer,
    CouponUsageSerializer,
    FlashSaleSerializer,
    FlashSaleItemSerializer,
    MarketingBannerSerializer,
    OrderSerializer,
    OrderCreateSerializer,
    OrderListSerializer,
    PaymentSerializer,
    PaymentPublicSerializer,
    DigiflazzTransactionSerializer,
    ProductRatingSerializer,
    ProductRatingCreateSerializer,
    ApiLogSerializer,
    AuditLogSerializer,
    EmailQueueSerializer,
)


# ============================================
# PERMISSIONS
# ============================================

class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Allow read-only for everyone, write only for admin/staff.
    """
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user and request.user.is_authenticated and request.user.role == 'STAFF'


class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Allow owners to view their own objects, admin can view all.
    """
    def has_object_permission(self, request, view, obj):
        if request.user.role == 'STAFF':
            return True
        return obj.user == request.user


class IsAdminOnly(permissions.BasePermission):
    """
    Only admin/staff can access.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'STAFF'


# ============================================
# PAYMENT METHOD VIEWSETS
# ============================================

class PaymentMethodViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Public API for payment methods (read-only).
    GET /api/v1/payment-methods/ - List active payment methods
    GET /api/v1/payment-methods/{id}/ - Get payment method details
    """
    queryset = PaymentMethod.objects.filter(is_active=True).order_by('type', 'name')
    serializer_class = PaymentMethodPublicSerializer
    permission_classes = [permissions.AllowAny]


class AdminPaymentMethodViewSet(viewsets.ModelViewSet):
    """
    Admin API for managing payment methods.
    Full CRUD operations for staff only.
    """
    queryset = PaymentMethod.objects.all().order_by('-created_at')
    serializer_class = PaymentMethodSerializer
    permission_classes = [IsAdminOnly]
    filter_backends = [SearchFilter, OrderingFilter, DjangoFilterBackend]
    search_fields = ['name', 'midtrans_code']
    filterset_fields = ['type', 'is_active']
    ordering_fields = ['name', 'created_at', 'type']


# ============================================
# CATEGORY VIEWSETS
# ============================================

class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Public API for categories.
    GET /api/v1/categories/ - List active categories
    GET /api/v1/categories/{slug}/ - Get category details by slug
    """
    queryset = Category.objects.filter(is_active=True).order_by('sort_order', 'name')
    permission_classes = [permissions.AllowAny]
    lookup_field = 'slug'
    
    def get_serializer_class(self):
        if self.action == 'list':
            return CategoryListSerializer
        return CategorySerializer


class AdminCategoryViewSet(viewsets.ModelViewSet):
    """
    Admin API for managing categories.
    Full CRUD operations for staff only.
    """
    queryset = Category.objects.all().order_by('sort_order', 'name')
    serializer_class = CategorySerializer
    permission_classes = [IsAdminOnly]
    filter_backends = [SearchFilter, OrderingFilter]
    search_fields = ['name', 'slug', 'description']
    ordering_fields = ['name', 'sort_order', 'created_at']


class AdminCategoryInstructionImageViewSet(viewsets.ModelViewSet):
    """
    Admin API for managing category instruction images.
    """
    queryset = CategoryInstructionImage.objects.all().order_by('category', 'sort_order')
    serializer_class = CategoryInstructionImageSerializer
    permission_classes = [IsAdminOnly]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['category']
    ordering_fields = ['sort_order', 'created_at']


# ============================================
# PRODUCT VIEWSETS
# ============================================

class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Public API for products.
    GET /api/v1/products/ - List active products
    GET /api/v1/products/{slug}/ - Get product details with items
    """
    permission_classes = [permissions.AllowAny]
    lookup_field = 'slug'
    filter_backends = [SearchFilter, OrderingFilter, DjangoFilterBackend]
    search_fields = ['name', 'description']
    filterset_fields = ['category__slug']
    ordering_fields = ['name', 'sort_order', 'created_at']
    
    def get_queryset(self):
        queryset = Product.objects.filter(is_active=True).select_related('category').prefetch_related('items')
        
        # Filter by category if provided
        category_slug = self.request.query_params.get('category')
        if category_slug:
            queryset = queryset.filter(category__slug=category_slug, category__is_active=True)
        
        return queryset.order_by('sort_order', 'name')
    
    def get_serializer_class(self):
        if self.action == 'list':
            return ProductListSerializer
        return ProductSerializer
    
    @action(detail=True, methods=['get'])
    def ratings(self, request, slug=None):
        """Get ratings for a specific product."""
        product = self.get_object()
        ratings = ProductRating.objects.filter(
            product=product,
            is_active=True
        ).select_related('user').order_by('-created_at')
        
        serializer = ProductRatingSerializer(ratings, many=True)
        return Response(serializer.data)


class AdminProductViewSet(viewsets.ModelViewSet):
    """
    Admin API for managing products.
    Full CRUD operations for staff only.
    """
    queryset = Product.objects.all().select_related('category').order_by('-created_at')
    serializer_class = ProductSerializer
    permission_classes = [IsAdminOnly]
    filter_backends = [SearchFilter, OrderingFilter, DjangoFilterBackend]
    search_fields = ['name', 'slug', 'description']
    filterset_fields = ['category', 'is_active']
    ordering_fields = ['name', 'sort_order', 'created_at']


class ProductItemViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Public API for product items.
    GET /api/v1/product-items/ - List active product items
    GET /api/v1/product-items/{id}/ - Get product item details
    """
    queryset = ProductItem.objects.filter(is_active=True).select_related('product', 'product__category')
    serializer_class = ProductItemPublicSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [SearchFilter, OrderingFilter, DjangoFilterBackend]
    search_fields = ['name', 'sku_code']
    filterset_fields = ['product', 'product__category']
    ordering_fields = ['name', 'sell_price', 'sort_order']


class AdminProductItemViewSet(viewsets.ModelViewSet):
    """
    Admin API for managing product items.
    Full CRUD operations for staff only.
    """
    queryset = ProductItem.objects.all().select_related('product').order_by('-created_at')
    serializer_class = ProductItemSerializer
    permission_classes = [IsAdminOnly]
    filter_backends = [SearchFilter, OrderingFilter, DjangoFilterBackend]
    search_fields = ['name', 'sku_code']
    filterset_fields = ['product', 'is_active', 'digiflazz_status']
    ordering_fields = ['name', 'sell_price', 'created_at', 'last_synced_at']

    @action(detail=False, methods=['post'], url_path='sync-prices', url_name='sync-prices')
    def sync_prices(self, request):
        """
        Trigger price sync from Digiflazz.
        
        POST /api/admin/product-items/sync-prices/
        {
            "type": "FULL" | "PREPAID" | "PASCA",
            "category": "optional",
            "brand": "optional"
        }
        """
        from main.tasks import sync_digiflazz_products
        
        sync_type = request.data.get('type', 'FULL')
        category = request.data.get('category')
        brand = request.data.get('brand')
        
        # Trigger the sync task
        task_result = sync_digiflazz_products.delay(
            category_filter=category,
            brand_filter=brand
        )
        
        return Response({
            'success': True,
            'message': 'Price sync started successfully',
            'task_id': task_result.id,
            'result': {
                'itemsUpdated': 0,
                'itemsCreated': 0,
                'itemsFailed': 0,
                'syncedAt': timezone.now().isoformat()
            }
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'], url_path='sync-status', url_name='sync-status')
    def sync_status(self, request):
        """
        Get current sync status.
        
        GET /api/admin/product-items/sync-status/
        """
        from django.utils import timezone
        from datetime import timedelta
        
        # Get last synced product item
        last_sync = ProductItem.objects.filter(
            last_synced_at__isnull=False
        ).order_by('-last_synced_at').first()
        
        # Consider sync recent if within last 30 seconds (reduced from 2 minutes to fix stuck "syncing" state)
        is_recent_sync = False
        if last_sync and last_sync.last_synced_at:
            is_recent_sync = (timezone.now() - last_sync.last_synced_at) < timedelta(seconds=30)
        
        return Response({
            'is_syncing': is_recent_sync,
            'last_synced_at': last_sync.last_synced_at if last_sync else None,
            'sync_status': 'SUCCESS' if last_sync else 'NEVER_SYNCED',
            'sync_message': f'Last synced {last_sync.last_synced_at.strftime("%Y-%m-%d %H:%M:%S")}' if last_sync else 'No sync performed yet'
        })


# ============================================
# PRICE SYNC VIEWSETS
# ============================================

class AdminPriceSyncViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Admin API for viewing price sync history.
    Read-only as syncs are created by background tasks.
    """
    queryset = PriceSync.objects.all().order_by('-started_at')
    serializer_class = PriceSyncSerializer
    permission_classes = [IsAdminOnly]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['status', 'sync_type']
    ordering_fields = ['started_at', 'completed_at']


# ============================================
# COUPON VIEWSETS
# ============================================

class CouponViewSet(viewsets.GenericViewSet):
    """
    Public API for coupon validation.
    POST /api/v1/coupons/validate/ - Validate a coupon code
    """
    permission_classes = [permissions.AllowAny]
    serializer_class = CouponValidationSerializer
    
    @action(detail=False, methods=['post'])
    def validate(self, request):
        """Validate a coupon code and return discount information."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        code = serializer.validated_data['code']
        order_amount = serializer.validated_data['order_amount']
        user_id = serializer.validated_data.get('user_id')
        
        try:
            coupon = Coupon.objects.get(code=code)
        except Coupon.DoesNotExist:
            return Response(
                {'valid': False, 'error': 'Kode kupon tidak valid'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if coupon is active
        if not coupon.is_active:
            return Response(
                {'valid': False, 'error': 'Kupon tidak aktif'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check date validity
        now = timezone.now()
        if coupon.start_date and now < coupon.start_date:
            return Response(
                {'valid': False, 'error': 'Kupon belum dapat digunakan'},
                status=status.HTTP_400_BAD_REQUEST
            )
        if coupon.end_date and now > coupon.end_date:
            return Response(
                {'valid': False, 'error': 'Kupon sudah kadaluarsa'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check usage limit
        if coupon.usage_limit and coupon.usage_count >= coupon.usage_limit:
            return Response(
                {'valid': False, 'error': 'Kupon sudah habis digunakan'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check user limit
        if user_id and coupon.user_limit:
            user_usage_count = CouponUsage.objects.filter(
                coupon=coupon,
                user_id=user_id
            ).count()
            if user_usage_count >= coupon.user_limit:
                return Response(
                    {'valid': False, 'error': 'Anda sudah mencapai batas penggunaan kupon ini'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Check minimum purchase
        if coupon.min_purchase and order_amount < coupon.min_purchase:
            return Response(
                {'valid': False, 'error': f'Minimal pembelian Rp {coupon.min_purchase:,}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Calculate discount
        if coupon.discount_type == 'PERCENTAGE':
            discount_amount = int(order_amount * coupon.discount_value / 100)
            if coupon.max_discount:
                discount_amount = min(discount_amount, coupon.max_discount)
        else:  # FIXED_AMOUNT
            discount_amount = int(coupon.discount_value)
        
        return Response({
            'valid': True,
            'coupon': CouponSerializer(coupon).data,
            'discount_amount': discount_amount,
            'final_amount': order_amount - discount_amount
        })


class AdminCouponViewSet(viewsets.ModelViewSet):
    """
    Admin API for managing coupons.
    Full CRUD operations for staff only.
    """
    queryset = Coupon.objects.all().order_by('-created_at')
    serializer_class = CouponSerializer
    permission_classes = [IsAdminOnly]
    filter_backends = [SearchFilter, OrderingFilter, DjangoFilterBackend]
    search_fields = ['code', 'description']
    filterset_fields = ['is_active', 'discount_type']
    ordering_fields = ['code', 'created_at', 'end_date']


# ============================================
# FLASH SALE VIEWSETS
# ============================================

class FlashSaleViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Public API for flash sales.
    GET /api/v1/flash-sales/ - List active flash sales
    GET /api/v1/flash-sales/{id}/ - Get flash sale details with items
    """
    serializer_class = FlashSaleSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        now = timezone.now()
        return FlashSale.objects.filter(
            is_active=True,
            start_time__lte=now,
            end_time__gte=now
        ).prefetch_related('items__product_item').order_by('-start_time')


class AdminFlashSaleViewSet(viewsets.ModelViewSet):
    """
    Admin API for managing flash sales.
    Full CRUD operations for staff only.
    """
    queryset = FlashSale.objects.all().order_by('-created_at')
    serializer_class = FlashSaleSerializer
    permission_classes = [IsAdminOnly]
    filter_backends = [SearchFilter, OrderingFilter, DjangoFilterBackend]
    search_fields = ['name']
    filterset_fields = ['is_active']
    ordering_fields = ['name', 'start_time', 'created_at']


class AdminFlashSaleItemViewSet(viewsets.ModelViewSet):
    """
    Admin API for managing flash sale items.
    """
    queryset = FlashSaleItem.objects.all().select_related('flash_sale', 'product_item').order_by('-flash_sale__start_time')
    serializer_class = FlashSaleItemSerializer
    permission_classes = [IsAdminOnly]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['flash_sale']


# ============================================
# MARKETING VIEWSETS
# ============================================

class MarketingBannerViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Public API for marketing banners.
    GET /api/v1/banners/ - List active banners
    """
    serializer_class = MarketingBannerSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        now = timezone.now()
        return MarketingBanner.objects.filter(
            is_active=True
        ).filter(
            Q(start_date__isnull=True) | Q(start_date__lte=now)
        ).filter(
            Q(end_date__isnull=True) | Q(end_date__gte=now)
        ).order_by('sort_order')


class AdminMarketingBannerViewSet(viewsets.ModelViewSet):
    """
    Admin API for managing marketing banners.
    Full CRUD operations for staff only.
    """
    queryset = MarketingBanner.objects.all().order_by('sort_order', '-created_at')
    serializer_class = MarketingBannerSerializer
    permission_classes = [IsAdminOnly]
    filter_backends = [SearchFilter, OrderingFilter, DjangoFilterBackend]
    search_fields = ['title', 'description']
    filterset_fields = ['is_active']
    ordering_fields = ['title', 'sort_order', 'created_at']


# ============================================
# ORDER VIEWSETS
# ============================================

class OrderViewSet(viewsets.ModelViewSet):
    """
    API for managing orders.
    GET /api/v1/orders/ - List user's orders (or all for admin)
    POST /api/v1/orders/ - Create new order
    GET /api/v1/orders/{id}/ - Get order details
    """
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [SearchFilter, OrderingFilter, DjangoFilterBackend]
    search_fields = ['order_number']
    filterset_fields = ['status', 'payment_method']
    ordering_fields = ['created_at', 'total_amount']
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'STAFF':
            return Order.objects.all().select_related(
                'user', 'product_item', 'payment_method'
            ).order_by('-created_at')
        return Order.objects.filter(user=user).select_related(
            'product_item', 'payment_method'
        ).order_by('-created_at')
    
    def get_serializer_class(self):
        if self.action == 'create':
            return OrderCreateSerializer
        elif self.action == 'list':
            return OrderListSerializer
        return OrderSerializer
    
    def perform_create(self, serializer):
        """Create order and initiate payment."""
        serializer.save(user=self.request.user)
        # TODO: Trigger payment creation via Celery task


class AdminOrderViewSet(viewsets.ModelViewSet):
    """
    Admin API for managing all orders.
    Full access to all orders with additional actions.
    """
    queryset = Order.objects.all().select_related(
        'user', 'product_item', 'payment_method'
    ).order_by('-created_at')
    serializer_class = OrderSerializer
    permission_classes = [IsAdminOnly]
    filter_backends = [SearchFilter, OrderingFilter, DjangoFilterBackend]
    search_fields = ['order_number', 'user__email']
    filterset_fields = ['status', 'payment_method', 'product_item__product']
    ordering_fields = ['created_at', 'total_amount', 'status']
    
    @action(detail=True, methods=['post'])
    def refund(self, request, pk=None):
        """Initiate refund for an order."""
        order = self.get_object()
        
        if order.status not in ['PAID', 'PROCESSING', 'COMPLETED']:
            return Response(
                {'error': 'Hanya pesanan yang sudah dibayar yang dapat di-refund'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        refund_amount = request.data.get('refund_amount', order.total_amount)
        refund_reason = request.data.get('refund_reason', '')
        
        order.status = 'REFUNDED'
        order.refund_amount = refund_amount
        order.refund_reason = refund_reason
        order.refunded_at = timezone.now()
        order.save()
        
        # TODO: Trigger refund via payment gateway
        
        return Response(OrderSerializer(order).data)


# ============================================
# PAYMENT VIEWSETS
# ============================================

class PaymentViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API for viewing payments.
    Users can only view their own payments, admin can view all.
    """
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrAdmin]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['status', 'payment_method']
    ordering_fields = ['created_at', 'paid_at']
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'STAFF':
            return Payment.objects.all().select_related('order', 'payment_method').order_by('-created_at')
        return Payment.objects.filter(order__user=user).select_related('order', 'payment_method').order_by('-created_at')
    
    def get_serializer_class(self):
        if self.request.user.role == 'STAFF':
            return PaymentSerializer
        return PaymentPublicSerializer


# ============================================
# RATING VIEWSETS
# ============================================

class ProductRatingViewSet(viewsets.ModelViewSet):
    """
    API for product ratings.
    POST /api/v1/ratings/ - Create rating (authenticated users)
    GET /api/v1/ratings/ - List ratings
    """
    queryset = ProductRating.objects.filter(is_active=True).select_related('product', 'user').order_by('-created_at')
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['product', 'rating']
    ordering_fields = ['created_at', 'rating']
    
    def get_serializer_class(self):
        if self.action == 'create':
            return ProductRatingCreateSerializer
        return ProductRatingSerializer
    
    def get_permissions(self):
        if self.action == 'create':
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class AdminProductRatingViewSet(viewsets.ModelViewSet):
    """
    Admin API for managing product ratings.
    Can activate/deactivate ratings.
    """
    queryset = ProductRating.objects.all().select_related('product', 'user').order_by('-created_at')
    serializer_class = ProductRatingSerializer
    permission_classes = [IsAdminOnly]
    filter_backends = [SearchFilter, DjangoFilterBackend, OrderingFilter]
    search_fields = ['user_name', 'comment']
    filterset_fields = ['product', 'rating', 'is_active']
    ordering_fields = ['created_at', 'rating']


# ============================================
# LOGGING VIEWSETS (ADMIN ONLY)
# ============================================

class AdminApiLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Admin API for viewing API logs.
    Read-only as logs are created automatically.
    """
    queryset = ApiLog.objects.all().order_by('-created_at')
    serializer_class = ApiLogSerializer
    permission_classes = [IsAdminOnly]
    filter_backends = [SearchFilter, DjangoFilterBackend, OrderingFilter]
    search_fields = ['endpoint', 'ref_id']
    filterset_fields = ['provider', 'status']
    ordering_fields = ['created_at', 'response_time']


class AdminAuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Admin API for viewing audit logs.
    Read-only as logs are created automatically.
    """
    queryset = AuditLog.objects.all().select_related('user').order_by('-created_at')
    serializer_class = AuditLogSerializer
    permission_classes = [IsAdminOnly]
    filter_backends = [SearchFilter, DjangoFilterBackend, OrderingFilter]
    search_fields = ['entity_type', 'entity_id', 'user__email']
    filterset_fields = ['entity_type', 'action']
    ordering_fields = ['created_at']


class AdminEmailQueueViewSet(viewsets.ModelViewSet):
    """
    Admin API for managing email queue.
    Can view, retry, or delete queued emails.
    """
    queryset = EmailQueue.objects.all().order_by('-created_at')
    serializer_class = EmailQueueSerializer
    permission_classes = [IsAdminOnly]
    filter_backends = [SearchFilter, DjangoFilterBackend, OrderingFilter]
    search_fields = ['to', 'subject']
    filterset_fields = ['status', 'priority']
    ordering_fields = ['created_at', 'scheduled_for', 'attempts']
    
    @action(detail=True, methods=['post'])
    def retry(self, request, pk=None):
        """Retry sending a failed email."""
        email = self.get_object()
        
        if email.status == 'SENT':
            return Response(
                {'error': 'Email already sent'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        email.status = 'PENDING'
        email.attempts = 0
        email.last_error = None
        email.save()
        
        # TODO: Trigger email sending via Celery
        
        return Response(EmailQueueSerializer(email).data)

