"use client"

import * as React from "react"
import Link from "next/link"
import {
  IconDashboard,
  IconShoppingCart,
  IconPackage,
  IconUsers,
  IconUsersGroup,
  IconSettings,
  IconHelp,
  IconCurrencyDollar,
  IconFolder,
  IconTags,
  IconShoppingBag,
  IconReceipt,
  IconFlame,
  IconPhoto,
  IconTicket,
  IconStar,
} from "@tabler/icons-react"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const navMainItems = [
  {
    title: "Dashboard",
    url: "/admin",
    icon: IconDashboard,
  },
  {
    title: "Categories",
    url: "/admin/categories",
    icon: IconFolder,
  },
  {
    title: "Products",
    url: "/admin/products",
    icon: IconShoppingBag,
  },
  {
    title: "Product Items",
    url: "/admin/price-list",
    icon: IconTags,
  },
  {
    title: "Orders",
    url: "/admin/orders",
    icon: IconReceipt,
  },
  {
    title: "Flash Sales",
    url: "/admin/flash-sales",
    icon: IconFlame,
  },
  {
    title: "Marketing Banners",
    url: "/admin/marketing-banners",
    icon: IconPhoto,
  },
  {
    title: "Transactions",
    url: "/admin/transactions",
    icon: IconShoppingCart,
  },
  {
    title: "Users",
    url: "/admin/users",
    icon: IconUsers,
  },
  {
    title: "Payment Methods",
    url: "/admin/payment-methods",
    icon: IconCurrencyDollar,
  },
  {
    title: "Coupons",
    url: "/admin/coupons",
    icon: IconTicket,
  },
  {
    title: "Ratings",
    url: "/admin/ratings",
    icon: IconStar,
  },
] as const

const navSecondaryItems = [] as const

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <Link href="/admin">
                <span className="text-base font-semibold">ROXAS</span>
                <span className="text-xs text-muted-foreground ml-2">Admin Panel</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMainItems} />
        <NavSecondary items={navSecondaryItems} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
