"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Wallet, TrendingUp, BadgePercent, ArrowUpRight, ArrowDownRight, Clock } from "lucide-react";
import { getNutritionistEarnings, NutritionistEarningsSummary } from "@/lib/nutritionist";
import { toast } from "sonner";

// ── Interfaces ──────────────────────────────────────────────────────────
interface Payout {
  id: number;
  periodStart: string;
  periodEnd: string;
  grossAmount: number;
  commission: number;
  netAmount: number;
  status: "completed" | "processing" | "upcoming";
  paidAt: string | null;
}

// ── Mock Data ───────────────────────────────────────────────────────────
const monthlyIncome = [
  { month: "Nov 2025", gross: 820, net: 697 },
  { month: "Dec 2025", gross: 1450, net: 1232 },
  { month: "Jan 2026", gross: 1120, net: 952 },
  { month: "Feb 2026", gross: 1780, net: 1513 },
  { month: "Mar 2026", gross: 2340, net: 1989 },
  { month: "Apr 2026", gross: 1650, net: 1402 },
];

const mockPayouts: Payout[] = [
  { id: 1, periodStart: "2026-03-16", periodEnd: "2026-03-31", grossAmount: 1280.00, commission: 192.00, netAmount: 1088.00, status: "completed", paidAt: "2026-04-02" },
  { id: 2, periodStart: "2026-04-01", periodEnd: "2026-04-15", grossAmount: 965.00, commission: 144.75, netAmount: 820.25, status: "processing", paidAt: null },
  { id: 3, periodStart: "2026-04-16", periodEnd: "2026-04-30", grossAmount: 0, commission: 0, netAmount: 0, status: "upcoming", paidAt: null },
];

// ── Helpers ─────────────────────────────────────────────────────────────
const serviceBadge = (service: "plan" | "consultation_advice" | "consultation_custom") => {
  switch (service) {
    case "consultation_advice":
      return <Badge className="bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 shadow-none border-0 text-xs">Advice</Badge>;
    case "consultation_custom":
      return <Badge className="bg-violet-500/10 text-violet-600 hover:bg-violet-500/20 shadow-none border-0 text-xs">Custom Plan</Badge>;
    case "plan":
      return <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 shadow-none border-0 text-xs">Plan Sale</Badge>;
  }
};

const payoutStatusBadge = (status: Payout["status"]) => {
  switch (status) {
    case "completed":
      return <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 shadow-none border-0">Completed</Badge>;
    case "processing":
      return <Badge className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 shadow-none border-0">Processing</Badge>;
    case "upcoming":
      return <Badge className="bg-slate-500/10 text-slate-500 hover:bg-slate-500/20 shadow-none border-0">Upcoming</Badge>;
  }
};

// ── Custom tooltip ──────────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; dataKey: string }>; label?: string }) => {
  if (!active || !payload) return null;
  return (
    <div className="bg-[#1f2937] border border-slate-700 rounded-lg p-3 shadow-xl text-white text-sm">
      <p className="font-semibold mb-1.5">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="flex justify-between gap-6">
          <span className="text-slate-400 capitalize">{entry.dataKey}:</span>
          <span className="font-medium">${entry.value.toLocaleString()}</span>
        </p>
      ))}
    </div>
  );
};

// ── Component ───────────────────────────────────────────────────────────
export default function EarningsPage() {
  const [earnings, setEarnings] = useState<NutritionistEarningsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadEarnings = async () => {
      try {
        const payload = await getNutritionistEarnings();
        setEarnings(payload);
      } catch {
        toast.error("Failed to load earnings.");
      } finally {
        setIsLoading(false);
      }
    };
    void loadEarnings();
  }, []);

  const availableBalance = useMemo(() => {
    if (!earnings) return 0;
    return earnings.total_net;
  }, [earnings]);

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading earnings...</div>;
  }

  if (!earnings) {
    return <div className="text-sm text-muted-foreground">Earnings data unavailable.</div>;
  }

  return (
    <div className="flex flex-col gap-8 pb-10 max-w-7xl mx-auto animate-in fade-in-50 duration-500">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
          Earnings & Payouts
        </h1>
        <p className="text-muted-foreground mt-1">
          Track your revenue streams, review transactions, and monitor payout cycles.
        </p>
      </div>

      {/* ── KPI Cards ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Available Balance */}
        <Card className="dark:bg-[#202731] border-none shadow-sm shadow-[#1a2027]/50">
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className="bg-emerald-600/20 p-3 rounded-xl text-emerald-500 mt-1">
                <Wallet className="w-6 h-6" />
              </div>
              <div className="space-y-1 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground dark:text-gray-400">Available Balance</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">${availableBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                  <ArrowUpRight className="w-3.5 h-3.5" /> Ready to withdraw
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Earned */}
        <Card className="dark:bg-[#202731] border-none shadow-sm shadow-[#1a2027]/50">
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-xl text-gray-500 dark:text-gray-400 mt-1">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div className="space-y-1 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground dark:text-gray-400">Total Earned (All-Time)</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">${earnings.total_gross.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                <p className="text-sm text-muted-foreground dark:text-gray-400">Gross revenue before fees</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Commission Deducted */}
        <Card className="dark:bg-[#202731] border-none shadow-sm shadow-[#1a2027]/50">
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className="bg-amber-100 dark:bg-amber-900/30 p-3 rounded-xl text-amber-600 dark:text-amber-400 mt-1">
                <BadgePercent className="w-6 h-6" />
              </div>
              <div className="space-y-1 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground dark:text-gray-400">Commission Deducted</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">${earnings.total_commission.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                <p className="text-sm text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
                  <ArrowDownRight className="w-3.5 h-3.5" /> 15% platform fee
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Income Over Time Chart ──────────────────────────────────── */}
      <Card className="dark:bg-[#202731] border-none shadow-sm shadow-[#1a2027]/50">
        <CardContent className="p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 tracking-wide">
            Income Over Time
          </h2>
          <div className="w-full h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyIncome} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" className="opacity-30" />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#9ca3af", fontSize: 12 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#9ca3af", fontSize: 12 }}
                  tickFormatter={(v) => `$${v}`}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(16,185,129,0.08)" }} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 12, paddingBottom: 12, color: "#9ca3af" }}
                />
                <Bar dataKey="gross" name="Gross" fill="#10b981" radius={[6, 6, 0, 0]} barSize={28} />
                <Bar dataKey="net" name="Net" fill="#0d9488" radius={[6, 6, 0, 0]} barSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* ── Transactions & Payouts Tabs ──────────────────────────── */}
      <Tabs defaultValue="transactions" className="w-full">
        <TabsList className="bg-slate-100 dark:bg-[#202731] border border-slate-200 dark:border-slate-700/50 mb-4">
          <TabsTrigger value="transactions">Recent Transactions</TabsTrigger>
          <TabsTrigger value="payouts">Payout History</TabsTrigger>
        </TabsList>

        {/* ── Transactions Table ────────────────────────────────── */}
        <TabsContent value="transactions">
          <Card className="dark:bg-[#202731] border-none shadow-sm shadow-[#1a2027]/50 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/50 dark:bg-slate-800/20 hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Client Name</TableHead>
                  <TableHead>Service Provided</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {earnings.transactions.map((tx) => (
                  <TableRow key={tx.transaction_number}>
                    <TableCell className="text-sm text-slate-600 dark:text-slate-400">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        {new Date(tx.created_at).toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold text-slate-800 dark:text-slate-200">{tx.transaction_number}</TableCell>
                    <TableCell>{serviceBadge(tx.item_type)}</TableCell>
                    <TableCell className="text-right font-bold text-emerald-600 dark:text-emerald-400">
                      +${tx.net_earnings.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 text-xs text-muted-foreground text-center">
              Showing {earnings.transactions.length} most recent transactions
            </div>
          </Card>
        </TabsContent>

        {/* ── Payout History Table ──────────────────────────────── */}
        <TabsContent value="payouts">
          <Card className="dark:bg-[#202731] border-none shadow-sm shadow-[#1a2027]/50 overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">Payout Cycles</CardTitle>
              </div>
              <CardDescription className="text-sm">
                Payouts are automatically processed every <span className="font-semibold text-emerald-600 dark:text-emerald-400">15 days</span>. No manual withdrawal needed.
              </CardDescription>
            </CardHeader>
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/50 dark:bg-slate-800/20 hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                  <TableHead>Period</TableHead>
                  <TableHead>Gross</TableHead>
                  <TableHead>Commission</TableHead>
                  <TableHead>Net</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Paid Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockPayouts.map((payout) => (
                  <TableRow key={payout.id}>
                    <TableCell className="text-sm font-medium">
                      {payout.periodStart} → {payout.periodEnd}
                    </TableCell>
                    <TableCell className="text-sm">${payout.grossAmount.toFixed(2)}</TableCell>
                    <TableCell className="text-sm text-amber-600 dark:text-amber-400">
                      -${payout.commission.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      ${payout.netAmount.toFixed(2)}
                    </TableCell>
                    <TableCell>{payoutStatusBadge(payout.status)}</TableCell>
                    <TableCell className="text-right text-sm text-slate-500">
                      {payout.paidAt || "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
