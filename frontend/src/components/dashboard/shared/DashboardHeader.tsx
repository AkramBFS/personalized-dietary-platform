"use client";

import React, { useEffect, useState } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { UserProfileDropdown } from "./UserProfileDropdown";
import { Logo } from "@/components/layout/logo";
import Link from "next/link";
import { NotificationDropdown } from "./NotificationDropdown";
import { getProfileIdentity } from "@/lib/profile";

type RoleType = "client" | "nutritionist" | "high_admin";

export function DashboardHeader({ role }: { role: RoleType }) {
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

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border bg-background px-4 md:px-6 shadow-sm">
      <div className="flex items-center gap-4">
        {/* Mobile/Toggle Trigger */}
        <SidebarTrigger className="text-muted-foreground hover:text-foreground" />

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
