"use client";

import React from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { SharedSidebar, SidebarLink } from "@/components/dashboard/shared/Sidebar";
import { DashboardHeader } from "@/components/dashboard/shared/DashboardHeader";
import { LayoutDashboard, ClipboardList, MessageSquare, Camera, Users, HelpCircle, Settings, CreditCard } from "lucide-react";

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
    <SidebarProvider>
      <div className="flex min-h-screen bg-background dark:bg-[#12161b] w-full">
        <SharedSidebar links={clientLinks} role="client" />
        <SidebarInset className="flex w-full flex-1 flex-col bg-slate-50 dark:bg-[#171c23]">
          <DashboardHeader role="client" />
          <main className="flex-1 w-full p-4 md:p-8">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
