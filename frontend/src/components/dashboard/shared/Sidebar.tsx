"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LucideIcon } from "lucide-react";
import {
  Sidebar as BaseSidebar,
  useSidebar,
} from "@/components/ui/sidebar";
import { Logo } from "@/components/layout/logo";
import { cn } from "@/lib/utils";

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

  const rolePath = role === "high_admin" ? "admin" : role;

  const isLinkActive = (url: string) =>
    url === `/${rolePath}`
      ? pathname === url
      : pathname === url || pathname.startsWith(`${url}/`);

  const safeLinks = Array.isArray(links) ? links : [];
  const mainLinks = safeLinks.filter(
    (link) => !link.url.endsWith("/support") && !link.url.endsWith("/settings"),
  );
  const bottomLinks = safeLinks.filter(
    (link) => link.url.endsWith("/support") || link.url.endsWith("/settings"),
  );

  const renderLinkItem = (link: SidebarLink) => {
    const isActive = isLinkActive(link.url);
    return (
      <Link
        key={link.url}
        href={link.url}
        aria-current={isActive ? "page" : undefined}
        className={cn(
          "group/nav flex w-full transition-colors",
          isMobile
            ? "flex-row items-center gap-3.5 rounded-2xl px-3 py-2 text-sm"
            : "flex-col items-center gap-1.5 rounded-2xl px-1 py-1.5 text-center text-[11px] leading-[1.2]",
          isActive
            ? "font-bold text-foreground"
            : "font-medium text-muted-foreground hover:text-foreground",
        )}
      >
        <span
          className={cn(
            "grid h-11 w-11 shrink-0 place-items-center rounded-[14px] transition-colors",
            isActive
              ? "bg-primary text-primary-foreground shadow-xs"
              : "text-muted-foreground group-hover/nav:bg-accent group-hover/nav:text-accent-foreground",
          )}
        >
          <link.icon className="h-5 w-5 stroke-[1.9]" />
        </span>
        <span className={cn(isMobile ? "truncate" : "max-w-full break-words")}>
          {link.title}
        </span>
      </Link>
    );
  };

  return (
    <BaseSidebar className="border-r-0! bg-transparent p-3 pr-0 md:p-4 md:pr-0 [&_[data-slot=sidebar-inner]]:bg-transparent">
      <aside
        aria-label={`${rolePath} navigation`}
        className={cn(
          "flex h-full w-full flex-col items-center border border-border bg-card text-card-foreground shadow-sm overflow-y-auto custom-scrollbar",
          isMobile
            ? "rounded-r-[32px] border-l-0 px-4 py-5 gap-4"
            : "rounded-[32px] px-2 py-4 gap-3",
        )}
      >
        <Link
          href="/"
          aria-label="Home"
          className={cn(
            "flex w-full shrink-0 items-center justify-center rounded-[22px] bg-accent transition-opacity hover:opacity-90",
            isMobile ? "h-14 px-4" : "h-13 px-2",
          )}
        >
          <Logo
            className={cn(
              "justify-center",
              isMobile ? "[&_img]:h-5 [&_img]:w-auto" : "[&_img]:h-3.5 [&_img]:w-auto max-w-full",
            )}
          />
        </Link>

        <nav className="flex w-full flex-1 flex-col gap-1">
          {mainLinks.map(renderLinkItem)}
        </nav>

        {bottomLinks.length > 0 && (
          <div className="mt-auto flex w-full flex-col gap-1 border-t border-border pt-3">
            {bottomLinks.map(renderLinkItem)}
          </div>
        )}
      </aside>
    </BaseSidebar>
  );
}

