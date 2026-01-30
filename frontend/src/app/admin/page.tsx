"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw, Activity } from "lucide-react";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AppSidebar } from "@/components/app-sidebar";
import { AdminHeader } from "@/components/admin-header";
import { SectionCards } from "@/components/section-cards";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { useDashboard } from "@/lib/dashboard";
import { NotificationBanner } from "@/components/admin/dashboard/notification-banner";
import { ApiHealthStatus } from "@/components/admin/dashboard/api-health-status";
import { DashboardTabs } from "@/components/admin/dashboard/dashboard-tabs";
import { formatTimeAgo } from "@/lib/date-utils";

// Auto-refresh interval in milliseconds (30 seconds)
const AUTO_REFRESH_INTERVAL = 30000;

export default function AdminDashboardPage() {
  const router = useRouter();
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  
  const { data: dashboardData, isLoading, refetch, isFetching } = useDashboard({
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  // Auto-refresh dashboard every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
      setLastRefresh(new Date());
    }, AUTO_REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [refetch]);

  const handleManualRefresh = () => {
    refetch();
    setLastRefresh(new Date());
  };

  if (isLoading) {
    return (
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" />
        <SidebarInset>
          <AdminHeader />
          <div className="flex flex-1 items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading dashboard...</p>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  const notifications = dashboardData?.notifications ?? {
    newOrders: 0,
    pendingAttention: 0,
    failedTransactions: 0,
    processing: 0,
  };

  const apiHealth = dashboardData?.apiHealth ?? null;
  const recentOrders = dashboardData?.recentOrders ?? [];
  const failedTransactions = dashboardData?.failedTransactions ?? [];
  const auditLogs = dashboardData?.auditLogs ?? [];
  const apiLogs = dashboardData?.apiLogs ?? [];

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <AdminHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              {/* Notification Banner */}
              {(notifications.failedTransactions > 0 || notifications.pendingAttention > 0) && (
                <div className="px-4 lg:px-6">
                  <NotificationBanner
                    notifications={notifications}
                    onViewFailed={() => router.push("/admin/orders?status=FAILED")}
                    onViewPending={() => router.push("/admin/orders?status=PENDING")}
                  />
                </div>
              )}

              {/* Quick Stats Cards */}
              <div className="px-4 lg:px-6">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h2 className="text-lg font-semibold">Dashboard Overview</h2>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Activity className="h-3 w-3" />
                      <span>Last updated: {formatTimeAgo(lastRefresh.toISOString())}</span>
                    </div>
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleManualRefresh}
                        disabled={isFetching}
                        className="gap-2"
                      >
                        <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
                        Refresh
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Auto-refreshes every 30 seconds</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>

              {dashboardData && <SectionCards data={dashboardData} />}

              {/* API Health Status */}
              {apiHealth && (
                <div className="px-4 lg:px-6">
                  <ApiHealthStatus apiHealth={apiHealth} />
                </div>
              )}

              {/* Revenue Chart */}
              <div className="px-4 lg:px-6">
                <ChartAreaInteractive />
              </div>

              {/* Dashboard Tabs */}
              <div className="px-4 lg:px-6">
                <DashboardTabs
                  recentOrders={recentOrders}
                  failedTransactions={failedTransactions}
                  auditLogs={auditLogs}
                  apiLogs={apiLogs}
                  onViewOrder={(orderId) => router.push(`/admin/orders/${orderId}`)}
                />
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
