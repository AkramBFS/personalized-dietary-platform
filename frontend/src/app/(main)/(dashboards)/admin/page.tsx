"use client";

import React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  UserCheck,
  ShieldAlert,
  MessageSquare,
  Check,
  ArrowRight,
  FileText,
  Flag,
  BookOpen,
  Activity,
} from "lucide-react";

import { getDashboardStats, type DashboardStats } from "@/lib/admin";

export default function AdminOverviewPage() {
  const [resolved, setResolved] = React.useState<DashboardStats | null>(null);

  React.useEffect(() => {
    const loadStats = async () => {
      try {
        const stats = await getDashboardStats();
        setResolved(stats);
      } catch (error) {
        console.error("Failed to load dashboard stats", error);
      }
    };
    void loadStats();
  }, []);

  if (!resolved) {
    return (
      <div className="flex flex-col gap-6 pb-10 max-w-[1240px] mx-auto">
        <div>
          <h1 className="text-4xl md:text-[52px] font-bold text-foreground tracking-tight leading-[1.05]">
            Admin Overview
          </h1>
          <p className="text-muted-foreground mt-2.5 text-base md:text-lg font-medium">
            Loading statistics...
          </p>
        </div>
      </div>
    );
  }

  const pendingPlansCount = resolved.pending_plans ?? 0;

  return (
    <div className="flex flex-col gap-6 pb-10 max-w-[1240px] mx-auto">
      {/* Hero Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-1">
        <div>
          <h1 className="text-4xl md:text-[52px] font-bold text-foreground tracking-tight leading-[1.05]">
            Admin Overview
          </h1>
          <p className="text-muted-foreground mt-2.5 text-base md:text-lg font-medium">
            Platform health, approvals pipeline, and recent operations at a
            glance.
          </p>
        </div>
        <Link
          href="/admin/inquiries"
          className="inline-flex items-center gap-3 rounded-full bg-primary bg-btn-primary text-primary-foreground px-7 py-4 text-base font-bold transition-transform hover:-translate-y-0.5 shadow-sm self-start md:self-auto shrink-0"
        >
          <MessageSquare className="w-[18px] h-[18px] stroke-[2.2]" />
          Review Inquiries
        </Link>
      </div>

      {/* Main 2-Column Grid: 2x2 Stats + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.9fr_1fr] gap-6">
        {/* Left: 2x2 Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <StatCard
            title="Total Users"
            value={(resolved.total_users ?? 0).toLocaleString()}
            description="Active accounts"
            icon={Users}
            href="/admin/users"
            linkLabel="User Management →"
          />
          <StatCard
            title="Active Nutritionists"
            value={(resolved.total_nutritionists ?? 0).toLocaleString()}
            description="Verified experts"
            icon={UserCheck}
            href="/admin/approvals"
            linkLabel="Approvals →"
          />
          <StatCard
            title="Pending Plans"
            value={pendingPlansCount.toLocaleString()}
            description="Require moderation"
            icon={ShieldAlert}
            href="/admin/plans"
            linkLabel="Plan Management →"
            badge={
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 border border-primary/25 px-2.5 py-1 text-xs font-semibold text-primary">
                <Check className="w-3 h-3 stroke-[2.5]" />
                {pendingPlansCount === 0 ? "Queue clear" : "Needs review"}
              </span>
            }
          />
          <StatCard
            title="Open Inquiries"
            value={(resolved.unresolved_inquiries ?? 0).toLocaleString()}
            description="Support tickets"
            icon={MessageSquare}
            href="/admin/inquiries"
            linkLabel="Inquiries →"
            highlightIcon
          />
        </div>

        {/* Right: Quick Actions */}
        <div className="flex flex-col gap-3.5">
          <h2 className="text-lg font-bold text-foreground px-1">
            Quick Actions
          </h2>
          <div className="flex flex-col gap-3 flex-1 justify-between">
            <QuickActionItem
              href="/admin/approvals"
              title="Nutritionist Approvals"
              subtitle="Review credentials & verify specialists"
              icon={UserCheck}
              primary
            />
            <QuickActionItem
              href="/admin/plans"
              title="Plan Management"
              subtitle="Moderate public & custom meal templates"
              icon={FileText}
            />
            <QuickActionItem
              href="/admin/moderation"
              title="Content Moderation"
              subtitle="Inspect reported comments & community posts"
              icon={Flag}
            />
            <QuickActionItem
              href="/admin/blog"
              title="Blog Management"
              subtitle="Publish articles & manage editorial posts"
              icon={BookOpen}
            />
          </div>
        </div>
      </div>

      {/* Bottom: Recent Activity */}
      <div className="rounded-[32px] border border-border bg-card p-6 md:p-7 flex flex-col gap-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="inline-flex items-center rounded-full bg-accent border border-border px-4 py-2 text-[15px] font-bold text-foreground">
            Recent Activity
          </span>
          <span className="text-[13px] font-medium text-muted-foreground">
            Latest system events &amp; moderation logs
          </span>
        </div>

        {resolved.recent_activity.length > 0 ? (
          <div className="space-y-3">
            {resolved.recent_activity.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl border border-border bg-muted/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <p className="text-sm font-medium text-foreground">
                  {item.text}
                </p>
                <Badge variant="outline" className="text-xs w-fit shrink-0">
                  {new Date(item.created_at).toLocaleString()}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-border bg-muted/35 py-9 px-6 flex flex-col sm:flex-row items-center justify-center gap-4 text-center sm:text-left">
            <div className="w-11 h-11 rounded-full bg-accent border border-border text-primary flex items-center justify-center shrink-0">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[15px] font-semibold text-foreground">
                No recent activity to display.
              </p>
              <p className="text-[13px] text-muted-foreground mt-0.5">
                New user registrations, plan submissions, and inquiry updates
                will appear here automatically.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  href,
  linkLabel,
  badge,
  highlightIcon,
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  linkLabel: string;
  badge?: React.ReactNode;
  highlightIcon?: boolean;
}) {
  return (
    <div className="rounded-[28px] border border-border bg-card p-6 flex flex-col justify-between transition-all hover:-translate-y-0.5 shadow-xs">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[15px] font-bold text-foreground">{title}</p>
        <div
          className={
            highlightIcon
              ? "w-11 h-11 rounded-full bg-primary/15 border border-primary/35 text-primary flex items-center justify-center shrink-0"
              : "w-11 h-11 rounded-full bg-accent border border-border text-primary flex items-center justify-center shrink-0"
          }
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="flex items-baseline gap-3 mt-4 mb-5">
        <p className="text-[44px] font-bold text-foreground tracking-tight leading-none">
          {value}
        </p>
        {badge}
      </div>

      <div className="pt-3.5 border-t border-border/60 flex items-center justify-between gap-2 text-[13px]">
        <span className="text-muted-foreground font-medium">{description}</span>
        <Link
          href={href}
          className="text-primary font-semibold hover:underline whitespace-nowrap"
        >
          {linkLabel}
        </Link>
      </div>
    </div>
  );
}

function QuickActionItem({
  href,
  title,
  subtitle,
  icon: Icon,
  primary,
}: {
  href: string;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  primary?: boolean;
}) {
  return (
    <Link
      href={href}
      className={
        primary
          ? "group flex items-center justify-between gap-3 rounded-3xl bg-primary bg-btn-primary text-primary-foreground px-5 py-4 transition-all hover:translate-x-1 shadow-xs"
          : "group flex items-center justify-between gap-3 rounded-3xl border border-border bg-card text-foreground px-5 py-4 transition-all hover:translate-x-1 hover:bg-accent/50 shadow-xs"
      }
    >
      <div className="flex items-center gap-3.5 min-w-0">
        <div
          className={
            primary
              ? "w-[38px] h-[38px] rounded-full bg-black/15 text-primary-foreground flex items-center justify-center shrink-0"
              : "w-[38px] h-[38px] rounded-full bg-accent border border-border text-primary flex items-center justify-center shrink-0"
          }
        >
          <Icon className="w-[18px] h-[18px]" />
        </div>
        <div className="min-w-0">
          <div className="text-[15px] font-bold leading-tight truncate">
            {title}
          </div>
          <div
            className={
              primary
                ? "text-xs font-medium text-primary-foreground/80 mt-0.5 truncate"
                : "text-xs font-medium text-muted-foreground mt-0.5 truncate"
            }
          >
            {subtitle}
          </div>
        </div>
      </div>
      <ArrowRight
        className={
          primary
            ? "w-[18px] h-[18px] shrink-0 text-primary-foreground transition-transform group-hover:translate-x-1"
            : "w-[18px] h-[18px] shrink-0 text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-1"
        }
      />
    </Link>
  );
}

