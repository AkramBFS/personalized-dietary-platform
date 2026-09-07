"use client";

import React, { useState, useEffect } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { SharedSidebar, SidebarLink } from "@/components/dashboard/shared/Sidebar";
import { DashboardHeader } from "@/components/dashboard/shared/DashboardHeader";
import { LayoutDashboard, DollarSign, AlertCircle, AlertTriangle, Info, Store, CalendarClock, ClipboardList, HeartHandshake, HelpCircle, Settings, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { getNutritionistProfile } from "@/lib/nutritionist/service";

const nutritionistLinks: SidebarLink[] = [
  {
    title: "Overview",
    url: "/nutritionist",
    icon: LayoutDashboard,
  },
  {
    title: "Schedule",
    url: "/nutritionist/schedule",
    icon: CalendarClock,
  },
  {
    title: "Patient list",
    url: "/nutritionist/patients",
    icon: HeartHandshake,
  },
  {
    title: "Consultations",
    url: "/nutritionist/consultations",
    icon: ClipboardList,
  },
  {
    title: "Meal Plans",
    url: "/nutritionist/marketplace-plans",
    icon: Store,
  },
  {
    title: "Earnings",
    url: "/nutritionist/earnings",
    icon: DollarSign,
  },
  {
    title: "Support",
    url: "/nutritionist/support",
    icon: HelpCircle,
  },
  {
    title: "Settings",
    url: "/nutritionist/settings",
    icon: Settings,
  },
];

export default function NutritionistLayout({ children }: { children: React.ReactNode }) {
  const [approvalStatus, setApprovalStatus] = useState<
    "APPROVED" | "ACCOUNT_PENDING_APPROVAL" | "ACCOUNT_REJECTED"
  >("ACCOUNT_PENDING_APPROVAL");
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const showDevOverride = process.env.NEXT_PUBLIC_ENABLE_NUTRITIONIST_APPROVAL_DEVTOOLS === "true";

  useEffect(() => {
    let isMounted = true;
    async function checkApproval() {
      try {
        const profile = await getNutritionistProfile();
        if (!isMounted) return;

        if (profile.approval_status === "approved") {
          setApprovalStatus("APPROVED");
        } else if (profile.approval_status === "rejected") {
          setApprovalStatus("ACCOUNT_REJECTED");
          setRejectionReason(profile.rejection_reason ?? null);
        } else {
          setApprovalStatus("ACCOUNT_PENDING_APPROVAL");
        }
      } catch (err) {
        console.error("Failed to fetch nutritionist profile", err);
        // Default to pending on error to prevent unauthorized data exposure
        if (isMounted) setApprovalStatus("ACCOUNT_PENDING_APPROVAL");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    checkApproval();
    return () => {
      isMounted = false;
    };
  }, []);

  const isPending = approvalStatus === "ACCOUNT_PENDING_APPROVAL";
  const isRejected = approvalStatus === "ACCOUNT_REJECTED";

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-background w-full relative">
        <SharedSidebar links={nutritionistLinks} role="nutritionist" />
        <SidebarInset className="flex w-full flex-1 flex-col bg-background">
          <DashboardHeader role="nutritionist" />
          <main className="flex-1 w-full p-4 md:p-8">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-32 px-4">
                <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
                <p className="text-sm font-medium text-muted-foreground">Verifying practitioner status...</p>
              </div>
            ) : isPending ? (
              <div className="flex flex-col items-center justify-center py-20 px-4 mt-8 bg-card border border-border rounded-xl shadow-sm text-center">
                <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mb-6">
                  <AlertCircle className="w-10 h-10 text-amber-600" />
                </div>
                <h1 className="text-3xl font-semibold mb-3 text-foreground">Account Pending Verification</h1>
                <p className="text-muted-foreground max-w-lg mb-8 text-lg">
                  Your credentials and certification are under review by our moderation team. You will be notified via email once approved.
                </p>
                <div className="p-4 bg-muted/50 border border-border rounded-lg flex items-start gap-3 max-w-md text-left">
                  <Info className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    Typically, reviews take 1-2 business days. In the meantime, you cannot access patient data or design nutritional plans.
                  </p>
                </div>
              </div>
            ) : isRejected ? (
              <div className="flex flex-col items-center justify-center py-20 px-4 mt-8 bg-card border border-destructive/20 rounded-xl shadow-sm text-center">
                <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mb-6">
                  <AlertTriangle className="w-10 h-10 text-destructive" />
                </div>
                <h1 className="text-3xl font-semibold mb-3 text-foreground">Application Not Approved</h1>
                <p className="text-muted-foreground max-w-lg mb-4 text-lg">
                  Our moderation team was unable to verify your practitioner credentials.
                </p>
                {rejectionReason ? (
                  <div className="p-4 bg-destructive/5 border border-destructive/20 rounded-lg max-w-md text-left mb-6">
                    <p className="text-xs font-semibold uppercase tracking-wider text-destructive mb-1">Reason for Rejection</p>
                    <p className="text-sm text-foreground">{rejectionReason}</p>
                  </div>
                ) : null}
                <div className="p-4 bg-muted/50 border border-border rounded-lg flex items-start gap-3 max-w-md text-left">
                  <Info className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    If you believe this was a mistake, please reach out to support with updated credentials or certification documents.
                  </p>
                </div>
              </div>
            ) : (
              children
            )}
          </main>
        </SidebarInset>
        
        {showDevOverride ? (
          <div className="fixed bottom-6 right-6 z-50 p-4 bg-card border border-border rounded-xl shadow-2xl flex flex-col gap-3 min-w-[200px]">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Dev Tools</p>
            <Button
              onClick={() => setApprovalStatus("APPROVED")}
              size="sm"
              variant={!isPending && !isRejected ? "default" : "outline"}
              className="w-full justify-start"
            >
              Simulate Approved
            </Button>
            <Button
              onClick={() => setApprovalStatus("ACCOUNT_PENDING_APPROVAL")}
              size="sm"
              variant={isPending ? "destructive" : "outline"}
              className="w-full justify-start"
            >
              Simulate Pending
            </Button>
          </div>
        ) : null}
      </div>
    </SidebarProvider>
  );
}

