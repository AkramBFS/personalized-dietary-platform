"use client";

import NutritionConsultations from "@/components/consultations";
import { HeroHeader } from "@/components/header";
import FooterSection from "@/components/layout/footer";

export default function ConsultationPage() {
  return (
    <main className="dark min-h-screen text-foreground selection:bg-primary/30 selection:text-primary">
      <HeroHeader />
      <NutritionConsultations />
      <FooterSection />
    </main>
  );
}
