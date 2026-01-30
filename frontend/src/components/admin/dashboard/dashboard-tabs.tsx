import { Bell, AlertTriangle, Activity, FileWarning } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { RecentOrder, FailedTransaction, AuditLog, ApiLog } from "@/lib/dashboard";
import { formatDateTime, formatTimeAgo } from "@/lib/date-utils";

interface DashboardTabsProps {
  recentOrders: RecentOrder[];
  failedTransactions: FailedTransaction[];
  auditLogs: AuditLog[];
  apiLogs: ApiLog[];
  onViewOrder: (orderId: number) => void;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
};

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    PENDING: "bg-yellow-600/20 text-yellow-400",
    PAID: "bg-blue-600/20 text-blue-400",
    PROCESSING: "bg-purple-600/20 text-purple-400",
    COMPLETED: "bg-green-600/20 text-green-400",
    FAILED: "bg-red-600/20 text-red-400",
    REFUNDED: "bg-orange-600/20 text-orange-400",
    EXPIRED: "bg-gray-600/20 text-gray-400",
  };
  return colors[status] || "bg-gray-600/20 text-gray-400";
};

const getAuditActionColor = (action: string) => {
  const colors: Record<string, string> = {
    CREATE: "bg-green-600/20 text-green-400",
    UPDATE: "bg-blue-600/20 text-blue-400",
    DELETE: "bg-red-600/20 text-red-400",
    ERROR: "bg-red-600/20 text-red-400",
    SYNC: "bg-purple-600/20 text-purple-400",
  };
  return colors[action] || "bg-gray-600/20 text-gray-400";
};

export function DashboardTabs({
  recentOrders,
  failedTransactions,
  auditLogs,
  apiLogs,
  onViewOrder,
}: DashboardTabsProps) {
  return (
    <Tabs defaultValue="transactions" className="space-y-4">
      <TabsList className="grid w-full grid-cols-4 lg:w-[500px]">
        <TabsTrigger value="transactions" className="gap-2">
          <Bell className="h-4 w-4" />
          Orders
        </TabsTrigger>
        <TabsTrigger value="failed" className="gap-2">
          <AlertTriangle className="h-4 w-4" />
          Failed
          {failedTransactions.length > 0 && (
            <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-xs">
              {failedTransactions.length}
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

      {/* Recent Orders Tab */}
      <TabsContent value="transactions">
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>Latest orders from all time</CardDescription>
          </CardHeader>
          <CardContent>
            {recentOrders.length > 0 ? (
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order Number</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentOrders.map((order) => (
                      <TableRow
                        key={order.id}
                        className="cursor-pointer hover:bg-gray-800/50"
                        onClick={() => onViewOrder(order.id)}
                      >
                        <TableCell className="font-medium">
                          {order.orderNumber}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{order.user?.fullName || "Guest"}</div>
                            <div className="text-sm text-gray-400">{order.user?.email || "N/A"}</div>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(order.totalAmount)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getStatusColor(order.status)}>
                            {order.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-400">
                          {formatTimeAgo(order.createdAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="py-12 text-center text-gray-400">
                No orders found
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Failed Transactions Tab */}
      <TabsContent value="failed">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              Failed Transactions
            </CardTitle>
            <CardDescription>Recent failed Digiflazz transactions</CardDescription>
          </CardHeader>
          <CardContent>
            {failedTransactions.length > 0 ? (
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ref ID</TableHead>
                      <TableHead>Order</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Error</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {failedTransactions.map((trans) => (
                      <TableRow
                        key={trans.id}
                        className={trans.orderId ? "cursor-pointer hover:bg-gray-800/50" : ""}
                        onClick={() => trans.orderId && onViewOrder(trans.orderId)}
                      >
                        <TableCell className="font-medium font-mono text-xs">
                          {trans.refId}
                        </TableCell>
                        <TableCell>
                          {trans.orderNumber || "N/A"}
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[200px] truncate">
                            {trans.productName}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(trans.amount)}
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[250px] truncate text-sm text-red-400">
                            {trans.errorMessage || "Unknown error"}
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-400">
                          {formatTimeAgo(trans.createdAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="py-12 text-center text-gray-400">
                No failed transactions
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* API Logs Tab */}
      <TabsContent value="api-logs">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              API Logs
            </CardTitle>
            <CardDescription>Recent API calls to external services</CardDescription>
          </CardHeader>
          <CardContent>
            {apiLogs.length > 0 ? (
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Provider</TableHead>
                      <TableHead>Endpoint</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Response Time</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {apiLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <Badge variant="outline" className="font-medium">
                            {log.provider}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs max-w-[200px] truncate">
                          {log.endpoint}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{log.method}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={log.statusCode >= 200 && log.statusCode < 300 ? "default" : "destructive"}
                          >
                            {log.statusCode}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-400">
                          {log.responseTime}ms
                        </TableCell>
                        <TableCell className="text-gray-400">
                          {formatTimeAgo(log.createdAt)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="py-12 text-center text-gray-400">
                No API logs found
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Audit Logs Tab */}
      <TabsContent value="logs">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileWarning className="h-5 w-5" />
              Activity Logs
            </CardTitle>
            <CardDescription>Recent system activity and changes</CardDescription>
          </CardHeader>
          <CardContent>
            {auditLogs.length > 0 ? (
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Action</TableHead>
                      <TableHead>Model</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Changes</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <Badge variant="outline" className={getAuditActionColor(log.action)}>
                            {log.action}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{log.modelName}</div>
                          <div className="text-xs text-gray-400">ID: {log.objectId}</div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{log.user?.fullName || "System"}</div>
                            <div className="text-sm text-gray-400">{log.user?.email || "N/A"}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[250px] truncate text-xs text-gray-400">
                            {JSON.stringify(log.changes)}
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-400">
                          {formatTimeAgo(log.timestamp)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="py-12 text-center text-gray-400">
                No activity logs found
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
