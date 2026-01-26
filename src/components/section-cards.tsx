"use client"

import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react"
import { useAdminDashboard } from "@/lib/queries"
import { Loader2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount)
}

export function SectionCards() {
  const { data: dashboardData, isLoading } = useAdminDashboard()
  const stats = dashboardData?.data

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 px-4 lg:px-6">
        <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
      </div>
    )
  }

  if (!stats) {
    return null
  }

  const revenueGrowth = stats.revenue.growth
  const isRevenuePositive = revenueGrowth >= 0

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Revenue</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {formatCurrency(stats.revenue.total)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {isRevenuePositive ? <IconTrendingUp /> : <IconTrendingDown />}
              {isRevenuePositive ? "+" : ""}
              {revenueGrowth.toFixed(1)}%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {isRevenuePositive ? "Trending up" : "Trending down"} this month{" "}
            {isRevenuePositive ? <IconTrendingUp className="size-4" /> : <IconTrendingDown className="size-4" />}
          </div>
          <div className="text-muted-foreground">
            Revenue for the last 6 months from completed orders
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Orders</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats.orders.total.toLocaleString("id-ID")}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="bg-green-600/20 text-green-400">
              {stats.orders.completed} completed
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {stats.orders.today} orders today
            {(stats.orders.processing || 0) > 0 && (
              <Badge variant="outline" className="ml-1 bg-purple-600/20 text-purple-400 text-xs">
                {stats.orders.processing} processing
              </Badge>
            )}
          </div>
          <div className="text-muted-foreground flex items-center gap-2">
            {stats.orders.pending > 0 && (
              <span className="text-yellow-400">{stats.orders.pending} pending</span>
            )}
            {(stats.orders.failed || 0) > 0 && (
              <span className="text-red-400">{stats.orders.failed} failed</span>
            )}
            {stats.orders.pending === 0 && (stats.orders.failed || 0) === 0 && (
              <span>All orders processed</span>
            )}
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Products</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats.products.total.toLocaleString("id-ID")}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              {stats.products.items} items
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Strong product catalog <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">
            {stats.products.items} product items available for purchase
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Users</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats.users.total.toLocaleString("id-ID")}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />
              +{stats.users.newThisMonth}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {stats.users.newThisMonth} new users this month <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">
            User growth and engagement exceed targets
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
