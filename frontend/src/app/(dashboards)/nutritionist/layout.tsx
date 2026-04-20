"use client";

import React, { useState } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { SharedSidebar, SidebarLink } from "@/components/dashboard/shared/Sidebar";
import { DashboardHeader } from "@/components/dashboard/shared/DashboardHeader";
import { LayoutDashboard, DollarSign, AlertCircle, Info, Store, CalendarClock, ClipboardList, HeartHandshake, HelpCircle, Settings } from "lucide-react";
import { Button } from "@/components/ui/Button";

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
  const [approvalStatus, setApprovalStatus] = useState<"APPROVED" | "ACCOUNT_PENDING_APPROVAL">("APPROVED");
  const showDevOverride = process.env.NEXT_PUBLIC_ENABLE_NUTRITIONIST_APPROVAL_DEVTOOLS === "true";

  const isPending = approvalStatus === "ACCOUNT_PENDING_APPROVAL";

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-background dark:bg-[#12161b] w-full relative">
        <SharedSidebar links={nutritionistLinks} role="nutritionist" />
        <SidebarInset className="flex w-full flex-1 flex-col bg-slate-50 dark:bg-[#171c23]">
          <DashboardHeader role="nutritionist" />
          <main className="flex-1 w-full p-4 md:p-8">
            {isPending ? (
              <div className="flex flex-col items-center justify-center py-20 px-4 mt-8 bg-white dark:bg-[#12161b] border border-orange-200 dark:border-orange-900/40 rounded-xl shadow-sm text-center">
                <div className="w-20 h-20 bg-orange-100 dark:bg-orange-500/10 rounded-full flex items-center justify-center mb-6">
                  <AlertCircle className="w-10 h-10 text-orange-600 dark:text-orange-500" />
                </div>
                <h1 className="text-3xl font-semibold mb-3 text-slate-800 dark:text-slate-100">Account Pending Verification</h1>
                <p className="text-slate-500 dark:text-slate-400 max-w-lg mb-8 text-lg">
                  Your credentials and certification are under review by our moderation team. You will be notified via email once approved.
                </p>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-lg flex items-start gap-3 max-w-md text-left">
                  <Info className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Typically, reviews take 1-2 business days. In the meantime, you cannot access patient data or design nutritional plans.
                  </p>
                </div>
              </div>
            ) : (
              children
            )}
          </main>
        </SidebarInset>
        
        {showDevOverride ? (
          <div className="fixed bottom-6 right-6 z-50 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl flex flex-col gap-3 min-w-[200px]">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Dev Tools</p>
            <Button
              onClick={() => setApprovalStatus("APPROVED")}
              size="sm"
              variant={!isPending ? "default" : "outline"}
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
