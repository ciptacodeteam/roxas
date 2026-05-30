/**
 * Admin Dashboard API Service
 * Handles fetching and transforming dashboard statistics and analytics
 */

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { API_URL } from "@/lib/api-url";

const API_BASE_URL = API_URL;

/**
 * Fetch wrapper with error handling
 */
async function fetchFromAPI<T>(endpoint: string): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: `HTTP ${response.status}: ${response.statusText}`,
    }));
    throw new Error(error.message || error.detail || "Request failed");
  }

  return response.json();
}

// ============================================
// Types
// ============================================

export interface User {
  id: number;
  fullName: string;
  email: string;
}

export interface OverviewStats {
  totalOrders: number;
  totalRevenue: number;
  totalUsers: number;
  totalProducts: number;
  monthRevenue: number;
  monthOrders: number;
  revenueChange: number;
  ordersChange: number;
}

export interface RevenueByMonth {
  month: string;
  revenue: number;
  orders: number;
}

export interface OrderStats {
  status: string;
  count: number;
  totalAmount: number;
}

export interface RecentOrder {
  id: number;
  orderNumber: string;
  user: User | null;
  totalAmount: number;
  status: string;
  createdAt: string;
}

export interface FailedTransaction {
  id: number;
  refId: string;
  orderId: number | null;
  orderNumber: string | null;
  productName: string;
  amount: number;
  errorMessage: string;
  createdAt: string;
}

export interface ApiHealthStatus {
  status: "healthy" | "degraded" | "unknown";
  total: number;
  successRate: number;
  avgResponseTime: number;
}

export interface ApiError {
  id: number;
  provider: string;
  endpoint: string;
  statusCode: number;
  errorMessage: string;
  createdAt: string;
}

export interface ApiHealth {
  digiflazz: ApiHealthStatus;
  midtrans: ApiHealthStatus;
  resend: ApiHealthStatus;
  recentErrors: ApiError[];
}

export interface AuditLog {
  id: number;
  action: string;
  modelName: string;
  objectId: number;
  user: User | null;
  changes: Record<string, unknown>;
  timestamp: string;
}

export interface ApiLog {
  id: number;
  provider: string;
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  createdAt: string;
}

export interface Notifications {
  newOrders: number;
  pendingAttention: number;
  failedTransactions: number;
  processing: number;
}

export interface DashboardData {
  overviewStats: OverviewStats;
  revenueByMonth: RevenueByMonth[];
  orderStats: OrderStats[];
  recentOrders: RecentOrder[];
  failedTransactions: FailedTransaction[];
  apiHealth: ApiHealth;
  auditLogs: AuditLog[];
  apiLogs: ApiLog[];
  notifications: Notifications;
}

// Backend response (snake_case)
interface DashboardResponse {
  overview_stats: {
    total_orders: number;
    total_revenue: number;
    total_users: number;
    total_products: number;
    month_revenue: number;
    month_orders: number;
    revenue_change: number;
    orders_change: number;
  };
  revenue_by_month: Array<{
    month: string;
    revenue: number;
    orders: number;
  }>;
  order_stats: Array<{
    status: string;
    count: number;
    total_amount: number;
  }>;
  recent_orders: Array<{
    id: number;
    order_number: string;
    user: {
      id: number;
      full_name: string;
      email: string;
    } | null;
    total_amount: number;
    status: string;
    created_at: string;
  }>;
  failed_transactions: Array<{
    id: number;
    ref_id: string;
    order_id: number | null;
    order_number: string | null;
    product_name: string;
    amount: number;
    error_message: string;
    created_at: string;
  }>;
  api_health: {
    digiflazz: {
      status: "healthy" | "degraded" | "unknown";
      total: number;
      success_rate: number;
      avg_response_time: number;
    };
    midtrans: {
      status: "healthy" | "degraded" | "unknown";
      total: number;
      success_rate: number;
      avg_response_time: number;
    };
    resend: {
      status: "healthy" | "degraded" | "unknown";
      total: number;
      success_rate: number;
      avg_response_time: number;
    };
    recent_errors: Array<{
      id: number;
      provider: string;
      endpoint: string;
      status_code: number;
      error_message: string;
      created_at: string;
    }>;
  };
  audit_logs: Array<{
    id: number;
    action: string;
    model_name: string;
    object_id: number;
    user: {
      id: number;
      full_name: string;
      email: string;
    } | null;
    changes: Record<string, unknown>;
    timestamp: string;
  }>;
  api_logs: Array<{
    id: number;
    provider: string;
    endpoint: string;
    method: string;
    status_code: number;
    response_time: number;
    created_at: string;
  }>;
  notifications: {
    new_orders: number;
    pending_attention: number;
    failed_transactions: number;
    processing: number;
  };
}

// ============================================
// Transform Functions (snake_case -> camelCase)
// ============================================

function transformUser(user: { id: number; full_name: string; email: string } | null): User | null {
  if (!user) return null;
  return {
    id: user.id,
    fullName: user.full_name,
    email: user.email,
  };
}

function transformDashboardData(data: DashboardResponse): DashboardData {
  return {
    overviewStats: {
      totalOrders: data.overview_stats.total_orders,
      totalRevenue: data.overview_stats.total_revenue,
      totalUsers: data.overview_stats.total_users,
      totalProducts: data.overview_stats.total_products,
      monthRevenue: data.overview_stats.month_revenue,
      monthOrders: data.overview_stats.month_orders,
      revenueChange: data.overview_stats.revenue_change,
      ordersChange: data.overview_stats.orders_change,
    },
    revenueByMonth: data.revenue_by_month,
    orderStats: data.order_stats.map((stat) => ({
      status: stat.status,
      count: stat.count,
      totalAmount: stat.total_amount,
    })),
    recentOrders: data.recent_orders.map((order) => ({
      id: order.id,
      orderNumber: order.order_number,
      user: transformUser(order.user),
      totalAmount: order.total_amount,
      status: order.status,
      createdAt: order.created_at,
    })),
    failedTransactions: data.failed_transactions.map((trans) => ({
      id: trans.id,
      refId: trans.ref_id,
      orderId: trans.order_id,
      orderNumber: trans.order_number,
      productName: trans.product_name,
      amount: trans.amount,
      errorMessage: trans.error_message,
      createdAt: trans.created_at,
    })),
    apiHealth: {
      digiflazz: {
        status: data.api_health.digiflazz.status,
        total: data.api_health.digiflazz.total,
        successRate: data.api_health.digiflazz.success_rate,
        avgResponseTime: data.api_health.digiflazz.avg_response_time,
      },
      midtrans: {
        status: data.api_health.midtrans.status,
        total: data.api_health.midtrans.total,
        successRate: data.api_health.midtrans.success_rate,
        avgResponseTime: data.api_health.midtrans.avg_response_time,
      },
      resend: {
        status: data.api_health.resend.status,
        total: data.api_health.resend.total,
        successRate: data.api_health.resend.success_rate,
        avgResponseTime: data.api_health.resend.avg_response_time,
      },
      recentErrors: data.api_health.recent_errors.map((error) => ({
        id: error.id,
        provider: error.provider,
        endpoint: error.endpoint,
        statusCode: error.status_code,
        errorMessage: error.error_message,
        createdAt: error.created_at,
      })),
    },
    auditLogs: data.audit_logs.map((log) => ({
      id: log.id,
      action: log.action,
      modelName: log.model_name,
      objectId: log.object_id,
      user: transformUser(log.user),
      changes: log.changes,
      timestamp: log.timestamp,
    })),
    apiLogs: data.api_logs.map((log) => ({
      id: log.id,
      provider: log.provider,
      endpoint: log.endpoint,
      method: log.method,
      statusCode: log.status_code,
      responseTime: log.response_time,
      createdAt: log.created_at,
    })),
    notifications: {
      newOrders: data.notifications.new_orders,
      pendingAttention: data.notifications.pending_attention,
      failedTransactions: data.notifications.failed_transactions,
      processing: data.notifications.processing,
    },
  };
}

// ============================================
// API Functions
// ============================================

export async function getDashboardStats(): Promise<DashboardData> {
  const response = await fetchFromAPI<DashboardResponse>("/api/v1/admin/dashboard/");
  return transformDashboardData(response);
}

// ============================================
// Query Hooks
// ============================================

export function useDashboard(
  options?: Omit<UseQueryOptions<DashboardData, Error>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: getDashboardStats,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    staleTime: 0,
    gcTime: 30000, // Cache for 30 seconds
    ...options,
  });
}
