"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Users, CalendarCheck, FileText, Wallet, Calendar, Store, DollarSign, Loader2 } from "lucide-react";
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
  groupTransactionsByDayOfWeek,
  NutritionistEarningsSummary,
} from "@/lib/nutritionist";

// ── Custom tooltip ──────────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-xl text-card-foreground text-sm">
      <p className="text-muted-foreground text-xs mb-0.5">{label}</p>
      <p className="font-bold text-primary">${payload[0].value.toFixed(2)}</p>
    </div>
  );
};

// ── Component ───────────────────────────────────────────────────────────
export default function NutritionistOverviewPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [displayName, setDisplayName] = useState("Nutritionist");

  const [activePatients, setActivePatients] = useState(0);
  const [upcomingConsultations, setUpcomingConsultations] = useState(0);
  const [nextConsultationLabel, setNextConsultationLabel] = useState<string | null>(null);
  const [pendingPlans, setPendingPlans] = useState(0);
  const [earnings, setEarnings] = useState<NutritionistEarningsSummary | null>(null);

  const weeklyEarnings = useMemo(() => {
    if (!earnings?.transactions) return [];
    return groupTransactionsByDayOfWeek(earnings.transactions);
  }, [earnings]);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [profile, patients, consultations, plans, earningsData] = await Promise.all([
          getNutritionistProfile(),
          getNutritionistPatients(),
          getNutritionistConsultations(),
          getNutritionistPlans(),
          getNutritionistEarnings(),
        ]);

        // Display name
        const rawName = profile.username || profile.user?.username || "Nutritionist";

        setDisplayName(formatNutritionistName(rawName));


        // Active patients count
        setActivePatients(Array.isArray(patients) ? patients.length : 0);

        // Upcoming consultations — only scheduled or notified (not finished/cancelled)
        const upcoming = Array.isArray(consultations)
          ? consultations.filter((c) => c.status === "scheduled" || c.status === "notified")
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
          const nextDate = new Date(`${next.appointment_date}T${next.start_time}`);
          const today = new Date();
          const isToday = nextDate.toDateString() === today.toDateString();
          const timeStr = nextDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
          setNextConsultationLabel(isToday ? `Next: Today, ${timeStr}` : `Next: ${nextDate.toLocaleDateString()}`);
        }

        // Pending plans
        setPendingPlans(
          Array.isArray(plans) ? plans.filter((p) => p.status === "pending").length : 0,
        );

        // Earnings
        setEarnings(earningsData);
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
    <div className="flex flex-col gap-8 pb-10 max-w-7xl mx-auto animate-in fade-in-50 duration-500">
      {/* Header section */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
          Good morning, {displayName}! <span className="inline-block animate-wave">👋</span>
        </h1>
        <Button asChild size="lg" className="px-6 rounded-lg">
          <Link href="/nutritionist/schedule">
            <Calendar className="w-5 h-5 mr-2" />
            View Schedule
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 — Active Patients */}
        <Card className="border-border shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className="bg-primary/20 p-3 rounded-xl text-primary mt-1">
                <Users className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Active Patients</p>
                <p className="text-lg font-bold text-foreground">{activePatients}</p>
                <p className="text-sm text-primary font-medium">Total enrolled</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 2 — Upcoming Consultations */}
        <Card className="border-border shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className="bg-secondary p-3 rounded-xl text-muted-foreground mt-1">
                <CalendarCheck className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Upcoming Consultations</p>
                <p className="text-lg font-bold text-foreground">{upcomingConsultations}</p>
                <p className="text-sm text-muted-foreground">{nextConsultationLabel ?? "No upcoming"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 3 — Pending Plans */}
        <Card className="border-border shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className="bg-secondary p-3 rounded-xl text-muted-foreground mt-1">
                <FileText className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pending Plans</p>
                <p className="text-lg font-bold text-foreground">{pendingPlans}</p>
                <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">
                  {pendingPlans > 0 ? "Awaiting admin review" : "All plans reviewed"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 4 — Available Balance */}
        <Card className="border-border shadow-sm cursor-pointer hover:ring-1 hover:ring-primary/30 transition-all">
          <Link href="/nutritionist/earnings">
            <CardContent className="p-5">
              <div className="flex items-start gap-4">
                <div className="bg-secondary p-3 rounded-xl text-muted-foreground mt-1">
                  <Wallet className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Available Balance</p>
                  <p className="text-lg font-bold text-foreground">
                    ${(earnings?.total_net ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-sm text-primary font-medium">View details →</p>
                </div>
              </div>
            </CardContent>
          </Link>
        </Card>
      </div>

      {/* Chart + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart Area */}
        <Card className="lg:col-span-2 border-none shadow-sm">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold text-foreground mb-6 tracking-wide">
              Earnings This Week
            </h2>
            <div className="w-full h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyEarnings} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="earningsFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" className="opacity-30" />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "var(--muted-foreground)", fontSize: 13 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "var(--muted-foreground)", fontSize: 13 }}
                    tickFormatter={(v) => `$${v}`}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="var(--primary)"
                    strokeWidth={3}
                    fill="url(#earningsFill)"
                    dot={{ fill: "var(--primary)", strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-foreground mb-2 tracking-wide lg:mb-1 lg:mt-0 mt-4">
            Quick Actions
          </h2>

          <Button
            asChild
            className="w-full h-auto py-6 flex flex-col items-center justify-center gap-3 transition-all rounded-xl shadow-sm"
          >
            <Link href="/nutritionist/consultations">
              <Users className="w-8 h-8 mb-1" />
              <span className="text-base font-semibold">Consultation Workflow</span>
            </Link>
          </Button>

          <Button
            asChild
            className="w-full h-auto py-6 flex flex-col items-center justify-center gap-3 transition-all rounded-xl shadow-sm"
          >
            <Link href="/nutritionist/marketplace-plans">
              <Store className="w-8 h-8 mb-1" />
              <span className="text-base font-semibold">Design Public Plan</span>
            </Link>
          </Button>

          <Button
            asChild
            className="w-full h-auto py-6 flex flex-col items-center justify-center gap-3 transition-all rounded-xl shadow-sm"
          >
            <Link href="/nutritionist/earnings">
              <DollarSign className="w-8 h-8 mb-1" />
              <span className="text-base font-semibold">View Earnings</span>
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
