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
    DigiflazzAccountCheck,
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
    
    @action(detail=True, methods=['post'], url_path='validate-account')
    def validate_account(self, request, slug=None):
        """
        Validate user account for a product using its validation item.
        
        POST /api/v1/products/{slug}/validate-account/
        {
            "user_id": "123456789",
            "server_id": "1234"  // optional, depends on product
        }
        """
        from .integrations.digiflazz import DigiflazzClient, DigiflazzException
        import uuid
        
        product = self.get_object()
        validation_item = product.get_validation_item()
        
        if not validation_item:
            return Response({
                'valid': False,
                'error': 'Validasi akun tidak tersedia untuk produk ini',
                'message': 'No validation item configured for this product'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Get user_id and server_id from request
        user_id = request.data.get('user_id', '').strip()
        server_id = request.data.get('server_id', '').strip()
        
        if not user_id:
            return Response({
                'valid': False,
                'error': 'User ID wajib diisi'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Construct customer_no based on product requirements
        # For Mobile Legends: userid+serverid
        # For others: might be just userid
        if server_id:
            customer_no = f"{user_id}{server_id}"
        else:
            customer_no = user_id
        
        # Check if validation already exists for this customer_no (within last 24 hours)
        from django.utils import timezone
        from datetime import timedelta
        
        recent_check = DigiflazzAccountCheck.objects.filter(
            customer_no=customer_no,
            product=product,
            created_at__gte=timezone.now() - timedelta(hours=24)
        ).order_by('-created_at').first()
        
        # If recent valid check exists, return cached result
        if recent_check and recent_check.is_valid:
            logger.info(f"Using cached validation for {customer_no}")
            return Response({
                'valid': True,
                'user_id': user_id,
                'server_id': server_id if server_id else None,
                'account_name': recent_check.account_name,
                'status': recent_check.status,
                'check_id': str(recent_check.id),
                'message': 'Akun valid (dari cache)',
                'cached': True
            })
        
        # Call Digiflazz to validate
        client = DigiflazzClient()
        temp_ref_id = f"CHECK-{uuid.uuid4().hex[:12].upper()}"
        
        # Create account check record
        account_check = DigiflazzAccountCheck.objects.create(
            ref_id=temp_ref_id,
            product=product,
            sku_code=validation_item.sku_code,
            customer_no=customer_no,
            user_id=user_id,
            server_id=server_id,
            status='PENDING'
        )
        
        try:
            result = client.create_transaction(
                buyer_sku_code=validation_item.sku_code,
                customer_no=customer_no,
                ref_id=temp_ref_id,
                testing=False  # Use production mode
            )
            
            # Check if validation successful
            transaction_status = result.get('status', '')
            # Get account name - only use sn or customer_name, not message
            account_name = result.get('sn', '') or result.get('customer_name', '')
            rc = result.get('rc', '')
            message = result.get('message', '')
            
            # If account_name is empty, try to extract from message
            # Format: "User ID 29180822 Zone 2043 / Username ♡+"
            if not account_name and message and 'Username' in message:
                try:
                    # Extract text after "Username "
                    username_part = message.split('Username')[-1].strip()
                    # Get text until first space (or end of string)
                    extracted_name = username_part.split()[0] if username_part else ''
                    if extracted_name:
                        account_name = extracted_name
                        logger.info(f"Extracted username from message: {account_name}")
                except Exception as e:
                    logger.warning(f"Failed to extract username from message: {e}")
            
            # Update account check record
            account_check.status = transaction_status
            account_check.message = message
            account_check.rc = rc
            account_check.response_data = result
            account_check.account_name = account_name or ''
            
            # Status "Pending" or "Sukses" means the account exists
            if transaction_status in ['Pending', 'Sukses'] or rc in ['', '00']:
                account_check.is_valid = True
                account_check.save()
                
                # If account_name is empty and status is Pending, use a better default
                if not account_name and transaction_status == 'Pending':
                    account_name = None  # Let frontend handle pending state
                elif not account_name:
                    account_name = f"Player {user_id}"
                    
                return Response({
                    'valid': True,
                    'user_id': user_id,
                    'server_id': server_id if server_id else None,
                    'account_name': account_name,
                    'status': transaction_status,
                    'check_id': str(account_check.id),  # Return check_id for polling
                    'message': 'Akun valid' if transaction_status == 'Sukses' else message
                })
            else:
                account_check.is_valid = False
                account_check.save()
                
                return Response({
                    'valid': False,
                    'error': result.get('message', 'User ID tidak valid'),
                    'message': 'Account not found'
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except DigiflazzException as e:
            logger.error(f"Digiflazz validation error: {str(e)}")
            return Response({
                'valid': False,
                'error': str(e),
                'message': 'Validation service error'
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except Exception as e:
            logger.error(f"Unexpected validation error: {str(e)}")
            return Response({
                'valid': False,
                'error': 'Terjadi kesalahan saat validasi',
                'message': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['get'], url_path='check-validation-status/(?P<check_id>[^/.]+)')
    def check_validation_status(self, request, slug=None, check_id=None):
        """
        Check the status of an account validation check.
        Used for polling when validation is pending.
        
        GET /api/v1/products/{slug}/check-validation-status/{check_id}/
        """
        try:
            account_check = DigiflazzAccountCheck.objects.get(id=check_id)
            
            return Response({
                'valid': account_check.is_valid,
                'user_id': account_check.user_id,
                'server_id': account_check.server_id,
                'account_name': account_check.account_name or None,
                'status': account_check.status,
                'message': account_check.message,
            })
        except DigiflazzAccountCheck.DoesNotExist:
            return Response({
                'valid': False,
                'error': 'Validation check not found'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Error checking validation status: {str(e)}")
            return Response({
                'valid': False,
                'error': 'Failed to check validation status'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


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
        """Filter out validation items (like MLCU) from public listing."""
        return ProductItem.objects.filter(
            is_active=True,
            is_validation_item=False
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
            
            # Check if validation already exists for this customer_no (within last 24 hours)
            from django.utils import timezone
            from datetime import timedelta
            
            recent_check = DigiflazzAccountCheck.objects.filter(
                customer_no=customer_no,
                sku_code__icontains='MLCU',
                created_at__gte=timezone.now() - timedelta(hours=24)
            ).order_by('-created_at').first()
            
            # If recent valid check exists, return cached result
            if recent_check and recent_check.is_valid:
                logger.info(f"Using cached ML validation for {customer_no}")
                return Response({
                    'valid': True,
                    'user_id': user_id,
                    'server_id': server_id,
                    'account_name': recent_check.account_name if recent_check.account_name else f"Player {user_id}",
                    'message': 'Akun Mobile Legends valid (dari cache)',
                    'cached': True
                })
            
            # Generate temporary ref_id for validation
            import uuid
            temp_ref_id = f"MLCHECK-{uuid.uuid4().hex[:12].upper()}"
            
            # Get the Mobile Legends product for reference
            ml_product = mlcu_item.product if hasattr(mlcu_item, 'product') else None
            
            # Create account check record
            account_check = DigiflazzAccountCheck.objects.create(
                ref_id=temp_ref_id,
                product=ml_product,
                sku_code=mlcu_item.sku_code,
                customer_no=customer_no,
                user_id=user_id,
                server_id=server_id,
                status='PENDING'
            )
            
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
                account_name = result.get('sn', '') or result.get('customer_name', '')
                rc = result.get('rc', '')
                message = result.get('message', '')
                
                # If account_name is empty, try to extract from message
                # Format: "User ID 29180822 Zone 2043 / Username ♡+"
                if not account_name and message and 'Username' in message:
                    try:
                        # Extract text after "Username "
                        username_part = message.split('Username')[-1].strip()
                        # Get text until first space (or end of string)
                        extracted_name = username_part.split()[0] if username_part else ''
                        if extracted_name:
                            account_name = extracted_name
                            logger.info(f"Extracted username from message: {account_name}")
                    except Exception as e:
                        logger.warning(f"Failed to extract username from message: {e}")
                
                # Update account check record
                account_check.status = transaction_status
                account_check.message = message
                account_check.rc = rc
                account_check.response_data = result
                account_check.account_name = account_name or ''
                
                # Status "Pending" or "Sukses" means the account exists
                # RC empty or "00" means success
                if transaction_status in ['Pending', 'Sukses'] or rc in ['', '00']:
                    account_check.is_valid = True
                    account_check.save()
                    
                    return Response({
                        'valid': True,
                        'user_id': user_id,
                        'server_id': server_id,
                        'account_name': account_name if account_name else f"Player {user_id}",
                        'message': 'Akun Mobile Legends valid'
                    })
                else:
                    account_check.is_valid = False
                    account_check.save()
                    
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
    Public API for coupon validation and listing.
    GET /api/v1/coupons/ - List all active coupons
    POST /api/v1/coupons/validate/ - Validate a coupon code
    POST /api/v1/coupons/applicable/ - Get applicable coupons for an order
    """
    permission_classes = [permissions.AllowAny]
    serializer_class = CouponValidationSerializer
    
    def list(self, request):
        """List all active coupons."""
        coupons = Coupon.objects.filter(
            is_active=True
        ).order_by('-created_at')
        
        # Filter by date if coupons have start/end dates
        now = timezone.now()
        coupons = coupons.filter(
            Q(start_date__isnull=True) | Q(start_date__lte=now)
        ).filter(
            Q(end_date__isnull=True) | Q(end_date__gte=now)
        )
        
        serializer = CouponSerializer(coupons, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def applicable(self, request):
        """Get applicable coupons for a given order amount."""
        order_amount = request.data.get('order_amount', 0)
        user_id = request.data.get('user_id')
        
        # Get all active coupons
        coupons = Coupon.objects.filter(is_active=True)
        
        # Filter by date
        now = timezone.now()
        coupons = coupons.filter(
            Q(start_date__isnull=True) | Q(start_date__lte=now)
        ).filter(
            Q(end_date__isnull=True) | Q(end_date__gte=now)
        )
        
        applicable_ids = []
        all_coupons_data = []
        
        for coupon in coupons:
            # Check usage limit
            if coupon.usage_limit and coupon.usage_count >= coupon.usage_limit:
                continue
            
            # Check user limit
            is_applicable = True
            if user_id and coupon.user_limit:
                user_usage_count = CouponUsage.objects.filter(
                    coupon=coupon,
                    user_id=user_id
                ).count()
                if user_usage_count >= coupon.user_limit:
                    is_applicable = False
            
            # Check minimum purchase
            if coupon.min_purchase and order_amount < coupon.min_purchase:
                is_applicable = False
            
            coupon_data = CouponSerializer(coupon).data
            all_coupons_data.append(coupon_data)
            
            if is_applicable:
                applicable_ids.append(str(coupon.id))
        
        return Response({
            'coupons': all_coupons_data,
            'applicable_ids': applicable_ids
        })
    
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
                'user', 'product_item__product', 'payment_method'
            ).order_by('-created_at')
        return Order.objects.filter(user=user).select_related(
            'product_item__product', 'payment_method'
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
            
            # Get phone and name from user profile
            user_phone = ''
            user_name = 'Customer'
            try:
                from account.models import UserRole
                if self.request.user.role == UserRole.STAFF and hasattr(self.request.user, "staff_profile"):
                    user_phone = self.request.user.staff_profile.contact_phone or ''
                    user_name = self.request.user.staff_profile.full_name or 'Customer'
                elif self.request.user.role == UserRole.CUSTOMER and hasattr(self.request.user, "customer_profile"):
                    user_phone = self.request.user.customer_profile.contact_phone or ''
                    user_name = self.request.user.customer_profile.full_name or 'Customer'
            except Exception:
                pass
            
            # Prepare customer details
            customer_details = {
                "email": self.request.user.email,
                "first_name": user_name,
                "phone": user_phone,
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
                # Extract VA number with multiple fallbacks
                va_number = None
                if payment_response.get('va_numbers'):
                    # Standard format: va_numbers array
                    va_number = payment_response['va_numbers'][0].get('va_number')
                elif payment_response.get('permata_va_number'):
                    # Permata specific field
                    va_number = payment_response.get('permata_va_number')
                elif payment_response.get('biller_code'):
                    # Mandiri specific: biller_code + bill_key
                    va_number = f"{payment_response.get('biller_code')}{payment_response.get('bill_key', '')}"
                
                # Extract QRIS
                qris_string = None
                if payment_response.get('actions'):
                    qris_string = payment_response['actions'][0].get('url')
                elif payment_response.get('qr_string'):
                    qris_string = payment_response.get('qr_string')
                
                # Extract deeplink
                deeplink_url = None
                if payment_response.get('actions'):
                    for action in payment_response.get('actions', []):
                        if action.get('name') in ['deeplink-redirect', 'generate-qr-code']:
                            deeplink_url = action.get('url')
                            break
                
                logger.info(
                    f"Creating payment for {order.order_number}: "
                    f"VA={va_number}, QRIS={bool(qris_string)}, "
                    f"Deeplink={bool(deeplink_url)}"
                )
                
                payment = Payment.objects.create(
                    order=order,
                    external_id=order.order_number,
                    transaction_id=payment_response.get('transaction_id'),
                    payment_method=payment_method,
                    amount=order.total_amount,
                    status='pending',
                    payment_url=payment_response.get('payment_url'),
                    va_number=va_number,
                    qris_string=qris_string,
                    deeplink_url=deeplink_url,
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

