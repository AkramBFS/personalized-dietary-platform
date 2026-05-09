"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/Input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Eye,
  Search,
  X,
  FileText,
  Receipt,
  Download,
  Calendar,
  CreditCard,
} from "lucide-react";
import {
  getClientInvoices,
  getInvoiceDetail,
  type ClientInvoice,
} from "@/lib/client";
import { toast } from "sonner";

export default function InvoicePage() {
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<ClientInvoice[]>([]);
  const [query, setQuery] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<ClientInvoice | null>(
    null,
  );
  const [invoiceDetail, setInvoiceDetail] = useState<ClientInvoice | null>(
    null,
  );
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const loadInvoices = async () => {
      try {
        const data = await getClientInvoices();
        setInvoices(data);
      } catch (error) {
        console.error("Failed to fetch invoices", error);
        // Fallback for development/demo
        setInvoices([
          {
            id: 1,
            transaction_number: "TRX-123456789",
            total_paid: 29.99,
            item_type: "plan",
            created_at: new Date().toISOString(),
            client_username: "akram", // NEW
            nutritionist_username: "Nutritest", // NEW
          },
        ]);
      } finally {
        setLoading(false);
      }
    };
    void loadInvoices();
  }, []);

  const filteredInvoices = useMemo(() => {
    return invoices
      .filter((invoice) =>
        invoice.transaction_number.toLowerCase().includes(query.toLowerCase()),
      )
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
  }, [invoices, query]);

  const handleViewDetails = async (invoice: ClientInvoice) => {
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

  // -- Helpers --
  const serviceBadge = (service: string) => {
    switch (service) {
      case "consultation_advice":
        return <Badge className="bg-primary/10 text-primary hover:bg-primary/20 shadow-none border-0 text-xs">Advice</Badge>;
      case "consultation_custom":
        return <Badge className="bg-violet-500/10 text-violet-600 hover:bg-violet-500/20 shadow-none border-0 text-xs">Custom Plan</Badge>;
      case "plan":
        return <Badge className="bg-primary/10 text-primary hover:bg-primary/20 shadow-none border-0 text-xs">Plan Sale</Badge>;
      default:
        return <Badge className="bg-accent/50 text-primary border-primary/20 shadow-none border-0 text-xs capitalize">{service.replace("_", " ")}</Badge>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Receipt className="w-8 h-8 text-primary" />
            My Invoices
          </h1>
          <p className="text-muted-foreground mt-2">
            View and manage your transaction history and billing details.
          </p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9 bg-background/50 border-muted-foreground/20 focus:border-primary/50 transition-all rounded-xl"
            placeholder="Search transaction #"
          />
        </div>
      </div>

      {loading ? (
        <Card className="border-border shadow-sm overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Transaction #</TableHead>
                  <TableHead>Item Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 5 }).map((_, idx) => (
                  <TableRow key={idx}>
                    <TableCell>
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-8 w-20 ml-auto" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : invoices.length === 0 ? (
        <Card className="border-dashed bg-muted/30">
          <CardContent className="p-16 text-center">
            <div className="bg-background w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border">
              <FileText className="w-10 h-10 text-muted-foreground/40" />
            </div>
            <h3 className="text-xl font-semibold">No invoices found</h3>
            <p className="text-muted-foreground max-w-sm mx-auto mt-2">
              You haven't made any transactions yet. Your billing history will
              appear here once you subscribe to a plan.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border shadow-md shadow-primary/5 overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="font-bold">Transaction #</TableHead>
                  <TableHead className="font-bold">Item Type</TableHead>
                  <TableHead className="font-bold">Amount Paid</TableHead>
                  <TableHead className="font-bold">Date</TableHead>
                  <TableHead className="text-right font-bold">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice) => (
                  <TableRow
                    key={invoice.id}
                    className="hover:bg-primary/5 transition-colors group"
                  >
                    <TableCell className="font-mono text-sm text-foreground/80">
                      {invoice.transaction_number}
                    </TableCell>
                    <TableCell>
                      {serviceBadge(invoice.item_type)}
                    </TableCell>
                    <TableCell className="font-semibold text-foreground">
                      ${invoice.total_paid.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(invoice.created_at).toLocaleDateString()}
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
          </CardContent>
        </Card>
      )}

      {/* Invoice Detail Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-card rounded-3xl shadow-2xl max-w-lg w-full flex flex-col max-h-[90vh] overflow-hidden border border-border/50 animate-in zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className="relative p-6 border-b border-border bg-gradient-to-br from-primary/5 via-transparent to-transparent shrink-0">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shadow-inner">
                    <Receipt className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold tracking-tight">Invoice Details</h2>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">#{selectedInvoice?.transaction_number}</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-8 overflow-y-auto custom-scrollbar">
              {detailsLoading ? (
                <div className="space-y-6">
                  <Skeleton className="h-24 w-full rounded-2xl" />
                  <div className="grid grid-cols-2 gap-6">
                    <Skeleton className="h-20 w-full rounded-2xl" />
                    <Skeleton className="h-20 w-full rounded-2xl" />
                  </div>
                  <Skeleton className="h-32 w-full rounded-2xl" />
                </div>
              ) : invoiceDetail ? (
                <div className="space-y-8">
                  {/* Primary Amount Display */}
                  <div className="relative group overflow-hidden">
                    <div className="absolute inset-0 bg-primary/5 group-hover:bg-primary/10 transition-colors duration-500 rounded-2xl" />
                    <div className="relative p-8 text-center border border-primary/10 rounded-2xl">
                      <p className="text-xs font-bold text-primary uppercase tracking-[0.2em] mb-2">Total Amount Paid</p>
                      <h3 className="text-5xl font-black text-foreground tabular-nums">
                        ${(invoiceDetail.total_paid ?? 0).toFixed(2)}
                      </h3>
                      <div className="mt-3 flex items-center justify-center gap-2">
                        <Badge variant="outline" className="bg-background/50 border-primary/20 text-[10px] py-0 px-2 h-5">
                          SECURE PAYMENT
                        </Badge>
                        <Badge variant="outline" className="bg-background/50 border-primary/20 text-[10px] py-0 px-2 h-5 uppercase">
                          {invoiceDetail.item_type.replace("_", " ")}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Information Grid */}
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                        <Calendar className="w-3 h-3 text-primary/60" />
                        Date Issued
                      </div>
                      <p className="text-sm font-semibold text-foreground bg-muted/30 p-3 rounded-xl">
                        {new Date(invoiceDetail.created_at).toLocaleString(undefined, {
                          dateStyle: 'medium',
                          timeStyle: 'short'
                        })}
                      </p>
                    </div>
                    
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                        <FileText className="w-3 h-3 text-primary/60" />
                        Service
                      </div>
                      <div className="bg-muted/30 p-3 rounded-xl h-[46px] flex items-center">
                        {serviceBadge(invoiceDetail.item_type)}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                        <CreditCard className="w-3 h-3 text-primary/60" />
                        Reference
                      </div>
                      <p className="text-[11px] font-mono font-medium text-foreground bg-muted/30 p-3 rounded-xl break-all line-clamp-1">
                        {invoiceDetail.transaction_number}
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                        <Receipt className="w-3 h-3 text-primary/60" />
                        Nutritionist
                      </div>
                      <p className="text-sm font-bold text-foreground bg-muted/30 p-3 rounded-xl">
                        @{invoiceDetail.nutritionist_username || "System"}
                      </p>
                    </div>
                  </div>

                  {/* Financial Breakdown */}
                  <div className="pt-6 border-t border-dashed border-border">
                    <div className="bg-muted/20 rounded-2xl p-5 space-y-3">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Transaction Amount</span>
                        <span className="font-medium">${(invoiceDetail.total_paid ?? 0).toFixed(2)}</span>
                      </div>
                      <div className="pt-3 mt-1 border-t border-border flex justify-between items-center">
                        <span className="text-sm font-bold text-foreground">Total Paid</span>
                        <span className="text-lg font-black text-primary">${(invoiceDetail.total_paid ?? 0).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-4 flex flex-col gap-3">
                    <Button className="w-full h-14 rounded-2xl font-bold shadow-xl shadow-primary/20 group relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-white/10 to-primary/0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] transition-transform" />
                      <Download className="w-5 h-5 mr-2 group-hover:translate-y-0.5 transition-transform" />
                      Download PDF Receipt
                    </Button>
                    <Button 
                      variant="ghost" 
                      className="w-full h-12 rounded-xl text-muted-foreground hover:text-foreground" 
                      onClick={() => setIsModalOpen(false)}
                    >
                      Close Details
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <X className="w-8 h-8 text-destructive" />
                  </div>
                  <h3 className="text-lg font-bold">Failed to load details</h3>
                  <p className="text-muted-foreground text-sm mt-1 max-w-[240px] mx-auto">
                    We couldn't retrieve the full information for this transaction.
                  </p>
                  <Button variant="outline" className="mt-6 rounded-xl" onClick={() => setIsModalOpen(false)}>
                    Back to Invoices
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
