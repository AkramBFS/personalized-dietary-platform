"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  Users,
  ShieldCheck,
  ShieldAlert,
  PenTool,
  MessageSquare,
  Settings,
  FileText,
  CreditCard,
  ClipboardList,
  Camera,
  Receipt,
  HelpCircle,
  CalendarClock,
  HeartHandshake,
  Store,
  DollarSign,
  User,
} from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { UserProfileDropdown } from "./UserProfileDropdown";
import { NotificationDropdown } from "./NotificationDropdown";
import { getProfileIdentity } from "@/lib/profile";

type RoleType = "client" | "nutritionist" | "high_admin";

function getHeaderSectionMeta(pathname: string) {
  if (pathname.includes("/users")) return { title: "User Management", Icon: Users };
  if (pathname.includes("/approvals")) return { title: "Nutritionist Approvals", Icon: ShieldCheck };
  if (pathname.includes("/moderation")) return { title: "Content Moderation", Icon: ShieldAlert };
  if (pathname.includes("/blog")) return { title: "Blog Management", Icon: PenTool };
  if (pathname.includes("/inquiries")) return { title: "Inquiries", Icon: MessageSquare };
  if (pathname.includes("/subscriptions") || pathname.includes("/subscription")) {
    return { title: pathname.startsWith("/admin") ? "Subscriptions" : "My Subscription", Icon: CreditCard };
  }
  if (pathname.includes("/plans") && pathname.startsWith("/admin")) {
    return { title: "Plan Management", Icon: FileText };
  }
  if (pathname.includes("/meal-plans") || pathname.includes("/marketplace-plans")) {
    return { title: "Meal Plans", Icon: pathname.startsWith("/nutritionist") ? Store : ClipboardList };
  }
  if (pathname.includes("/schedule")) return { title: "Schedule", Icon: CalendarClock };
  if (pathname.includes("/patients")) return { title: "Patient list", Icon: HeartHandshake };
  if (pathname.includes("/consultations")) return { title: "Consultations", Icon: MessageSquare };
  if (pathname.includes("/calorie-tracker")) return { title: "Calorie Tracker", Icon: Camera };
  if (pathname.includes("/community")) return { title: "Community", Icon: Users };
  if (pathname.includes("/invoices")) return { title: "Invoices", Icon: Receipt };
  if (pathname.includes("/earnings")) return { title: "Earnings", Icon: DollarSign };
  if (pathname.includes("/support")) return { title: "Support", Icon: HelpCircle };
  if (pathname.includes("/settings")) return { title: "Settings", Icon: Settings };
  if (pathname.includes("/profile")) return { title: "Profile", Icon: User };
  return { title: "Overview", Icon: LayoutGrid };
}

export function DashboardHeader({ role }: { role: RoleType }) {
  const pathname = usePathname();
  const [user, setUser] = useState<{ username: string; email: string; avatarUrl?: string }>(() =>
    role === "high_admin"
      ? { username: "Admin", email: "admin@example.com" }
      : { username: "User", email: "user@example.com" },
  );

  useEffect(() => {
    let isMounted = true;

    if (role === "high_admin") {
      return;
    }

    const loadIdentity = async () => {
      try {
        const identity = await getProfileIdentity(role);
        if (isMounted && identity) {
          setUser({
            username: identity.username,
            email: identity.email,
            avatarUrl: identity.avatarUrl,
          });
        }
      } catch {
        if (isMounted) {
          setUser({
            username: role === "client" ? "Client" : "Nutritionist",
            email: "",
          });
        }
      }
    };

    void loadIdentity();

    return () => {
      isMounted = false;
    };
  }, [role]);

  const { title, Icon } = getHeaderSectionMeta(pathname || "");

  return (
    <header className="w-full px-4 pt-4 pb-2 md:px-8 md:pt-5">
      <div className="mx-auto flex w-full max-w-[1240px] items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          {/* Mobile Drawer Trigger */}
          <SidebarTrigger className="h-11 w-11 rounded-full border border-border bg-card text-primary hover:bg-accent hover:text-primary md:hidden" />

          {/* Desktop Section Icon Badge */}
          <span className="hidden h-12 w-12 shrink-0 place-items-center rounded-full border border-border bg-card text-primary md:grid">
            <Icon className="h-5 w-5" />
          </span>

          <span className="text-xl font-bold tracking-tight text-foreground md:text-[22px]">
            {title}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Notification Bell */}
          <NotificationDropdown />

          {/* Top Right - User Profile Dropdown */}
          <UserProfileDropdown user={user} role={role} />
        </div>
      </div>
    </header>
  );
}

