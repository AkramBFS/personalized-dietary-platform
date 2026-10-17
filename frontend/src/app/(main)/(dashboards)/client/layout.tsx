"use client";

import React from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { SharedSidebar, SidebarLink } from "@/components/dashboard/shared/Sidebar";
import { DashboardHeader } from "@/components/dashboard/shared/DashboardHeader";
import { LayoutDashboard, ClipboardList, MessageSquare, Camera, Users, HelpCircle, Settings, CreditCard, Receipt } from "lucide-react";

const clientLinks: SidebarLink[] = [
  {
    title: "Overview",
    url: "/client",
    icon: LayoutDashboard,
  },
  {
    title: "Meal Plans",
    url: "/client/meal-plans",
    icon: ClipboardList,
  },
  {
    title: "Consultations",
    url: "/client/consultations",
    icon: MessageSquare,
  },
  {
    title: "Calorie Tracker",
    url: "/client/calorie-tracker",
    icon: Camera,
  },
  {
    title: "Community",
    url: "/client/community",
    icon: Users,
  },
  {
    title: "My Subscription",
    url: "/client/subscription",
    icon: CreditCard,
  },
  {
    title: "Invoices",
    url: "/client/invoices",
    icon: Receipt,
  },
  {
    title: "Support",
    url: "/client/support",
    icon: HelpCircle,
  },
  {
    title: "Settings",
    url: "/client/settings",
    icon: Settings,
  },
];

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider
      style={{ "--sidebar-width": "7.5rem" } as React.CSSProperties}
    >
      <div className="flex min-h-screen w-full bg-background bg-main-app">
        <SharedSidebar links={clientLinks} role="client" />
        <SidebarInset className="flex min-w-0 w-full flex-1 flex-col bg-transparent">
          <DashboardHeader role="client" />
          <main className="w-full flex-1 px-4 pt-3 pb-8 md:px-8">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

