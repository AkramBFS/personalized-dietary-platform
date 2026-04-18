"use client";

import React, { useEffect, useState } from "react";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { UserProfileDropdown } from "./UserProfileDropdown";
import { Logo } from "@/components/layout/logo";
import Link from "next/link";
import api from "@/lib/api";
import { NotificationDropdown } from "./NotificationDropdown";

type RoleType = "client" | "nutritionist" | "high_admin";

export function DashboardHeader({ role }: { role: RoleType }) {
  const [user, setUser] = useState<{ username: string; email: string }>({
    username: "User",
    email: "user@example.com",
  });

  const { isMobile } = useSidebar();

  useEffect(() => {
    // In a real app we'd fetch the user's lightweight basic info here or get it from context
    // We'll mock it based on role
    if (role === "client") {
      setUser({ username: "Souki", email: "souki@example.com" });
    } else if (role === "nutritionist") {
      setUser({ username: "Dr. Smith", email: "doctor@example.com" });
    } else if (role === "high_admin") {
      setUser({ username: "Admin", email: "admin@example.com" });
    }
  }, [role]);

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-gray-200 dark:border-[#2a3038] bg-white dark:bg-[#12161b] px-4 md:px-6 shadow-sm">
      <div className="flex items-center gap-4">
        {/* Mobile/Toggle Trigger */}
        <SidebarTrigger className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white" />

        {/* Logo Section - Top Left of the Header */}
        <div className="flex items-center">
          <div className="flex">
            <Link href="/" className="flex items-center space-x-3">
              <Logo />
            </Link>
          </div>
        </div>
      </div>
      <div className="flex items-center">
        {/* Notification Bell */}
        <NotificationDropdown />

        {/* Top Right - User Profile Dropdown */}
        <UserProfileDropdown user={user} role={role} />
      </div>
    </header>
  );
}
