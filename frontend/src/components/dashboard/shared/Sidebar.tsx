"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, LucideIcon, Pin, PinOff } from "lucide-react";
import {
  Sidebar as BaseSidebar,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Logo, LogoIcon } from "@/components/layout/logo";
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

interface RoleGroupSpec {
  id: string;
  label?: string;
  matchSuffixes: string[];
}

interface NavGroup {
  id: string;
  label?: string;
  items: SidebarLink[];
}

const PIN_STORAGE_KEY = "svmb_sidebar_pinned";
const HOVER_OPEN_DELAY_MS = 120;
const HOVER_CLOSE_DELAY_MS = 100;

const ROLE_GROUP_SPECS: Record<SidebarProps["role"], RoleGroupSpec[]> = {
  high_admin: [
    { id: "overview", label: "Overview", matchSuffixes: ["/admin"] },
    {
      id: "people",
      label: "People",
      matchSuffixes: ["/users", "/approvals"],
    },
    {
      id: "content",
      label: "Content",
      matchSuffixes: ["/plans", "/moderation", "/blog"],
    },
    {
      id: "business",
      label: "Business",
      matchSuffixes: ["/subscriptions"],
    },
    {
      id: "support",
      label: "Support",
      matchSuffixes: ["/inquiries"],
    },
  ],
  client: [
    { id: "overview", label: "Overview", matchSuffixes: ["/client"] },
    {
      id: "nutrition",
      label: "Nutrition & Care",
      matchSuffixes: ["/meal-plans", "/consultations", "/calorie-tracker"],
    },
    {
      id: "community",
      label: "Community",
      matchSuffixes: ["/community"],
    },
    {
      id: "billing",
      label: "Billing",
      matchSuffixes: ["/subscription", "/invoices"],
    },
  ],
  nutritionist: [
    { id: "overview", label: "Overview", matchSuffixes: ["/nutritionist"] },
    {
      id: "practice",
      label: "Practice",
      matchSuffixes: [
        "/schedule",
        "/patients",
        "/consultations",
        "/marketplace-plans",
      ],
    },
    {
      id: "finance",
      label: "Finance",
      matchSuffixes: ["/earnings"],
    },
  ],
};

function groupNavigationLinks(
  mainLinks: SidebarLink[],
  role: SidebarProps["role"],
): NavGroup[] {
  const specs = ROLE_GROUP_SPECS[role] ?? [];
  const usedUrls = new Set<string>();
  const groups: NavGroup[] = [];

  for (const spec of specs) {
    const matched = mainLinks.filter((link) =>
      spec.matchSuffixes.some((suffix) => link.url.endsWith(suffix)),
    );
    if (matched.length > 0) {
      matched.forEach((item) => usedUrls.add(item.url));
      groups.push({
        id: spec.id,
        label: spec.label,
        items: matched,
      });
    }
  }

  const remaining = mainLinks.filter((link) => !usedUrls.has(link.url));
  if (remaining.length > 0) {
    groups.push({
      id: "other",
      label: "Other",
      items: remaining,
    });
  }

  return groups;
}

export function SharedSidebar({ links, role }: SidebarProps) {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();
  const prevPathname = useRef(pathname);

  // Pin state (SSR-safe: defaults to false on initial render, hydrated in useEffect)
  const [isPinned, setIsPinned] = useState(false);
  const [isHoverExpanded, setIsHoverExpanded] = useState(false);
  const [isFocusExpanded, setIsFocusExpanded] = useState(false);

  // Scroll safety net state
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);

  const asideRef = useRef<HTMLElement | null>(null);
  const scrollRef = useRef<HTMLElement | null>(null);
  const scrollContentRef = useRef<HTMLDivElement | null>(null);
  const openTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isPointerDownRef = useRef(false);

  // Hydrate persisted pin state on mount (SSR-safe, default unpinned on first render)
  useEffect(() => {
    let frameId: number | null = null;
    try {
      const stored = window.localStorage.getItem(PIN_STORAGE_KEY);
      if (stored === "true") {
        frameId = window.requestAnimationFrame(() => {
          setIsPinned(true);
        });
      }
    } catch {
      // Ignore storage read errors
    }
    return () => {
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, []);

  // Cleanup hover timers on unmount
  useEffect(() => {
    return () => {
      if (openTimerRef.current) clearTimeout(openTimerRef.current);
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  // Auto-close sidebar on mobile when navigating to a new route
  useEffect(() => {
    if (isMobile && prevPathname.current !== pathname) {
      setOpenMobile(false);
    }
    prevPathname.current = pathname;
  }, [pathname, isMobile, setOpenMobile]);

  const isExpanded = !isMobile && (isPinned || isHoverExpanded || isFocusExpanded);
  const showFullLabels = isMobile || isExpanded;

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    setCanScrollUp(scrollTop > 2);
    setCanScrollDown(scrollTop + clientHeight < scrollHeight - 2);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    const contentEl = scrollContentRef.current;
    if (!el) return;

    updateScrollState();
    el.addEventListener("scroll", updateScrollState, { passive: true });

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => {
        updateScrollState();
      });
      resizeObserver.observe(el);
      if (contentEl) {
        resizeObserver.observe(contentEl);
      }
    }

    return () => {
      el.removeEventListener("scroll", updateScrollState);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [updateScrollState, showFullLabels, links]);

  const handlePointerEnter = (e: React.PointerEvent<HTMLElement>) => {
    if (isMobile || e.pointerType === "touch") return;
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    if (!isHoverExpanded) {
      openTimerRef.current = setTimeout(() => {
        setIsHoverExpanded(true);
      }, HOVER_OPEN_DELAY_MS);
    }
  };

  const handlePointerLeave = (e: React.PointerEvent<HTMLElement>) => {
    if (isMobile || e.pointerType === "touch") return;
    if (openTimerRef.current) {
      clearTimeout(openTimerRef.current);
      openTimerRef.current = null;
    }
    closeTimerRef.current = setTimeout(() => {
      setIsHoverExpanded(false);
    }, HOVER_CLOSE_DELAY_MS);
  };

  const handlePointerDownCapture = () => {
    isPointerDownRef.current = true;
    setTimeout(() => {
      isPointerDownRef.current = false;
    }, 0);
  };

  const handleFocusCapture = () => {
    if (isMobile) return;
    if (!isPointerDownRef.current) {
      setIsFocusExpanded(true);
    }
  };

  const handleBlurCapture = (e: React.FocusEvent<HTMLElement>) => {
    if (isMobile) return;
    if (!asideRef.current?.contains(e.relatedTarget as Node)) {
      setIsFocusExpanded(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === "Escape" && (isFocusExpanded || isHoverExpanded)) {
      if (openTimerRef.current) clearTimeout(openTimerRef.current);
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
      setIsFocusExpanded(false);
      setIsHoverExpanded(false);
    }
  };

  const handleTogglePin = () => {
    setIsPinned((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(PIN_STORAGE_KEY, String(next));
      } catch {
        // Ignore storage write errors
      }
      if (!next) {
        setIsFocusExpanded(false);
      }
      return next;
    });
  };

  const handleScrollToBottom = () => {
    const el = scrollRef.current;
    if (!el) return;
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollTo({
      top: el.scrollHeight,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  };

  const rolePath = role === "high_admin" ? "admin" : role;

  const isLinkActive = (url: string) =>
    url === `/${rolePath}`
      ? pathname === url
      : pathname === url || pathname.startsWith(`${url}/`);

  const safeLinks = useMemo(() => (Array.isArray(links) ? links : []), [links]);
  const mainLinks = useMemo(
    () =>
      safeLinks.filter(
        (link) =>
          !link.url.endsWith("/support") && !link.url.endsWith("/settings"),
      ),
    [safeLinks],
  );
  const bottomLinks = useMemo(
    () =>
      safeLinks.filter(
        (link) =>
          link.url.endsWith("/support") || link.url.endsWith("/settings"),
      ),
    [safeLinks],
  );

  const navGroups = useMemo(
    () => groupNavigationLinks(mainLinks, role),
    [mainLinks, role],
  );

  const renderLinkItem = (link: SidebarLink, inScrollZone = false) => {
    const isActive = isLinkActive(link.url);

    const linkElement = (
      <Link
        key={link.url}
        href={link.url}
        aria-label={link.title}
        aria-current={isActive ? "page" : undefined}
        onFocus={(e) => {
          if (inScrollZone) {
            e.currentTarget.scrollIntoView({ block: "nearest" });
          }
        }}
        className={cn(
          "group/nav flex h-11 w-full items-center rounded-2xl px-1.5 transition-colors duration-150 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-ring",
          showFullLabels
            ? isActive
              ? "bg-primary bg-btn-primary text-primary-foreground font-bold shadow-xs"
              : "font-medium text-muted-foreground hover:bg-accent/70 hover:text-foreground"
            : isActive
              ? "font-bold text-foreground"
              : "font-medium text-muted-foreground hover:text-foreground",
        )}
      >
        <span
          className={cn(
            "grid h-10 w-10 shrink-0 place-items-center rounded-[14px] transition-colors duration-150 motion-reduce:transition-none",
            showFullLabels
              ? isActive
                ? "bg-black/15 text-primary-foreground"
                : "text-muted-foreground group-hover/nav:text-primary"
              : isActive
                ? "bg-primary bg-btn-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground group-hover/nav:bg-accent group-hover/nav:text-accent-foreground",
          )}
        >
          <link.icon className="h-5 w-5 stroke-[1.9]" />
        </span>
        <span
          className={cn(
            "truncate whitespace-nowrap text-sm transition-[opacity,transform,max-width] duration-150 ease-out motion-reduce:transition-none",
            showFullLabels
              ? "ms-3 max-w-[168px] opacity-100 translate-x-0"
              : "ms-0 max-w-0 opacity-0 -translate-x-1 overflow-hidden pointer-events-none",
          )}
        >
          {link.title}
        </span>
      </Link>
    );

    if (isMobile) {
      return linkElement;
    }

    return (
      <Tooltip key={link.url} open={showFullLabels ? false : undefined}>
        <TooltipTrigger asChild>{linkElement}</TooltipTrigger>
        <TooltipContent side="right" sideOffset={12} className="font-semibold">
          {link.title}
        </TooltipContent>
      </Tooltip>
    );
  };

  const renderAsideContent = () => (
    <aside
      ref={asideRef}
      aria-label={`${rolePath} navigation`}
      data-expanded={showFullLabels ? "true" : "false"}
      data-pinned={isPinned ? "true" : "false"}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onPointerDownCapture={handlePointerDownCapture}
      onFocusCapture={handleFocusCapture}
      onBlurCapture={handleBlurCapture}
      onKeyDown={handleKeyDown}
      className={cn(
        "flex h-full w-full flex-col border border-border bg-card text-card-foreground transition-[width,box-shadow] duration-180 ease-out motion-reduce:transition-none",
        isMobile
          ? "rounded-e-[32px] border-s-0 px-4 py-5 gap-3 shadow-sm"
          : cn(
              "rounded-[32px] px-2.5 py-3.5 gap-2",
              isExpanded && !isPinned
                ? "shadow-2xl shadow-black/40"
                : "shadow-sm",
            ),
      )}
    >
      {/* ZONE 1: Top (Pinned Logo) */}
      <div className="w-full shrink-0">
        <Link
          href="/"
          aria-label="Home"
          className={cn(
            "flex h-12 w-full items-center justify-center rounded-[20px] bg-accent transition-opacity hover:opacity-90 overflow-hidden",
            showFullLabels ? "px-3.5" : "px-1.5",
          )}
        >
          {showFullLabels ? (
            <Logo className="justify-center shrink-0 [&_img]:h-5 [&_img]:w-auto" />
          ) : (
            <LogoIcon className="size-6 shrink-0" />
          )}
        </Link>
      </div>

      {/* ZONE 2: Middle (Scrollable Grouped Navigation List) */}
      <div className="relative flex w-full flex-1 min-h-0 flex-col">
        {/* Top soft fade indicator */}
        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-x-0 top-0 z-10 h-5 bg-gradient-to-b from-card via-card/80 to-transparent transition-opacity duration-150 motion-reduce:transition-none",
            canScrollUp ? "opacity-100" : "opacity-0",
          )}
        />

        <nav
          ref={scrollRef}
          aria-label={`${rolePath} primary navigation`}
          className="flex-1 min-h-0 w-full overflow-y-auto overflow-x-hidden py-0.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        >
          <div ref={scrollContentRef} className="flex w-full flex-col">
            {navGroups.map((group, groupIndex) => (
              <div key={group.id} className="flex w-full flex-col">
                {groupIndex > 0 && (
                  <div
                    role="separator"
                    className="my-1.5 mx-2 h-px shrink-0 bg-border/80"
                  />
                )}
                {showFullLabels && group.label && (
                  <div className="px-3 pt-1 pb-1 text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground/80 truncate select-none">
                    {group.label}
                  </div>
                )}
                <div className="flex w-full flex-col gap-1">
                  {group.items.map((link) => renderLinkItem(link, true))}
                </div>
              </div>
            ))}
          </div>
        </nav>

        {/* Bottom soft fade indicator */}
        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-x-0 bottom-0 z-10 h-8 bg-gradient-to-t from-card via-card/85 to-transparent transition-opacity duration-150 motion-reduce:transition-none",
            canScrollDown ? "opacity-100" : "opacity-0",
          )}
        />

        {/* Optional Chevron-Down Scroll Helper */}
        {canScrollDown && (
          <button
            type="button"
            onClick={handleScrollToBottom}
            aria-label="Scroll to bottom of navigation"
            className="absolute bottom-1 left-1/2 -translate-x-1/2 z-20 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-accent text-primary shadow-sm transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-ring cursor-pointer"
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* ZONE 3: Bottom (Pinned Utility Links + Pin/Unpin Toggle) */}
      <div className="mt-auto flex w-full shrink-0 flex-col gap-1 border-t border-border pt-2">
        {bottomLinks.map((link) => renderLinkItem(link, false))}

        {!isMobile && (
          <Tooltip open={showFullLabels ? false : undefined}>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={handleTogglePin}
                aria-label={isPinned ? "Unpin sidebar" : "Pin sidebar"}
                aria-pressed={isPinned}
                className={cn(
                  "group/pin flex h-10 w-full items-center rounded-2xl px-1.5 text-muted-foreground transition-colors duration-150 motion-reduce:transition-none hover:bg-accent/70 hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring cursor-pointer",
                  isPinned && "text-primary font-semibold",
                )}
              >
                <span
                  className={cn(
                    "grid h-10 w-10 shrink-0 place-items-center rounded-[14px] transition-colors duration-150 motion-reduce:transition-none",
                    isPinned
                      ? "text-primary"
                      : "text-muted-foreground group-hover/pin:text-primary",
                  )}
                >
                  {isPinned ? (
                    <PinOff className="h-4 w-4 stroke-[2]" />
                  ) : (
                    <Pin className="h-4 w-4 stroke-[2]" />
                  )}
                </span>
                <span
                  className={cn(
                    "truncate whitespace-nowrap text-xs font-semibold transition-[opacity,transform,max-width] duration-150 ease-out motion-reduce:transition-none",
                    showFullLabels
                      ? "ms-3 max-w-[168px] opacity-100 translate-x-0"
                      : "ms-0 max-w-0 opacity-0 -translate-x-1 overflow-hidden pointer-events-none",
                  )}
                >
                  {isPinned ? "Unpin sidebar" : "Pin sidebar"}
                </span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={12} className="font-semibold">
              {isPinned ? "Unpin sidebar" : "Pin sidebar"}
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </aside>
  );

  // Mobile: preserve existing Sheet drawer behavior via BaseSidebar
  if (isMobile) {
    return (
      <BaseSidebar className="border-r-0! bg-transparent p-0 [&_[data-slot=sidebar-inner]]:bg-transparent">
        {renderAsideContent()}
      </BaseSidebar>
    );
  }

  // Desktop: icon-only rail (72px + 16px start padding = 88px footprint) that overlays at 252px (+ 16px start padding = 268px) on hover/focus, or offsets page when pinned
  return (
    <div
      className="group peer hidden text-sidebar-foreground md:block"
      data-state={isExpanded ? "expanded" : "collapsed"}
      data-pinned={isPinned ? "true" : "false"}
      data-slot="sidebar"
    >
      {/* Page layout footprint: stays at 88px (72px rail + 16px padding) unless pinned */}
      <div
        data-slot="sidebar-gap"
        className={cn(
          "relative shrink-0 bg-transparent transition-[width] duration-180 ease-out motion-reduce:transition-none",
          isPinned ? "w-[268px]" : "w-[88px]",
        )}
      />
      {/* Fixed rail container: floats above page content (z-30) when expanded */}
      <div
        data-slot="sidebar-container"
        className={cn(
          "fixed inset-y-0 start-0 z-30 hidden h-svh py-4 ps-4 pe-0 transition-[width] duration-180 ease-out motion-reduce:transition-none md:flex",
          isExpanded ? "w-[268px]" : "w-[88px]",
        )}
      >
        <div
          data-sidebar="sidebar"
          data-slot="sidebar-inner"
          className="flex h-full w-full flex-col bg-transparent"
        >
          {renderAsideContent()}
        </div>
      </div>
    </div>
  );
}


