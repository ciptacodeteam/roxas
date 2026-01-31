"""
Django REST Framework ViewSets for the main app.
"""
import logging
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from django.db.models import Q, Count, Avg
from django.shortcuts import get_object_or_404

logger = logging.getLogger(__name__)

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
    MobileLegendValidationSerializer,
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
    GET /api/v1/product-items/ - List active product items (excludes MLCU)
    GET /api/v1/product-items/{id}/ - Get product item details
    POST /api/v1/product-items/validate-ml-id/ - Validate Mobile Legend ID
    """
    serializer_class = ProductItemPublicSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [SearchFilter, OrderingFilter, DjangoFilterBackend]
    search_fields = ['name', 'sku_code']
    filterset_fields = ['product', 'product__category']
    ordering_fields = ['name', 'sell_price', 'sort_order']
    
    def get_queryset(self):
        """Filter out MLCU items from public listing."""
        return ProductItem.objects.filter(
            is_active=True
        ).exclude(
            sku_code__icontains='MLCU'
        ).select_related('product', 'product__category')
    
    @action(detail=False, methods=['post'], url_path='validate-ml-id')
    def validate_ml_id(self, request):
        """
        Validate Mobile Legend user ID + server ID using Digiflazz MLCU SKU.
        
        POST /api/v1/product-items/validate-ml-id/
        {
            "user_id": "123456789",
            "server_id": "1234"
        }
        """
        from .serializers import MobileLegendValidationSerializer
        from .integrations.digiflazz import DigiflazzClient, DigiflazzException
        
        serializer = MobileLegendValidationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user_id = serializer.validated_data['user_id']
        server_id = serializer.validated_data['server_id']
        
        # Find MLCU product item
        try:
            mlcu_item = ProductItem.objects.filter(
                sku_code__icontains='MLCU',
                is_active=True
            ).first()
            
            if not mlcu_item:
                return Response({
                    'valid': False,
                    'error': 'Validasi Mobile Legend saat ini tidak tersedia',
                    'message': 'MLCU product not configured'
                }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
            
            # Call Digiflazz to validate
            client = DigiflazzClient()
            customer_no = f"{user_id}{server_id}"  # ML format: userid+serverid
            
            # Generate temporary ref_id for validation
            import uuid
            temp_ref_id = f"MLCHECK-{uuid.uuid4().hex[:12].upper()}"
            
            try:
                # Create a test transaction to validate the account
                # In testing mode, it will validate without actually processing
                result = client.create_transaction(
                    buyer_sku_code=mlcu_item.sku_code,
                    customer_no=customer_no,
                    ref_id=temp_ref_id,
                    testing=True  # Use testing mode for validation only
                )
                
                # Check if validation successful
                # Digiflazz client already unwraps 'data' key, so result IS the transaction data
                # Check status - Pending means account is valid (waiting for callback)
                transaction_status = result.get('status', '')
                account_name = result.get('sn', '') or result.get('customer_name', '') or result.get('message', '')
                rc = result.get('rc', '')
                
                # Status "Pending" or "Sukses" means the account exists
                # RC empty or "00" means success
                if transaction_status in ['Pending', 'Sukses'] or rc in ['', '00']:
                    return Response({
                        'valid': True,
                        'user_id': user_id,
                        'server_id': server_id,
                        'account_name': account_name if account_name else f"Player {user_id}",
                        'message': 'Akun Mobile Legends valid'
                    })
                else:
                    return Response({
                        'valid': False,
                        'error': result.get('message', 'User ID atau Server ID tidak valid'),
                        'message': 'Account not found'
                    }, status=status.HTTP_400_BAD_REQUEST)
                    
            except DigiflazzException as e:
                logger.error(f"Digiflazz validation error: {str(e)}")
                return Response({
                    'valid': False,
                    'error': 'Gagal memvalidasi akun Mobile Legends',
                    'message': str(e)
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            logger.error(f"ML validation error: {str(e)}")
            return Response({
                'valid': False,
                'error': 'Terjadi kesalahan saat validasi',
                'message': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


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
        """Create order and initiate Midtrans payment."""
        from .integrations.midtrans import MidtransClient, MidtransException
        
        # Create the order
        order = serializer.save(user=self.request.user)
        
        try:
            # Initialize Midtrans client
            midtrans_client = MidtransClient()
            
            # Prepare customer details
            customer_details = {
                "email": self.request.user.email,
                "first_name": self.request.user.name or "Customer",
                "phone": getattr(self.request.user, 'phone', ''),
            }
            
            # Prepare item details
            item_details = [{
                "id": str(order.product_item.id),
                "name": order.product_item.name,
                "price": order.final_price,
                "quantity": 1,
            }]
            
            # Add payment fee as separate item
            if order.payment_fee > 0:
                item_details.append({
                    "id": "payment_fee",
                    "name": f"Biaya {order.payment_method.name}",
                    "price": order.payment_fee,
                    "quantity": 1,
                })
            
            # Add VAT as separate item
            if order.vat_amount > 0:
                item_details.append({
                    "id": "vat",
                    "name": "PPN",
                    "price": order.vat_amount,
                    "quantity": 1,
                })
            
            # Create payment based on payment method type
            payment_method = order.payment_method
            payment_response = None
            
            if payment_method.type == 'QRIS':
                payment_response = midtrans_client.charge_qris(
                    order_id=order.order_number,
                    gross_amount=order.total_amount,
                    customer_details=customer_details,
                    item_details=item_details,
                )
            elif payment_method.type == 'BANK_TRANSFER':
                # Extract bank code from midtrans_code (e.g., 'bca', 'bni', 'mandiri')
                bank_code = payment_method.midtrans_code
                payment_response = midtrans_client.charge_bank_transfer(
                    order_id=order.order_number,
                    gross_amount=order.total_amount,
                    bank=bank_code,
                    customer_details=customer_details,
                    item_details=item_details,
                )
            elif payment_method.type == 'E_WALLET':
                # Handle different e-wallets
                if 'gopay' in payment_method.midtrans_code.lower():
                    payment_response = midtrans_client.charge_gopay(
                        order_id=order.order_number,
                        gross_amount=order.total_amount,
                        customer_details=customer_details,
                        item_details=item_details,
                    )
                elif 'shopeepay' in payment_method.midtrans_code.lower():
                    payment_response = midtrans_client.charge_shopeepay(
                        order_id=order.order_number,
                        gross_amount=order.total_amount,
                        customer_details=customer_details,
                        item_details=item_details,
                    )
            else:
                # Default to QRIS for unsupported types
                payment_response = midtrans_client.charge_qris(
                    order_id=order.order_number,
                    gross_amount=order.total_amount,
                    customer_details=customer_details,
                    item_details=item_details,
                )
            
            # Create Payment record
            if payment_response:
                payment = Payment.objects.create(
                    order=order,
                    external_id=order.order_number,
                    transaction_id=payment_response.get('transaction_id'),
                    payment_method=payment_method,
                    amount=order.total_amount,
                    status='pending',
                    payment_url=payment_response.get('payment_url'),
                    va_number=payment_response.get('va_numbers', [{}])[0].get('va_number') if payment_response.get('va_numbers') else None,
                    qris_string=payment_response.get('actions', [{}])[0].get('url') if payment_response.get('actions') else None,
                    deeplink_url=payment_response.get('actions', [{}])[0].get('url') if payment_response.get('actions') else None,
                    expires_at=order.payment_expires_at,
                    webhook_data=payment_response,
                )
                
                logger.info(f"Payment created for order {order.order_number}: {payment.id}")
            
        except MidtransException as e:
            logger.error(f"Midtrans payment creation failed for order {order.order_number}: {str(e)}")
            # Don't fail the order creation, just log the error
            # Payment can be created later or manually
        except Exception as e:
            logger.error(f"Unexpected error creating payment for order {order.order_number}: {str(e)}")
        
        return order
    
    def create(self, request, *args, **kwargs):
        """Override create to return order with payment details."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order = self.perform_create(serializer)
        
        # Get payment details if exists
        payment = Payment.objects.filter(order=order).first()
        
        # Prepare response data
        order_data = OrderSerializer(order).data
        if payment:
            order_data['payment'] = PaymentPublicSerializer(payment).data
        
        headers = self.get_success_headers(order_data)
        return Response(order_data, status=status.HTTP_201_CREATED, headers=headers)


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

