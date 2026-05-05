"use client";

import React, { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { X } from "lucide-react";
import { getAdminInquiries, respondToInquiry, type InquiryTicket } from "@/lib/admin";
import { toast } from "sonner";

export default function AdminInquiriesPage() {
  const [tickets, setTickets] = useState<InquiryTicket[]>([]);
  const [selected, setSelected] = useState<InquiryTicket | null>(null);
  const [adminResponse, setAdminResponse] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getAdminInquiries();
        setTickets(data);
      } catch (error) {
        toast.error("Failed to fetch inquiries");
      }
    };
    void load();
  }, []);

  const markResolved = async (id: number) => {
    try {
      await respondToInquiry(id, adminResponse);
      setTickets((prev) =>
        prev.map((ticket) =>
          ticket.id === id
            ? {
                ...ticket,
                status: "resolved",
                admin_response: adminResponse || ticket.admin_response,
              }
            : ticket,
        ),
      );
      toast.success("Inquiry marked as resolved");
      setSelected(null);
      setAdminResponse("");
      setIsModalOpen(false);
    } catch (error) {
      toast.error("Failed to resolve inquiry");
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Inquiries</h1>
        <p className="text-muted-foreground mt-1">
          Track support tickets and resolve open requests.
        </p>
      </div>

      <div className="grid gap-4">
        {tickets.map((ticket) => (
          <Card key={ticket.id}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">{ticket.subject}</CardTitle>
              <Badge
                variant="outline"
                className={
                  ticket.status === "open"
                    ? "text-amber-600 border-amber-300"
                    : "text-primary border-primary/30"
                }
              >
                {ticket.status}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground line-clamp-2">
                {ticket.message}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelected(ticket);
                  setIsModalOpen(true);
                }}
              >
                View Ticket
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {isModalOpen && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          {/* Modal Container */}
          <div className="bg-card border border-border rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            {/* 1. Modal Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b">
              <div>
                <h2 className="text-xl font-semibold tracking-tight">
                  Inquiry Details
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Review and resolve this ticket.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 2. Modal Body (Scrollable) */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* User's Original Message Area */}
              <div className="rounded-lg bg-muted/50 border p-5 space-y-3">
                <h3 className="font-medium text-lg leading-none">
                  {selected.subject}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {selected.message}
                </p>
              </div>

              {/* Admin Response Workspace */}
              <div className="space-y-3">
                <label htmlFor="response" className="text-sm font-semibold">
                  Admin Response
                </label>
                <textarea
                  id="response"
                  className="flex min-h-[140px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-y"
                  value={adminResponse}
                  onChange={(e) => setAdminResponse(e.target.value)}
                  placeholder="Type your response here..."
                />
              </div>
            </div>

            {/* 3. Modal Footer */}
            <div className="px-6 py-4 border-t bg-muted/20 flex items-center justify-end gap-3">
              <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => markResolved(selected.id)}>
                Mark as Resolved
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
