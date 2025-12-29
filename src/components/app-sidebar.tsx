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
  IconChartBar,
  IconCurrencyDollar,
  IconFolder,
  IconTags,
  IconShoppingBag,
  IconReceipt,
  IconFlame,
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

const data = {
  user: {
    name: "Admin",
    email: "admin@roxas.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
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
      title: "Analytics",
      url: "/admin/analytics",
      icon: IconChartBar,
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "/admin/settings",
      icon: IconSettings,
    },
    {
      title: "Help",
      url: "/admin/help",
      icon: IconHelp,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
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
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
