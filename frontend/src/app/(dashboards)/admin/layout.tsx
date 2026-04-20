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
    <SidebarProvider>
      <div className="flex min-h-screen bg-background dark:bg-[#12161b] w-full">
        <SharedSidebar links={adminLinks} role="high_admin" />
        <SidebarInset className="flex w-full flex-1 flex-col bg-slate-50 dark:bg-[#171c23]">
          <DashboardHeader role="high_admin" />
          <main className="flex-1 w-full p-4 md:p-8">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
