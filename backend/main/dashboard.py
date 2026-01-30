"""
Dashboard statistics and analytics for admin panel.
"""
from django.contrib.auth import get_user_model
from django.db.models import Count, Sum, Avg, Q, F
from django.utils import timezone
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


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsStaffUser])
def dashboard_stats(request):
    """
    Get comprehensive dashboard statistics for admin panel.
    
    Returns:
        - overview_stats: Total orders, revenue, users, products
        - revenue_by_month: Monthly revenue for current year
        - order_stats: Order status breakdown
        - recent_orders: Latest 10 orders
        - failed_transactions: Recent failed transactions
        - api_health: API integration health status
        - audit_logs: Recent system audit logs
        - notifications: Alert notifications
    """
    now = timezone.now()
    today = now.date()
    this_month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    last_24h = now - timedelta(hours=24)
    last_30d = now - timedelta(days=30)
    this_year_start = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)

    # Overview Statistics
    total_orders = Order.objects.count()
    total_revenue = Order.objects.filter(
        status__in=['PAID', 'PROCESSING', 'COMPLETED']
    ).aggregate(total=Sum('total_amount'))['total'] or 0
    
    total_users = User.objects.filter(role='CUSTOMER').count()
    total_products = Product.objects.filter(is_active=True).count()
    
    # Month-over-month changes
    last_month_start = (this_month_start - timedelta(days=1)).replace(day=1)
    this_month_revenue = Order.objects.filter(
        created_at__gte=this_month_start,
        status__in=['PAID', 'PROCESSING', 'COMPLETED']
    ).aggregate(total=Sum('total_amount'))['total'] or 0
    
    last_month_revenue = Order.objects.filter(
        created_at__gte=last_month_start,
        created_at__lt=this_month_start,
        status__in=['PAID', 'PROCESSING', 'COMPLETED']
    ).aggregate(total=Sum('total_amount'))['total'] or 0
    
    this_month_orders = Order.objects.filter(created_at__gte=this_month_start).count()
    last_month_orders = Order.objects.filter(
        created_at__gte=last_month_start,
        created_at__lt=this_month_start
    ).count()
    
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
    recent_orders = Order.objects.select_related('user').order_by('-created_at')[:10]
    recent_orders_data = [
        {
            'id': order.id,
            'order_number': order.order_number,
            'user': {
                'id': order.user.id,
                'full_name': order.user.full_name,
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
            'id': trans.id,
            'ref_id': trans.ref_id,
            'order_id': trans.order.id if trans.order else None,
            'order_number': trans.order.order_number if trans.order else None,
            'product_name': trans.product_name,
            'amount': float(trans.amount),
            'error_message': trans.error_message,
            'created_at': trans.created_at.isoformat(),
        }
        for trans in failed_transactions
    ]

    # API Health Status (last 24 hours)
    api_health = {}
    
    # Digiflazz Health
    digiflazz_logs = ApiLog.objects.filter(
        created_at__gte=last_24h,
        provider='DIGIFLAZZ'
    )
    digiflazz_total = digiflazz_logs.count()
    digiflazz_success = digiflazz_logs.filter(status_code__gte=200, status_code__lt=300).count()
    digiflazz_avg_response = digiflazz_logs.aggregate(avg=Avg('response_time'))['avg'] or 0
    
    api_health['digiflazz'] = {
        'status': 'healthy' if (digiflazz_success / digiflazz_total * 100 if digiflazz_total > 0 else 0) >= 95 else 'degraded' if digiflazz_total > 0 else 'unknown',
        'total': digiflazz_total,
        'success_rate': round(digiflazz_success / digiflazz_total * 100, 1) if digiflazz_total > 0 else 0,
        'avg_response_time': round(digiflazz_avg_response, 0) if digiflazz_avg_response else 0,
    }
    
    # Midtrans Health
    midtrans_logs = ApiLog.objects.filter(
        created_at__gte=last_24h,
        provider='MIDTRANS'
    )
    midtrans_total = midtrans_logs.count()
    midtrans_success = midtrans_logs.filter(status_code__gte=200, status_code__lt=300).count()
    midtrans_avg_response = midtrans_logs.aggregate(avg=Avg('response_time'))['avg'] or 0
    
    api_health['midtrans'] = {
        'status': 'healthy' if (midtrans_success / midtrans_total * 100 if midtrans_total > 0 else 0) >= 95 else 'degraded' if midtrans_total > 0 else 'unknown',
        'total': midtrans_total,
        'success_rate': round(midtrans_success / midtrans_total * 100, 1) if midtrans_total > 0 else 0,
        'avg_response_time': round(midtrans_avg_response, 0) if midtrans_avg_response else 0,
    }
    
    # Mailgun Health
    mailgun_logs = ApiLog.objects.filter(
        created_at__gte=last_24h,
        provider='MAILGUN'
    )
    mailgun_total = mailgun_logs.count()
    mailgun_success = mailgun_logs.filter(status_code__gte=200, status_code__lt=300).count()
    mailgun_avg_response = mailgun_logs.aggregate(avg=Avg('response_time'))['avg'] or 0
    
    api_health['mailgun'] = {
        'status': 'healthy' if (mailgun_success / mailgun_total * 100 if mailgun_total > 0 else 0) >= 95 else 'degraded' if mailgun_total > 0 else 'unknown',
        'total': mailgun_total,
        'success_rate': round(mailgun_success / mailgun_total * 100, 1) if mailgun_total > 0 else 0,
        'avg_response_time': round(mailgun_avg_response, 0) if mailgun_avg_response else 0,
    }
    
    # Recent API Errors (last hour)
    one_hour_ago = now - timedelta(hours=1)
    recent_api_errors = ApiLog.objects.filter(
        created_at__gte=one_hour_ago,
        status_code__gte=400
    ).order_by('-created_at')[:5]
    
    api_health['recent_errors'] = [
        {
            'id': log.id,
            'provider': log.provider,
            'endpoint': log.endpoint,
            'status_code': log.status_code,
            'error_message': log.error_message,
            'created_at': log.created_at.isoformat(),
        }
        for log in recent_api_errors
    ]

    # Recent Audit Logs
    audit_logs = AuditLog.objects.select_related('user').order_by('-timestamp')[:10]
    audit_logs_data = [
        {
            'id': log.id,
            'action': log.action,
            'model_name': log.model_name,
            'object_id': log.object_id,
            'user': {
                'id': log.user.id,
                'full_name': log.user.full_name,
                'email': log.user.email,
            } if log.user else None,
            'changes': log.changes,
            'timestamp': log.timestamp.isoformat(),
        }
        for log in audit_logs
    ]

    # API Logs (recent)
    recent_api_logs = ApiLog.objects.order_by('-created_at')[:10]
    api_logs_data = [
        {
            'id': log.id,
            'provider': log.provider,
            'endpoint': log.endpoint,
            'method': log.method,
            'status_code': log.status_code,
            'response_time': log.response_time,
            'created_at': log.created_at.isoformat(),
        }
        for log in recent_api_logs
    ]

    # Notifications (action items)
    notifications = {
        'new_orders': Order.objects.filter(
            created_at__gte=last_24h,
            status='PENDING'
        ).count(),
        'pending_attention': Order.objects.filter(
            status='PENDING',
            created_at__lte=now - timedelta(hours=2)
        ).count(),
        'failed_transactions': DigiflazzTransaction.objects.filter(
            created_at__gte=this_month_start,
            status='FAILED'
        ).count(),
        'processing': Order.objects.filter(status='PROCESSING').count(),
    }

    return Response({
        'overview_stats': overview_stats,
        'revenue_by_month': revenue_by_month,
        'order_stats': order_stats_list,
        'recent_orders': recent_orders_data,
        'failed_transactions': failed_transactions_data,
        'api_health': api_health,
        'audit_logs': audit_logs_data,
        'api_logs': api_logs_data,
        'notifications': notifications,
    }, status=status.HTTP_200_OK)
