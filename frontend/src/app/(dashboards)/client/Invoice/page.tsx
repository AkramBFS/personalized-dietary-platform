"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
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
import { Eye, Search, X, FileText, Receipt, Download, Calendar, CreditCard } from "lucide-react";
import { getClientInvoices, getInvoiceDetail, type ClientInvoice } from "@/lib/client";
import { toast } from "sonner";

export default function InvoicePage() {
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState<ClientInvoice[]>([]);
  const [query, setQuery] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<ClientInvoice | null>(null);
  const [invoiceDetail, setInvoiceDetail] = useState<ClientInvoice | null>(null);
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
            client: { username: "akram" }
          },
          {
            id: 2,
            transaction_number: "TRX-987654321",
            total_paid: 199.99,
            item_type: "premium_annual",
            created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
            client: { username: "akram" }
          }
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
        invoice.transaction_number.toLowerCase().includes(query.toLowerCase())
      )
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
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
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
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
              You haven't made any transactions yet. Your billing history will appear here once you subscribe to a plan.
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
                  <TableRow key={invoice.id} className="hover:bg-primary/5 transition-colors group">
                    <TableCell className="font-mono text-sm text-foreground/80">
                      {invoice.transaction_number}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize bg-accent/50 text-primary border-primary/20">
                        {invoice.item_type.replace("_", " ")}
                      </Badge>
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

      {/* Detail Modal */}
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
                  <p className="text-xs text-muted-foreground">Transaction ID: {selectedInvoice?.id}</p>
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
                  {/* Total Paid Header */}
                  <div className="text-center p-6 bg-primary/5 rounded-2xl border border-primary/10">
                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest mb-1">Total Amount Paid</p>
                    <h3 className="text-4xl font-black text-primary">${invoiceDetail.total_paid.toFixed(2)}</h3>
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
                      <Badge className="capitalize py-1 px-3 text-sm" variant="secondary">
                        {invoiceDetail.item_type.replace("_", " ")}
                      </Badge>
                    </div>

                    <div className="space-y-1 text-right">
                      <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Client</div>
                      <p className="text-sm font-semibold text-foreground">@{invoiceDetail.client.username}</p>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-dashed border-border flex flex-col gap-3">
                    <Button className="w-full py-6 rounded-xl font-bold shadow-lg shadow-primary/20 group">
                      <Download className="w-4 h-4 mr-2 group-hover:translate-y-0.5 transition-transform" />
                      Download PDF Receipt
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
