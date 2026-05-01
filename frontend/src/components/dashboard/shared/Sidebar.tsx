"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LucideIcon, UserRound, LogOut } from "lucide-react";
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
} from "@/components/ui/sidebar";

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

  return (
    <BaseSidebar>
      <SidebarContent className="px-4 py-2 mt-4">
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
