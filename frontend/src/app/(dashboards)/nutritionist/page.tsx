"use client";

import React from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Users, CalendarCheck, FileText, Wallet, Calendar, Store, DollarSign } from "lucide-react";
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

// ── Mock weekly earnings data ───────────────────────────────────────────
const weeklyEarnings = [
  { name: "Sun", amount: 0 },
  { name: "Mon", amount: 45 },
  { name: "Tue", amount: 120 },
  { name: "Wed", amount: 0 },
  { name: "Thu", amount: 29.99 },
  { name: "Fri", amount: 165 },
  { name: "Sat", amount: 45 },
];

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
  return (
    <div className="flex flex-col gap-8 pb-10 max-w-7xl mx-auto animate-in fade-in-50 duration-500">
      {/* Header section */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
          Good morning, Dr. Sarah! <span className="inline-block animate-wave">👋</span>
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
                <p className="text-lg font-bold text-foreground">24</p>
                <p className="text-sm text-primary font-medium">+3 this month</p>
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
                <p className="text-lg font-bold text-foreground">5</p>
                <p className="text-sm text-muted-foreground">Next: Today, 2:00 PM</p>
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
                <p className="text-lg font-bold text-foreground">2</p>
                <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">Awaiting admin review</p>
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
                  <p className="text-lg font-bold text-foreground">$1,088.00</p>
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
