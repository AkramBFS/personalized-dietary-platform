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
import { Wallet, TrendingUp, BadgePercent, ArrowUpRight, ArrowDownRight, Clock, Receipt, Eye, X, Download, Calendar, FileText, CreditCard } from "lucide-react";
import { getNutritionistEarnings, NutritionistEarningsSummary, groupTransactionsByMonth } from "@/lib/nutritionist";
import { getNutritionistInvoices, getInvoiceDetail, type NutritionistInvoice } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/skeleton";

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



const mockPayouts: Payout[] = [
  { id: 1, periodStart: "2026-03-16", periodEnd: "2026-03-31", grossAmount: 1280.00, commission: 192.00, netAmount: 1088.00, status: "completed", paidAt: "2026-04-02" },
  { id: 2, periodStart: "2026-04-01", periodEnd: "2026-04-15", grossAmount: 965.00, commission: 144.75, netAmount: 820.25, status: "processing", paidAt: null },
  { id: 3, periodStart: "2026-04-16", periodEnd: "2026-04-30", grossAmount: 0, commission: 0, netAmount: 0, status: "upcoming", paidAt: null },
];

// ── Helpers ─────────────────────────────────────────────────────────────
const serviceBadge = (service: "plan" | "consultation_advice" | "consultation_custom") => {
  switch (service) {
    case "consultation_advice":
      return <Badge className="bg-primary/10 text-primary hover:bg-primary/20 shadow-none border-0 text-xs">Advice</Badge>;
    case "consultation_custom":
      return <Badge className="bg-violet-500/10 text-violet-600 hover:bg-violet-500/20 shadow-none border-0 text-xs">Custom Plan</Badge>;
    case "plan":
      return <Badge className="bg-primary/10 text-primary hover:bg-primary/20 shadow-none border-0 text-xs">Plan Sale</Badge>;
  }
};

const payoutStatusBadge = (status: Payout["status"]) => {
  switch (status) {
    case "completed":
      return <Badge className="bg-primary/10 text-primary hover:bg-primary/20 shadow-none border-0">Completed</Badge>;
    case "processing":
      return <Badge className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 shadow-none border-0">Processing</Badge>;
    case "upcoming":
      return <Badge className="bg-secondary text-muted-foreground hover:bg-secondary/80 shadow-none border-0">Upcoming</Badge>;
  }
};

// ── Custom tooltip ──────────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; dataKey: string }>; label?: string }) => {
  if (!active || !payload) return null;
  return (
    <div className="bg-card border border-border rounded-lg p-3 shadow-xl text-card-foreground text-sm">
      <p className="font-semibold mb-1.5">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="flex justify-between gap-6">
          <span className="text-muted-foreground capitalize">{entry.dataKey}:</span>
          <span className="font-medium">${entry.value.toLocaleString()}</span>
        </p>
      ))}
    </div>
  );
};

// ── Component ───────────────────────────────────────────────────────────
export default function EarningsPage() {
  const [earnings, setEarnings] = useState<NutritionistEarningsSummary | null>(null);
  const [invoices, setInvoices] = useState<NutritionistInvoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [selectedInvoice, setSelectedInvoice] = useState<NutritionistInvoice | null>(null);
  const [invoiceDetail, setInvoiceDetail] = useState<NutritionistInvoice | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [earningsData, invoicesData] = await Promise.all([
          getNutritionistEarnings(),
          getNutritionistInvoices()
        ]);
        setEarnings(earningsData);
        setInvoices(invoicesData);
      } catch (error) {
        console.error("Failed to load earnings data", error);
        toast.error("Failed to load earnings.");
      } finally {
        setIsLoading(false);
      }
    };
    void loadData();
  }, []);

  const handleViewDetails = async (invoice: NutritionistInvoice) => {
    setSelectedInvoice(invoice);
    setIsModalOpen(true);
    setDetailsLoading(true);
    try {
      const data = await getInvoiceDetail(invoice.id);
      setInvoiceDetail(data);
    } catch (error) {
      console.error("Failed to fetch invoice details", error);
      // Fallback to summary data
      setInvoiceDetail(invoice);
    } finally {
      setDetailsLoading(false);
    }
  };

  const availableBalance = useMemo(() => {
    if (!earnings) return 0;
    return earnings.total_net;
  }, [earnings]);

  const monthlyIncome = useMemo(() => {
    if (!invoices || invoices.length === 0) return [];
    // Convert NutritionistInvoice[] to what groupTransactionsByMonth expects if needed
    // Actually groupTransactionsByMonth expects NutritionistEarningsTransaction[]
    // which has transaction_number, total_paid, net_earnings, item_type, created_at.
    // NutritionistInvoice has all of these.
    return groupTransactionsByMonth(invoices as any);
  }, [invoices]);

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
        <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
          Earnings & Payouts
        </h1>
        <p className="text-muted-foreground mt-1">
          Track your revenue streams, review transactions, and monitor payout cycles.
        </p>
      </div>

      {/* ── KPI Cards ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Available Balance */}
        <Card className="border-border shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className="bg-primary/20 p-3 rounded-xl text-primary mt-1">
                <Wallet className="w-6 h-6" />
              </div>
              <div className="space-y-1 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Available Balance</p>
                <p className="text-2xl font-bold text-foreground">${availableBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                <p className="text-sm text-primary font-medium flex items-center gap-1">
                  <ArrowUpRight className="w-3.5 h-3.5" /> Ready to withdraw
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Earned */}
        <Card className="border-border shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className="bg-secondary p-3 rounded-xl text-muted-foreground mt-1">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div className="space-y-1 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Earned (All-Time)</p>
                <p className="text-2xl font-bold text-foreground">${earnings.total_gross.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                <p className="text-sm text-muted-foreground">Gross revenue before fees</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Commission Deducted */}
        <Card className="border-border shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className="bg-amber-100 dark:bg-amber-900/30 p-3 rounded-xl text-amber-600 dark:text-amber-400 mt-1">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div className="space-y-1 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Commission Deducted</p>
                <p className="text-2xl font-bold text-foreground">${earnings.total_commission.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                <p className="text-sm text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
                  <ArrowDownRight className="w-3.5 h-3.5" /> 15% platform fee
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Income Over Time Chart ──────────────────────────────────── */}
      <Card className="border-border shadow-sm">
        <CardContent className="p-6">
          <h2 className="text-xl font-bold text-foreground mb-6 tracking-wide">
            Income Over Time
          </h2>
          <div className="w-full h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyIncome} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" className="opacity-30" />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                  tickFormatter={(v) => `$${v}`}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--primary)", fillOpacity: 0.08 }} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 12, paddingBottom: 12, color: "var(--muted-foreground)" }}
                />
                <Bar dataKey="gross" name="Gross" fill="var(--primary)" radius={[6, 6, 0, 0]} barSize={28} />
                <Bar dataKey="net" name="Net" fill="var(--primary)" fillOpacity={0.7} radius={[6, 6, 0, 0]} barSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* ── Transactions & Payouts Tabs ──────────────────────────── */}
      <Tabs defaultValue="transactions" className="w-full">
        <TabsList className="bg-muted border border-border mb-4">
          <TabsTrigger value="transactions">Recent Transactions</TabsTrigger>
          <TabsTrigger value="payouts">Payout History</TabsTrigger>
        </TabsList>

        {/* ── Transactions Table ────────────────────────────────── */}
        <TabsContent value="transactions">
          <Card className="border-border shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Reference #</TableHead>
                  <TableHead>Client Name</TableHead>
                  <TableHead>Service Provided</TableHead>
                  <TableHead className="text-right">Net Earnings</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.isArray(invoices) && invoices.map((invoice) => (
                  <TableRow key={invoice.id} className="hover:bg-primary/5 transition-colors group">
                    <TableCell className="text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        {new Date(invoice.created_at).toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{invoice.transaction_number}</TableCell>
                    <TableCell className="font-semibold text-foreground">
                      {invoice.client?.username ? `@${invoice.client.username}` : "—"}
                    </TableCell>
                    <TableCell>{serviceBadge(invoice.item_type)}</TableCell>
                    <TableCell className="text-right font-bold text-primary">
                      +${invoice.net_earnings.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetails(invoice)}
                        className="rounded-lg hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="px-6 py-3 bg-muted/30 border-t border-border text-xs text-muted-foreground text-center">
              Showing {invoices.length} most recent transactions
            </div>
          </Card>
        </TabsContent>

        {/* ── Payout History Table ──────────────────────────────── */}
        <TabsContent value="payouts">
          <Card className="border-border shadow-sm overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">Payout Cycles</CardTitle>
              </div>
              <CardDescription className="text-sm">
                Payouts are automatically processed every <span className="font-semibold text-primary">15 days</span>. No manual withdrawal needed.
              </CardDescription>
            </CardHeader>
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
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
                    <TableCell className="text-sm font-medium text-foreground">
                      {payout.periodStart} → {payout.periodEnd}
                    </TableCell>
                    <TableCell className="text-sm text-foreground">${payout.grossAmount.toFixed(2)}</TableCell>
                    <TableCell className="text-sm text-amber-600 dark:text-amber-400">
                      -${payout.commission.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-sm font-bold text-primary">
                      ${payout.netAmount.toFixed(2)}
                    </TableCell>
                    <TableCell>{payoutStatusBadge(payout.status)}</TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {payout.paidAt || "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Invoice Detail Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-card rounded-2xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden border border-border/50 animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center p-6 border-b border-border bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Receipt className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">Invoice Details</h2>
                  <p className="text-xs text-muted-foreground">Transaction Ref: {selectedInvoice?.transaction_number}</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-8">
              {detailsLoading ? (
                <div className="space-y-6">
                  <Skeleton className="h-12 w-full rounded-xl" />
                  <div className="grid grid-cols-2 gap-6">
                    <Skeleton className="h-16 w-full rounded-xl" />
                    <Skeleton className="h-16 w-full rounded-xl" />
                  </div>
                  <Skeleton className="h-24 w-full rounded-xl" />
                </div>
              ) : invoiceDetail ? (
                <div className="space-y-8">
                  {/* Earnings Header */}
                  <div className="text-center p-6 bg-primary/5 rounded-2xl border border-primary/10">
                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-1">Your Net Earnings</p>
                    <h3 className="text-4xl font-black text-primary">${invoiceDetail.net_earnings.toFixed(2)}</h3>
                    <p className="text-xs text-muted-foreground mt-2">
                      Gross: ${invoiceDetail.total_paid.toFixed(2)} • Fee: {invoiceDetail.commission_rate}%
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        <CreditCard className="w-3 h-3" />
                        Reference
                      </div>
                      <p className="text-sm font-mono font-medium text-foreground bg-muted/50 p-2 rounded-lg break-all">
                        {invoiceDetail.transaction_number}
                      </p>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        <Calendar className="w-3 h-3" />
                        Date
                      </div>
                      <p className="text-sm font-medium text-foreground bg-muted/50 p-2 rounded-lg h-full flex items-center">
                        {new Date(invoiceDetail.created_at).toLocaleString(undefined, {
                          dateStyle: 'medium',
                          timeStyle: 'short'
                        })}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Service Type</div>
                      <div className="mt-1">
                        {serviceBadge(invoiceDetail.item_type)}
                      </div>
                    </div>

                    <div className="space-y-1 text-right">
                      <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Client</div>
                      <p className="text-sm font-semibold text-foreground">@{invoiceDetail.client.username}</p>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-dashed border-border flex flex-col gap-3">
                    <Button className="w-full py-6 rounded-xl font-bold shadow-lg shadow-primary/20 group">
                      <Download className="w-4 h-4 mr-2 group-hover:translate-y-0.5 transition-transform" />
                      Download Statement
                    </Button>
                    <Button variant="outline" className="w-full py-6 rounded-xl text-muted-foreground" onClick={() => setIsModalOpen(false)}>
                      Close
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10">
                  <p className="text-destructive font-medium">Failed to load detailed invoice information.</p>
                  <Button variant="ghost" className="mt-4" onClick={() => setIsModalOpen(false)}>Back to list</Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
