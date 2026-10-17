"use client";

import React from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import {
  SharedSidebar,
  SidebarLink,
} from "@/components/dashboard/shared/Sidebar";
import { DashboardHeader } from "@/components/dashboard/shared/DashboardHeader";
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  ShieldAlert,
  PenTool,
  MessageSquare,
  Settings,
  FileText,
  CreditCard,
} from "lucide-react";

const adminLinks: SidebarLink[] = [
  {
    title: "Overview",
    url: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "User Management",
    url: "/admin/users",
    icon: Users,
  },
  {
    title: "Nutritionist Approvals",
    url: "/admin/approvals",
    icon: ShieldCheck,
  },
  {
    title: "Plan Management",
    url: "/admin/plans",
    icon: FileText,
  },
  {
    title: "Subscriptions",
    url: "/admin/subscriptions",
    icon: CreditCard,
  },
  {
    title: "Content Moderation",
    url: "/admin/moderation",
    icon: ShieldAlert,
  },
  {
    title: "Blog Management",
    url: "/admin/blog",
    icon: PenTool,
  },
  {
    title: "Inquiries",
    url: "/admin/inquiries",
    icon: MessageSquare,
  },
  {
    title: "Settings",
    url: "/admin/settings",
    icon: Settings,
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider
      style={{ "--sidebar-width": "7.5rem" } as React.CSSProperties}
    >
      <div className="flex min-h-screen w-full bg-background bg-main-app">
        <SharedSidebar links={adminLinks} role="high_admin" />
        <SidebarInset className="flex min-w-0 w-full flex-1 flex-col bg-transparent">
          <DashboardHeader role="high_admin" />
          <main className="w-full flex-1 px-4 pt-3 pb-8 md:px-8">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

