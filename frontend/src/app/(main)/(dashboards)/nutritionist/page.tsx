"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/Button";
import {
  Users,
  CalendarCheck,
  FileText,
  Calendar,
  Store,
  DollarSign,
  Loader2,
  AlertCircle,
  Settings2,
  ArrowRight,
  Check,
  User,
  Plus,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import Link from "next/link";
import { toast } from "sonner";
import { formatNutritionistName } from "@/lib/utils";

import {
  getNutritionistPatients,
  getNutritionistConsultations,
  getNutritionistPlans,
  getNutritionistEarnings,
  getNutritionistProfile,
  getNutritionistSchedule,
  groupTransactionsByDayOfWeek,
  NutritionistEarningsSummary,
} from "@/lib/nutritionist";

// ── Custom tooltip ──────────────────────────────────────────────────────
const ChartTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl px-3.5 py-2 shadow-xl text-card-foreground text-sm">
      <p className="text-muted-foreground text-xs mb-0.5">{label}</p>
      <p className="font-bold text-primary">${payload[0].value.toFixed(2)}</p>
    </div>
  );
};

const WEEKDAY_INITIALS = ["M", "T", "W", "T", "F", "S", "S"];

// ── Component ───────────────────────────────────────────────────────────
export default function NutritionistOverviewPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [displayName, setDisplayName] = useState("Nutritionist");

  const [activePatients, setActivePatients] = useState(0);
  const [upcomingConsultations, setUpcomingConsultations] = useState(0);
  const [nextConsultationLabel, setNextConsultationLabel] = useState<
    string | null
  >(null);
  const [pendingPlans, setPendingPlans] = useState(0);
  const [earnings, setEarnings] =
    useState<NutritionistEarningsSummary | null>(null);
  const [showAvailabilityReminder, setShowAvailabilityReminder] =
    useState(false);

  const weeklyEarnings = useMemo(() => {
    if (!earnings?.transactions) return [];
    return groupTransactionsByDayOfWeek(earnings.transactions);
  }, [earnings]);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [
          profile,
          patients,
          consultations,
          plans,
          earningsData,
          schedule,
        ] = await Promise.all([
          getNutritionistProfile(),
          getNutritionistPatients(),
          getNutritionistConsultations(),
          getNutritionistPlans(),
          getNutritionistEarnings(),
          getNutritionistSchedule(),
        ]);

        // Display name
        const rawName =
          profile.username || profile.user?.username || "Nutritionist";

        setDisplayName(formatNutritionistName(rawName));

        // Active patients count
        setActivePatients(Array.isArray(patients) ? patients.length : 0);

        // Upcoming consultations — only scheduled or notified (not finished/cancelled)
        const upcoming = Array.isArray(consultations)
          ? consultations.filter(
              (c) => c.status === "scheduled" || c.status === "notified",
            )
          : [];
        setUpcomingConsultations(upcoming.length);

        // Find the next upcoming consultation for the subtitle
        if (upcoming.length > 0) {
          const sorted = [...upcoming].sort((a, b) => {
            const dateA = new Date(`${a.appointment_date}T${a.start_time}`);
            const dateB = new Date(`${b.appointment_date}T${b.start_time}`);
            return dateA.getTime() - dateB.getTime();
          });
          const next = sorted[0];
          const nextDate = new Date(
            `${next.appointment_date}T${next.start_time}`,
          );
          const today = new Date();
          const isToday = nextDate.toDateString() === today.toDateString();
          const timeStr = nextDate.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          });
          setNextConsultationLabel(
            isToday
              ? `Next: Today, ${timeStr}`
              : `Next: ${nextDate.toLocaleDateString()}`,
          );
        }

        // Pending plans
        setPendingPlans(
          Array.isArray(plans)
            ? plans.filter((p) => p.status === "pending").length
            : 0,
        );

        // Earnings
        setEarnings(earningsData);

        setShowAvailabilityReminder(
          !Array.isArray(schedule.availability) ||
            schedule.availability.length === 0,
        );
      } catch {
        toast.error("Failed to load dashboard data.");
      } finally {
        setIsLoading(false);
      }
    };
    void loadDashboard();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] animate-in fade-in-50 duration-500">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-10 max-w-[1240px] mx-auto animate-in fade-in-50 duration-500">
      {showAvailabilityReminder && (
        <div className="rounded-[28px] border border-border bg-card p-5 shadow-xs transition-all">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3.5 md:items-center">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-accent text-primary">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-bold uppercase tracking-widest text-primary">
                  Availability Setup Needed
                </p>
                <p className="text-sm text-muted-foreground">
                  Set your schedule availability rules so clients can book
                  consultations with you.
                </p>
              </div>
            </div>

            <Button
              asChild
              className="w-full rounded-full px-6 font-semibold md:w-auto"
            >
              <Link href="/nutritionist/schedule?tab=availability">
                <Settings2 className="mr-2 h-4 w-4" />
                Set Availability
              </Link>
            </Button>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-1">
        <div>
          <h1 className="text-4xl md:text-[52px] font-bold text-foreground tracking-tight leading-[1.05]">
            Good morning, {displayName}!
          </h1>
          <p className="mt-2.5 text-base md:text-lg text-muted-foreground font-medium">
            {upcomingConsultations === 0
              ? "No upcoming consultations."
              : `${upcomingConsultations} upcoming consultation${
                  upcomingConsultations === 1 ? "" : "s"
                }.`}{" "}
            {pendingPlans === 0
              ? "Every plan is reviewed."
              : `${pendingPlans} plan${
                  pendingPlans === 1 ? "" : "s"
                } awaiting review.`}
          </p>
        </div>
        <Link
          href="/nutritionist/schedule"
          className="inline-flex items-center gap-3 rounded-full bg-primary bg-btn-primary text-primary-foreground px-7 py-4 text-base font-bold transition-transform hover:-translate-y-0.5 shadow-sm self-start md:self-auto shrink-0"
        >
          <Calendar className="w-[18px] h-[18px] stroke-[2.2]" />
          View Schedule
        </Link>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Top-Left (8 cols): Available Balance + Earnings This Week */}
        <div className="lg:col-span-8 rounded-[32px] border border-border bg-card p-6 md:p-7 flex flex-col justify-between gap-6 shadow-xs">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-[0.06em] text-muted-foreground">
                Available Balance
              </span>
              <p className="text-4xl md:text-[44px] font-bold text-foreground tracking-tight leading-none mt-2">
                $
                {(earnings?.total_net ?? 0).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </p>
            </div>
            <div className="flex items-center gap-3.5">
              <span className="inline-flex items-center rounded-full bg-accent border border-border px-4 py-2 text-[13px] font-bold text-foreground">
                Earnings This Week
              </span>
              <Link
                href="/nutritionist/earnings"
                className="text-sm font-bold text-primary hover:underline"
              >
                View details →
              </Link>
            </div>
          </div>

          <div className="w-full h-[210px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={weeklyEarnings}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient
                    id="earningsFill"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor="var(--primary)"
                      stopOpacity={0.25}
                    />
                    <stop
                      offset="95%"
                      stopColor="var(--primary)"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="4 4"
                  vertical={false}
                  stroke="var(--border)"
                  className="opacity-60"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                  dy={8}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                  tickFormatter={(v) => `$${v}`}
                />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="var(--primary)"
                  strokeWidth={2.5}
                  fill="url(#earningsFill)"
                  dot={{
                    fill: "var(--card)",
                    stroke: "var(--primary)",
                    strokeWidth: 2.5,
                    r: 4,
                  }}
                  activeDot={{ r: 6 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top-Right (4 cols): Quick Actions */}
        <div className="lg:col-span-4 flex flex-col gap-3.5">
          <h2 className="text-lg font-bold text-foreground px-1">
            Quick Actions
          </h2>
          <div className="flex flex-col gap-3 flex-1 justify-between">
            <QuickActionCard
              href="/nutritionist/consultations"
              title="Consultation Workflow"
              subtitle="Manage active client sessions"
              icon={Users}
              primary
            />
            <QuickActionCard
              href="/nutritionist/marketplace-plans"
              title="Design Public Plan"
              subtitle="Create & publish marketplace templates"
              icon={Store}
            />
            <QuickActionCard
              href="/nutritionist/earnings"
              title="View Earnings"
              subtitle="Payout history & financial reports"
              icon={DollarSign}
            />
          </div>
        </div>

        {/* Bottom Row Card 1 (4 cols): Active Patients */}
        <div className="lg:col-span-4 rounded-[28px] border border-border bg-card p-6 flex flex-col justify-between gap-5 shadow-xs">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[15px] font-bold text-foreground">
              Active Patients
            </span>
            <div className="w-11 h-11 rounded-full bg-accent border border-border text-primary flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
          </div>

          <div className="flex items-end justify-between gap-3">
            <p className="text-[40px] font-bold text-foreground tracking-tight leading-none">
              {activePatients}
            </p>
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-accent border-2 border-card flex items-center justify-center text-muted-foreground">
                <User className="w-3.5 h-3.5" />
              </div>
              <div className="w-8 h-8 -ml-2.5 rounded-full bg-accent border-2 border-card flex items-center justify-center text-primary">
                <Plus className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>

          <div className="pt-3.5 border-t border-border/60 flex items-center justify-between gap-2 text-[13px]">
            <span className="text-primary font-semibold">Total enrolled</span>
            <Link
              href="/nutritionist/patients"
              className="text-muted-foreground hover:text-foreground font-semibold transition-colors"
            >
              Patient list →
            </Link>
          </div>
        </div>

        {/* Bottom Row Card 2 (5 cols): Upcoming Consultations */}
        <div className="lg:col-span-5 rounded-[28px] border border-border bg-card p-6 flex flex-col justify-between gap-5 shadow-xs">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[15px] font-bold text-foreground">
              Upcoming Consultations
            </span>
            <div className="w-11 h-11 rounded-full bg-accent border border-border text-primary flex items-center justify-center shrink-0">
              <CalendarCheck className="w-5 h-5" />
            </div>
          </div>

          <div className="flex items-baseline gap-3.5">
            <p className="text-[40px] font-bold text-foreground tracking-tight leading-none">
              {upcomingConsultations}
            </p>
            <span className="text-sm font-medium text-muted-foreground">
              {nextConsultationLabel ?? "No upcoming"}
            </span>
          </div>

          <div className="grid grid-cols-7 gap-1.5 pt-1">
            {WEEKDAY_INITIALS.map((day, idx) => (
              <div
                key={`${day}-${idx}`}
                className="h-9 rounded-full bg-muted/60 border border-border flex items-center justify-center text-xs font-bold text-muted-foreground"
              >
                {day}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Row Card 3 (3 cols): Pending Plans */}
        <div className="lg:col-span-3 rounded-[28px] border border-border bg-card p-6 flex flex-col justify-between gap-5 shadow-xs">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[15px] font-bold text-foreground">
              Pending Plans
            </span>
            <div className="w-11 h-11 rounded-full bg-accent border border-border text-primary flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
          </div>

          <p className="text-[40px] font-bold text-foreground tracking-tight leading-none">
            {pendingPlans}
          </p>

          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-ember/15 border border-ember/30 px-3 py-1.5 text-xs font-bold text-ember">
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              {pendingPlans > 0
                ? "Awaiting admin review"
                : "All plans reviewed"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickActionCard({
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
              ? "w-10 h-10 rounded-full bg-black/15 text-primary-foreground flex items-center justify-center shrink-0"
              : "w-10 h-10 rounded-full bg-accent border border-border text-primary flex items-center justify-center shrink-0"
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

