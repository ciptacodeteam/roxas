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
import { Loader2 } from "lucide-react"
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

export default function AdminDashboardPage() {
  const router = useRouter()
  const { data: dashboardData, isLoading } = useAdminDashboard()
  const latestTransactions = dashboardData?.data?.latestTransactions || []

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
              <SectionCards />
              <div className="px-4 lg:px-6">
                <ChartAreaInteractive />
              </div>
              <div className="px-4 lg:px-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Latest Transactions</CardTitle>
                        <CardDescription>
                          Most recent orders from customers
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
                                  {formatDateTime(transaction.createdAt)}
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
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
