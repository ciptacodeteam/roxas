"use client"

import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react"
import type { DashboardData } from "@/lib/dashboard"

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

interface SectionCardsProps {
  data: DashboardData;
}

export function SectionCards({ data }: SectionCardsProps) {
  const stats = data.overviewStats;

  const revenueGrowth = stats.revenueChange
  const isRevenuePositive = revenueGrowth >= 0

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Revenue</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {formatCurrency(stats.totalRevenue)}
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
            {stats.totalOrders.toLocaleString("id-ID")}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="bg-green-600/20 text-green-400">
              {stats.monthOrders} this month
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {stats.monthOrders} orders this month
          </div>
          <div className="text-muted-foreground">
            Growth {stats.ordersChange >= 0 ? "up" : "down"} {Math.abs(stats.ordersChange).toFixed(1)}%
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Products</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats.totalProducts.toLocaleString("id-ID")}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              Active products
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Strong product catalog <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">
            {stats.totalProducts} products available for purchase
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Users</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats.totalUsers.toLocaleString("id-ID")}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />
              Registered users
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Active user base <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Growing community of users
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
