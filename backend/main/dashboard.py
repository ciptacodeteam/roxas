"""
Dashboard statistics and analytics for admin panel.
Optimized with caching and efficient queries.
"""
from django.contrib.auth import get_user_model
from django.db.models import Count, Sum, Avg, Q, F, Prefetch
from django.utils import timezone
from django.core.cache import cache
from datetime import timedelta
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status, permissions

from .models import (
    Order,
    Payment,
    DigiflazzTransaction,
    ApiLog,
    AuditLog,
    EmailQueue,
    Product,
    ProductItem,
)

User = get_user_model()


class IsStaffUser(permissions.BasePermission):
    """Only allow staff users to access."""
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'STAFF'


# Cache timeout in seconds (30 seconds)
DASHBOARD_CACHE_TIMEOUT = 30


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsStaffUser])
def dashboard_stats(request):
    """
    Get comprehensive dashboard statistics for admin panel.
    Cached for 30 seconds to improve performance.
    
    Returns:
        - overview_stats: Total orders, revenue, users, products
        - revenue_by_month: Monthly revenue for current year
        - order_stats: Order status breakdown
        - recent_orders: Latest 10 orders
        - failed_transactions: Recent failed transactions
        - api_health: API integration health status
        - audit_logs: Recent system audit logs
        - api_logs: Recent API logs  
        - notifications: Alert notifications
    """
    # Try to get cached data
    cache_key = 'admin_dashboard_stats'
    cached_data = cache.get(cache_key)
    
    if cached_data:
        return Response(cached_data, status=status.HTTP_200_OK)
    
    now = timezone.now()
    today = now.date()
    this_month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    last_24h = now - timedelta(hours=24)
    last_30d = now - timedelta(days=30)
    this_year_start = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
    last_month_start = (this_month_start - timedelta(days=1)).replace(day=1)

    # Overview Statistics - Use single aggregate query
    order_aggregates = Order.objects.aggregate(
        total_count=Count('id'),
        total_revenue=Sum('total_amount', filter=Q(status__in=['PAID', 'PROCESSING', 'COMPLETED'])),
        this_month_count=Count('id', filter=Q(created_at__gte=this_month_start)),
        this_month_revenue=Sum('total_amount', filter=Q(
            created_at__gte=this_month_start,
            status__in=['PAID', 'PROCESSING', 'COMPLETED']
        )),
        last_month_count=Count('id', filter=Q(
            created_at__gte=last_month_start,
            created_at__lt=this_month_start
        )),
        last_month_revenue=Sum('total_amount', filter=Q(
            created_at__gte=last_month_start,
            created_at__lt=this_month_start,
            status__in=['PAID', 'PROCESSING', 'COMPLETED']
        )),
    )
    
    total_orders = order_aggregates['total_count'] or 0
    total_revenue = order_aggregates['total_revenue'] or 0
    this_month_revenue = order_aggregates['this_month_revenue'] or 0
    last_month_revenue = order_aggregates['last_month_revenue'] or 0
    this_month_orders = order_aggregates['this_month_count'] or 0
    last_month_orders = order_aggregates['last_month_count'] or 0
    
    total_users = User.objects.filter(role='CUSTOMER').count()
    total_products = Product.objects.filter(is_active=True).count()
    
    # Calculate percentage changes
    revenue_change = 0
    if last_month_revenue > 0:
        revenue_change = ((this_month_revenue - last_month_revenue) / last_month_revenue) * 100
    
    orders_change = 0
    if last_month_orders > 0:
        orders_change = ((this_month_orders - last_month_orders) / last_month_orders) * 100

    overview_stats = {
        'total_orders': total_orders,
        'total_revenue': float(total_revenue),
        'total_users': total_users,
        'total_products': total_products,
        'month_revenue': float(this_month_revenue),
        'month_orders': this_month_orders,
        'revenue_change': round(revenue_change, 1),
        'orders_change': round(orders_change, 1),
    }

    # Revenue by month (current year)
    revenue_by_month = []
    for month in range(1, 13):
        month_start = this_year_start.replace(month=month)
        if month == 12:
            month_end = this_year_start.replace(year=this_year_start.year + 1, month=1)
        else:
            month_end = month_start.replace(month=month + 1)
        
        revenue = Order.objects.filter(
            created_at__gte=month_start,
            created_at__lt=month_end,
            status__in=['PAID', 'PROCESSING', 'COMPLETED']
        ).aggregate(total=Sum('total_amount'))['total'] or 0
        
        orders_count = Order.objects.filter(
            created_at__gte=month_start,
            created_at__lt=month_end
        ).count()
        
        revenue_by_month.append({
            'month': month_start.strftime('%B'),
            'revenue': float(revenue),
            'orders': orders_count,
        })

    # Order Statistics by Status
    order_stats = Order.objects.values('status').annotate(
        count=Count('id'),
        total_amount=Sum('total_amount')
    ).order_by('-count')
    
    order_stats_list = [
        {
            'status': stat['status'],
            'count': stat['count'],
            'total_amount': float(stat['total_amount'] or 0)
        }
        for stat in order_stats
    ]

    # Recent Orders (latest 10)
    recent_orders = Order.objects.select_related(
        'user', 'user__staff_profile', 'user__customer_profile'
    ).order_by('-created_at')[:10]
    recent_orders_data = [
        {
            'id': str(order.id),
            'order_number': order.order_number,
            'user': {
                'id': order.user.id,
                'full_name': (
                    order.user.staff_profile.full_name if hasattr(order.user, 'staff_profile') 
                    else order.user.customer_profile.full_name if hasattr(order.user, 'customer_profile')
                    else order.user.email
                ),
                'email': order.user.email,
            } if order.user else None,
            'total_amount': float(order.total_amount),
            'status': order.status,
            'created_at': order.created_at.isoformat(),
        }
        for order in recent_orders
    ]

    # Failed Transactions (this month)
    failed_transactions = DigiflazzTransaction.objects.filter(
        created_at__gte=this_month_start,
        status='FAILED'
    ).select_related('order').order_by('-created_at')[:10]
    
    failed_transactions_data = [
        {
            'id': str(trans.id),
            'ref_id': trans.ref_id,
            'order_id': str(trans.order.id) if trans.order else None,
            'order_number': trans.order.order_number if trans.order else None,
            'product_name': trans.product_name,
            'amount': float(trans.amount),
            'error_message': trans.error_message,
            'created_at': trans.created_at.isoformat(),
        }
        for trans in failed_transactions
    ]

    # API Health Status (last 24 hours) - Optimize with single query per provider
    api_health = {}
    
    # Get all API logs in one query and process in memory
    all_api_logs = ApiLog.objects.filter(
        created_at__gte=last_24h
    ).values('provider').annotate(
        total=Count('id'),
        success_count=Count('id', filter=Q(status_code__gte=200, status_code__lt=300)),
        avg_response=Avg('response_time')
    )
    
    # Convert to dictionary for easy lookup
    api_stats = {log['provider']: log for log in all_api_logs}
    
    # Process each provider
    for provider in ['DIGIFLAZZ', 'MIDTRANS', 'MAILGUN']:
        stats = api_stats.get(provider, {'total': 0, 'success_count': 0, 'avg_response': 0})
        total = stats['total']
        success = stats['success_count']
        avg_response = stats['avg_response'] or 0
        
        success_rate = round(success / total * 100, 1) if total > 0 else 0
        api_health[provider.lower()] = {
            'status': 'healthy' if success_rate >= 95 else 'degraded' if total > 0 else 'unknown',
            'total': total,
            'success_rate': success_rate,
            'avg_response_time': round(avg_response, 0),
        }
    
    # Recent API Errors (last hour)
    one_hour_ago = now - timedelta(hours=1)
    recent_api_errors = ApiLog.objects.filter(
        created_at__gte=one_hour_ago,
        status_code__gte=400
    ).order_by('-created_at')[:5]
    
    api_health['recent_errors'] = [
        {
            'id': str(log.id),
            'provider': log.provider,
            'endpoint': log.endpoint,
            'status_code': log.status_code,
            'error_message': log.error_message,
            'created_at': log.created_at.isoformat(),
        }
        for log in recent_api_errors
    ]

    # Recent Audit Logs
    audit_logs = AuditLog.objects.select_related(
        'user', 'user__staff_profile', 'user__customer_profile'
    ).order_by('-created_at')[:10]
    audit_logs_data = [
        {
            'id': str(log.id),
            'action': log.action,
            'entity_type': log.entity_type,
            'entity_id': log.entity_id,
            'user': {
                'id': log.user.id,
                'full_name': (
                    log.user.staff_profile.full_name if hasattr(log.user, 'staff_profile')
                    else log.user.customer_profile.full_name if hasattr(log.user, 'customer_profile')
                    else log.user.email
                ),
                'email': log.user.email,
            } if log.user else None,
            'changes': log.changes,
            'timestamp': log.created_at.isoformat(),
        }
        for log in audit_logs
    ]

    # API Logs (recent)
    recent_api_logs = ApiLog.objects.order_by('-created_at')[:10]
    api_logs_data = [
        {
            'id': str(log.id),
            'provider': log.provider,
            'endpoint': log.endpoint,
            'method': log.method,
            'status_code': log.status_code,
            'response_time': log.response_time,
            'created_at': log.created_at.isoformat(),
        }
        for log in recent_api_logs
    ]

    # Notifications (action items) - Use single aggregate query
    notification_aggregates = Order.objects.aggregate(
        new_orders=Count('id', filter=Q(
            created_at__gte=last_24h,
            status='PENDING'
        )),
        pending_attention=Count('id', filter=Q(
            status='PENDING',
            created_at__lte=now - timedelta(hours=2)
        )),
        processing=Count('id', filter=Q(status='PROCESSING')),
    )
    
    failed_transaction_count = DigiflazzTransaction.objects.filter(
        created_at__gte=this_month_start,
        status='FAILED'
    ).count()
    
    notifications = {
        'new_orders': notification_aggregates['new_orders'] or 0,
        'pending_attention': notification_aggregates['pending_attention'] or 0,
        'failed_transactions': failed_transaction_count,
        'processing': notification_aggregates['processing'] or 0,
    }

    response_data = {
        'overview_stats': overview_stats,
        'revenue_by_month': revenue_by_month,
        'order_stats': order_stats_list,
        'recent_orders': recent_orders_data,
        'failed_transactions': failed_transactions_data,
        'api_health': api_health,
        'audit_logs': audit_logs_data,
        'api_logs': api_logs_data,
        'notifications': notifications,
    }
    
    # Cache the response for 30 seconds
    cache.set(cache_key, response_data, DASHBOARD_CACHE_TIMEOUT)

    return Response(response_data, status=status.HTTP_200_OK)
