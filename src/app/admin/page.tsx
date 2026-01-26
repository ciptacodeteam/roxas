"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { SectionCards } from "@/components/section-cards"
import { AdminHeader } from "@/components/admin-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { useAdminDashboard } from "@/lib/queries"
import { Loader2, Bell, AlertTriangle, Clock, RefreshCw, Activity, FileWarning, Wifi, WifiOff, Zap } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDateTime } from "@/lib/date-utils"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useEffect, useState } from "react"

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount)
}

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    PENDING: "bg-yellow-600/20 text-yellow-400",
    PAID: "bg-blue-600/20 text-blue-400",
    PROCESSING: "bg-purple-600/20 text-purple-400",
    COMPLETED: "bg-green-600/20 text-green-400",
    FAILED: "bg-red-600/20 text-red-400",
    REFUNDED: "bg-orange-600/20 text-orange-400",
    EXPIRED: "bg-gray-600/20 text-gray-400",
  }
  return colors[status] || "bg-gray-600/20 text-gray-400"
}

const getAuditActionColor = (action: string) => {
  const colors: Record<string, string> = {
    CREATE: "bg-green-600/20 text-green-400",
    UPDATE: "bg-blue-600/20 text-blue-400",
    DELETE: "bg-red-600/20 text-red-400",
    ERROR: "bg-red-600/20 text-red-400",
    SYNC: "bg-purple-600/20 text-purple-400",
  }
  return colors[action] || "bg-gray-600/20 text-gray-400"
}

const formatTimeAgo = (date: string) => {
  const now = new Date()
  const then = new Date(date)
  const diffMs = now.getTime() - then.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return "Just now"
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  return `${diffDays}d ago`
}

// Auto-refresh interval in milliseconds (30 seconds)
const AUTO_REFRESH_INTERVAL = 30000

// Get current month name
const getCurrentMonthName = () => {
  return new Date().toLocaleString("en-US", { month: "long", year: "numeric" })
}

export default function AdminDashboardPage() {
  const router = useRouter()
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const currentMonth = getCurrentMonthName()
  const { data: dashboardData, isLoading, refetch, isFetching } = useAdminDashboard({
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    staleTime: 0,
  })

  const latestTransactions = dashboardData?.data?.latestTransactions || []
  const failedTransactions = dashboardData?.data?.failedTransactions || []
  const auditLogs = dashboardData?.data?.auditLogs || []
  const apiLogs = dashboardData?.data?.apiLogs || []
  const apiHealth = dashboardData?.data?.apiHealth || null
  const notifications = dashboardData?.data?.notifications || {
    newOrders: 0,
    pendingAttention: 0,
    failedTransactions: 0,
    processing: 0,
  }

  // Auto-refresh dashboard every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refetch()
      setLastRefresh(new Date())
    }, AUTO_REFRESH_INTERVAL)

    return () => clearInterval(interval)
  }, [refetch])

  const handleManualRefresh = () => {
    refetch()
    setLastRefresh(new Date())
  }

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
                  <div className="flex flex-wrap gap-3">
                    {notifications.failedTransactions > 0 && (
                      <div className="flex items-center gap-2 rounded-lg bg-red-500/10 px-4 py-2 text-red-400">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          {notifications.failedTransactions} failed transaction(s) this month
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="ml-2 h-7 text-red-400 hover:bg-red-500/20 hover:text-red-300"
                          onClick={() => router.push("/admin/orders?status=FAILED")}
                        >
                          View
                        </Button>
                      </div>
                    )}
                    {notifications.pendingAttention > 0 && (
                      <div className="flex items-center gap-2 rounded-lg bg-yellow-500/10 px-4 py-2 text-yellow-400">
                        <Clock className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          {notifications.pendingAttention} pending order(s) need attention
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="ml-2 h-7 text-yellow-400 hover:bg-yellow-500/20 hover:text-yellow-300"
                          onClick={() => router.push("/admin/orders?status=PENDING")}
                        >
                          View
                        </Button>
                      </div>
                    )}
                  </div>
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

              <SectionCards />

              {/* API Health Status */}
              <div className="px-4 lg:px-6">
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2 text-base">
                          <Zap className="h-4 w-4" />
                          API Integration Status
                        </CardTitle>
                        <CardDescription>
                          Real-time status of external API connections (last 24 hours)
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {/* Digiflazz Status */}
                      <div className="flex items-center gap-4 rounded-lg border p-4">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-full ${apiHealth?.digiflazz?.status === "healthy"
                          ? "bg-green-500/20"
                          : apiHealth?.digiflazz?.status === "degraded"
                            ? "bg-yellow-500/20"
                            : "bg-gray-500/20"
                          }`}>
                          {apiHealth?.digiflazz?.status === "healthy" ? (
                            <Wifi className="h-5 w-5 text-green-400" />
                          ) : apiHealth?.digiflazz?.status === "degraded" ? (
                            <AlertTriangle className="h-5 w-5 text-yellow-400" />
                          ) : (
                            <WifiOff className="h-5 w-5 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Digiflazz</span>
                            <Badge
                              variant="outline"
                              className={
                                apiHealth?.digiflazz?.status === "healthy"
                                  ? "bg-green-600/20 text-green-400"
                                  : apiHealth?.digiflazz?.status === "degraded"
                                    ? "bg-yellow-600/20 text-yellow-400"
                                    : "bg-gray-600/20 text-gray-400"
                              }
                            >
                              {apiHealth?.digiflazz?.status === "healthy" ? "Healthy" :
                                apiHealth?.digiflazz?.status === "degraded" ? "Degraded" : "Unknown"}
                            </Badge>
                          </div>
                          <div className="mt-1 flex items-center gap-3 text-sm text-gray-400">
                            <span>{apiHealth?.digiflazz?.successRate ?? 0}% success</span>
                            <span>•</span>
                            <span>{apiHealth?.digiflazz?.total ?? 0} calls</span>
                            {(apiHealth?.digiflazz?.avgResponseTime ?? 0) > 0 && (
                              <>
                                <span>•</span>
                                <span>{apiHealth?.digiflazz?.avgResponseTime}ms avg</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Midtrans Status */}
                      <div className="flex items-center gap-4 rounded-lg border p-4">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-full ${apiHealth?.midtrans?.status === "healthy"
                          ? "bg-green-500/20"
                          : apiHealth?.midtrans?.status === "degraded"
                            ? "bg-yellow-500/20"
                            : "bg-gray-500/20"
                          }`}>
                          {apiHealth?.midtrans?.status === "healthy" ? (
                            <Wifi className="h-5 w-5 text-green-400" />
                          ) : apiHealth?.midtrans?.status === "degraded" ? (
                            <AlertTriangle className="h-5 w-5 text-yellow-400" />
                          ) : (
                            <WifiOff className="h-5 w-5 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Midtrans</span>
                            <Badge
                              variant="outline"
                              className={
                                apiHealth?.midtrans?.status === "healthy"
                                  ? "bg-green-600/20 text-green-400"
                                  : apiHealth?.midtrans?.status === "degraded"
                                    ? "bg-yellow-600/20 text-yellow-400"
                                    : "bg-gray-600/20 text-gray-400"
                              }
                            >
                              {apiHealth?.midtrans?.status === "healthy" ? "Healthy" :
                                apiHealth?.midtrans?.status === "degraded" ? "Degraded" : "Unknown"}
                            </Badge>
                          </div>
                          <div className="mt-1 flex items-center gap-3 text-sm text-gray-400">
                            <span>{apiHealth?.midtrans?.successRate ?? 0}% success</span>
                            <span>•</span>
                            <span>{apiHealth?.midtrans?.total ?? 0} calls</span>
                            {(apiHealth?.midtrans?.avgResponseTime ?? 0) > 0 && (
                              <>
                                <span>•</span>
                                <span>{apiHealth?.midtrans?.avgResponseTime}ms avg</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Mailgun Status */}
                      <div className="flex items-center gap-4 rounded-lg border p-4">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-full ${apiHealth?.mailgun?.status === "healthy"
                          ? "bg-green-500/20"
                          : apiHealth?.mailgun?.status === "degraded"
                            ? "bg-yellow-500/20"
                            : "bg-gray-500/20"
                          }`}>
                          {apiHealth?.mailgun?.status === "healthy" ? (
                            <Wifi className="h-5 w-5 text-green-400" />
                          ) : apiHealth?.mailgun?.status === "degraded" ? (
                            <AlertTriangle className="h-5 w-5 text-yellow-400" />
                          ) : (
                            <WifiOff className="h-5 w-5 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Mailgun</span>
                            <Badge
                              variant="outline"
                              className={
                                apiHealth?.mailgun?.status === "healthy"
                                  ? "bg-green-600/20 text-green-400"
                                  : apiHealth?.mailgun?.status === "degraded"
                                    ? "bg-yellow-600/20 text-yellow-400"
                                    : "bg-gray-600/20 text-gray-400"
                              }
                            >
                              {apiHealth?.mailgun?.status === "healthy" ? "Healthy" :
                                apiHealth?.mailgun?.status === "degraded" ? "Degraded" : "Unknown"}
                            </Badge>
                          </div>
                          <div className="mt-1 flex items-center gap-3 text-sm text-gray-400">
                            <span>{apiHealth?.mailgun?.successRate ?? 0}% success</span>
                            <span>•</span>
                            <span>{apiHealth?.mailgun?.total ?? 0} calls</span>
                            {(apiHealth?.mailgun?.avgResponseTime ?? 0) > 0 && (
                              <>
                                <span>•</span>
                                <span>{apiHealth?.mailgun?.avgResponseTime}ms avg</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Recent API Errors */}
                    {apiHealth?.recentErrors && apiHealth.recentErrors.length > 0 && (
                      <div className="mt-4">
                        <h4 className="mb-2 text-sm font-medium text-gray-400">Recent API Errors (last hour)</h4>
                        <div className="space-y-2">
                          {apiHealth.recentErrors.slice(0, 3).map((error: any) => (
                            <div key={error.id} className="flex items-center gap-2 rounded bg-red-500/10 px-3 py-2 text-sm">
                              <AlertTriangle className="h-4 w-4 text-red-400" />
                              <span className="font-medium text-red-400">{error.provider}</span>
                              <span className="text-gray-400">-</span>
                              <span className="flex-1 truncate text-gray-300">{error.errorMessage || error.endpoint}</span>
                              <span className="text-gray-500">{formatTimeAgo(error.createdAt)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="px-4 lg:px-6">
                <ChartAreaInteractive />
              </div>

              {/* Dashboard Tabs for different views */}
              <div className="px-4 lg:px-6">
                <Tabs defaultValue="transactions" className="space-y-4">
                  <TabsList className="grid w-full grid-cols-4 lg:w-[500px]">
                    <TabsTrigger value="transactions" className="gap-2">
                      <Bell className="h-4 w-4" />
                      Orders
                    </TabsTrigger>
                    <TabsTrigger value="failed" className="gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Failed
                      {notifications.failedTransactions > 0 && (
                        <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-xs">
                          {notifications.failedTransactions}
                        </Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="api-logs" className="gap-2">
                      <Activity className="h-4 w-4" />
                      API Logs
                    </TabsTrigger>
                    <TabsTrigger value="logs" className="gap-2">
                      <FileWarning className="h-4 w-4" />
                      Activity
                    </TabsTrigger>
                  </TabsList>

                  {/* Latest Transactions Tab */}
                  <TabsContent value="transactions">
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle>Orders - {currentMonth}</CardTitle>
                            <CardDescription>
                              Recent orders this month ({notifications.newOrders} new today)
                            </CardDescription>
                          </div>
                          <Button
                            variant="outline"
                            onClick={() => router.push("/admin/orders")}
                          >
                            View All Orders
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {isLoading ? (
                          <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
                          </div>
                        ) : latestTransactions.length > 0 ? (
                          <div className="rounded-lg border">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Order Number</TableHead>
                                  <TableHead>Customer</TableHead>
                                  <TableHead>Product</TableHead>
                                  <TableHead>Amount</TableHead>
                                  <TableHead>Status</TableHead>
                                  <TableHead>Date</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {latestTransactions.map((transaction: any) => (
                                  <TableRow
                                    key={transaction.id}
                                    className="cursor-pointer hover:bg-gray-800/50"
                                    onClick={() => router.push(`/admin/orders/${transaction.id}`)}
                                  >
                                    <TableCell className="font-medium">
                                      {transaction.orderNumber}
                                    </TableCell>
                                    <TableCell>
                                      <div>
                                        <div className="font-medium">{transaction.user.email}</div>
                                        {transaction.user.name && (
                                          <div className="text-sm text-gray-400">{transaction.user.name}</div>
                                        )}
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <div>
                                        <div className="font-medium">{transaction.productItem.product.name}</div>
                                        <div className="text-sm text-gray-400">{transaction.productItem.name}</div>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      {transaction.payment ? (
                                        <div className="font-medium">
                                          {formatCurrency(transaction.payment.amount)}
                                        </div>
                                      ) : (
                                        <div className="font-medium">
                                          {formatCurrency(transaction.totalAmount)}
                                        </div>
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      <Badge
                                        variant="outline"
                                        className={getStatusColor(transaction.status)}
                                      >
                                        {transaction.status}
                                      </Badge>
                                    </TableCell>
                                    <TableCell className="text-gray-400">
                                      {formatTimeAgo(transaction.createdAt)}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        ) : (
                          <div className="py-12 text-center text-gray-400">
                            No transactions found
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Failed Transactions Tab */}
                  <TabsContent value="failed">
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="flex items-center gap-2">
                              <AlertTriangle className="h-5 w-5 text-red-400" />
                              Failed Transactions - {currentMonth}
                            </CardTitle>
                            <CardDescription>
                              Failed and expired orders this month
                            </CardDescription>
                          </div>
                          <Button
                            variant="outline"
                            onClick={() => router.push("/admin/orders?status=FAILED")}
                          >
                            View All Failed
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {isLoading ? (
                          <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
                          </div>
                        ) : failedTransactions.length > 0 ? (
                          <div className="rounded-lg border">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Order Number</TableHead>
                                  <TableHead>Customer</TableHead>
                                  <TableHead>Product</TableHead>
                                  <TableHead>Status</TableHead>
                                  <TableHead>Error Message</TableHead>
                                  <TableHead>Date</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {failedTransactions.map((transaction: any) => (
                                  <TableRow
                                    key={transaction.id}
                                    className="cursor-pointer hover:bg-gray-800/50"
                                    onClick={() => router.push(`/admin/orders/${transaction.id}`)}
                                  >
                                    <TableCell className="font-medium">
                                      {transaction.orderNumber}
                                    </TableCell>
                                    <TableCell>
                                      <div>
                                        <div className="font-medium">{transaction.user.email}</div>
                                        {transaction.user.name && (
                                          <div className="text-sm text-gray-400">{transaction.user.name}</div>
                                        )}
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <div>
                                        <div className="font-medium">{transaction.productItem.product.name}</div>
                                        <div className="text-sm text-gray-400">{transaction.productItem.name}</div>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <Badge
                                        variant="outline"
                                        className={getStatusColor(transaction.status)}
                                      >
                                        {transaction.status}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      <div className="max-w-[200px] truncate text-sm text-red-400">
                                        {transaction.digiflazzTx?.message || "Payment expired/failed"}
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-gray-400">
                                      {formatTimeAgo(transaction.createdAt)}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        ) : (
                          <div className="py-12 text-center text-gray-400">
                            <AlertTriangle className="mx-auto mb-2 h-8 w-8 text-green-400" />
                            <p>No failed transactions this month</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* API Integration Logs Tab */}
                  <TabsContent value="api-logs">
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="flex items-center gap-2">
                              <Activity className="h-5 w-5 text-purple-400" />
                              API Integration Logs
                            </CardTitle>
                            <CardDescription>
                              External API calls to Digiflazz, Midtrans, and Mailgun (last 24 hours)
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {isLoading ? (
                          <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
                          </div>
                        ) : apiLogs.length > 0 ? (
                          <ScrollArea className="h-[400px]">
                            <div className="space-y-2">
                              {apiLogs.map((log: any) => (
                                <div
                                  key={log.id}
                                  className={`flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-gray-800/30 ${log.status === "SUCCESS" ? "border-green-500/20" :
                                      log.status === "FAILED" ? "border-red-500/30 bg-red-500/5" :
                                        log.status === "TIMEOUT" ? "border-yellow-500/30 bg-yellow-500/5" :
                                          "border-red-500/30 bg-red-500/5"
                                    }`}
                                >
                                  <div className={`flex h-8 w-8 items-center justify-center rounded-full ${log.status === "SUCCESS" ? "bg-green-500/20" :
                                      log.status === "FAILED" ? "bg-red-500/20" :
                                        log.status === "TIMEOUT" ? "bg-yellow-500/20" :
                                          "bg-red-500/20"
                                    }`}>
                                    {log.status === "SUCCESS" ? (
                                      <Wifi className="h-4 w-4 text-green-400" />
                                    ) : log.status === "TIMEOUT" ? (
                                      <Clock className="h-4 w-4 text-yellow-400" />
                                    ) : (
                                      <WifiOff className="h-4 w-4 text-red-400" />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <Badge
                                        variant="outline"
                                        className={
                                          log.provider === "DIGIFLAZZ" ? "bg-blue-600/20 text-blue-400" :
                                            log.provider === "MIDTRANS" ? "bg-purple-600/20 text-purple-400" :
                                              "bg-orange-600/20 text-orange-400"
                                        }
                                      >
                                        {log.provider}
                                      </Badge>
                                      <span className="font-mono text-sm text-gray-300">{log.method} {log.endpoint}</span>
                                      <Badge
                                        variant="outline"
                                        className={
                                          log.status === "SUCCESS" ? "bg-green-600/20 text-green-400" :
                                            log.status === "FAILED" ? "bg-red-600/20 text-red-400" :
                                              log.status === "TIMEOUT" ? "bg-yellow-600/20 text-yellow-400" :
                                                "bg-red-600/20 text-red-400"
                                        }
                                      >
                                        {log.status}
                                      </Badge>
                                      {log.statusCode && (
                                        <span className="text-xs text-gray-500">HTTP {log.statusCode}</span>
                                      )}
                                    </div>
                                    {log.errorMessage && (
                                      <div className="mt-1 text-sm text-red-400 truncate">
                                        {log.errorMessage}
                                      </div>
                                    )}
                                    <div className="mt-1 flex items-center gap-3 text-xs text-gray-500">
                                      {log.responseTime && (
                                        <span>{log.responseTime}ms</span>
                                      )}
                                      {log.refId && (
                                        <span>Ref: {log.refId.slice(0, 12)}...</span>
                                      )}
                                      <span>{formatTimeAgo(log.createdAt)}</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        ) : (
                          <div className="py-12 text-center text-gray-400">
                            <Wifi className="mx-auto mb-2 h-8 w-8 text-gray-500" />
                            <p>No API calls recorded in the last 24 hours</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Activity/Audit Logs Tab */}
                  <TabsContent value="logs">
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="flex items-center gap-2">
                              <FileWarning className="h-5 w-5 text-blue-400" />
                              Activity Log
                            </CardTitle>
                            <CardDescription>
                              Recent system activities, API calls, and changes
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {isLoading ? (
                          <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
                          </div>
                        ) : auditLogs.length > 0 ? (
                          <ScrollArea className="h-[400px]">
                            <div className="space-y-3">
                              {auditLogs.map((log: any) => (
                                <div
                                  key={log.id}
                                  className="flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-gray-800/30"
                                >
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <Badge
                                        variant="outline"
                                        className={getAuditActionColor(log.action)}
                                      >
                                        {log.action}
                                      </Badge>
                                      <span className="font-medium">{log.entityType}</span>
                                      <span className="text-sm text-gray-400">#{log.entityId.slice(0, 8)}</span>
                                    </div>
                                    {log.changes && (
                                      <div className="mt-1 text-sm text-gray-400">
                                        {typeof log.changes === "object"
                                          ? JSON.stringify(log.changes).slice(0, 100) + (JSON.stringify(log.changes).length > 100 ? "..." : "")
                                          : log.changes}
                                      </div>
                                    )}
                                    <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                                      {log.user && (
                                        <span>by {log.user.email}</span>
                                      )}
                                      <span>•</span>
                                      <span>{formatTimeAgo(log.createdAt)}</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        ) : (
                          <div className="py-12 text-center text-gray-400">
                            No activity logs found
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
