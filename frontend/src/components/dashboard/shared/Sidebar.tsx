"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LucideIcon } from "lucide-react";
import {
  Sidebar as BaseSidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Logo } from "@/components/layout/logo";

export interface SidebarLink {
  title: string;
  url: string;
  icon: LucideIcon;
}

interface SidebarProps {
  links: SidebarLink[];
  role: "client" | "nutritionist" | "high_admin";
}

export function SharedSidebar({ links, role }: SidebarProps) {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();
  const prevPathname = useRef(pathname);

  // Auto-close sidebar on mobile when navigating to a new route
  useEffect(() => {
    if (isMobile && prevPathname.current !== pathname) {
      setOpenMobile(false);
    }
    prevPathname.current = pathname;
  }, [pathname, isMobile, setOpenMobile]);

  return (
    <BaseSidebar>
      {/* Show logo inside sidebar on mobile for branding */}
      <SidebarHeader className="flex items-center gap-2 px-5 py-4 md:hidden">
        <Logo />
      </SidebarHeader>

      <SidebarContent className="px-4 py-2 mt-0 md:mt-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {Array.isArray(links) && links.map((link) => {
                const rolePath = role === "high_admin" ? "admin" : role;
                const isActive =
                  link.url === `/${rolePath}`
                    ? pathname === link.url
                    : pathname === link.url ||
                      pathname.startsWith(`${link.url}/`);
                return (
                  <SidebarMenuItem key={link.url}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      className={`h-11 rounded-xl transition-all duration-200 ${isActive ? "bg-primary/15 text-primary font-medium" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
                      tooltip={link.title}
                    >
                      <Link
                        href={link.url}
                        className="flex items-center gap-3 px-4"
                      >
                        <link.icon
                          className={`h-5 w-5 ${isActive ? "text-primary" : "text-muted-foreground/70"}`}
                        />
                        <span className="text-[15px]">{link.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </BaseSidebar>
  );
}
