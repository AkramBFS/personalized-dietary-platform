"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import ScheduleConsultation from "@/components/scheduleconsultation";
import { HeroHeader } from "@/components/layout/navbar";
import FooterSection from "@/components/layout/footer";

function ScheduleContent() {
  const searchParams = useSearchParams();
  const nutritionistId = searchParams.get("id");

  if (!nutritionistId) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <p className="text-muted-foreground">
          Please select a nutritionist from the directory first.
        </p>
      </div>
    );
  }

  return <ScheduleConsultation nutritionistId={nutritionistId} />;
}

export default function ConsultationPage() {
  return (
    <main className="dark min-h-screen text-foreground selection:bg-primary/30 selection:text-primary">
      <HeroHeader />
      {/* Suspense is required when using useSearchParams in Next.js */}
      <Suspense fallback={<div className="h-screen animate-pulse bg-muted" />}>
        <ScheduleContent />
      </Suspense>
      <FooterSection />
    </main>
  );
}
