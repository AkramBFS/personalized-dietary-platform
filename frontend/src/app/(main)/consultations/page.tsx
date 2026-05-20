"use client";

import NutritionConsultations from "@/components/consultations";
import { HeroHeader } from "@/components/layout/navbar";
import FooterSection from "@/components/layout/footer";

export default function ConsultationPage() {
  return (
    <main>
      <HeroHeader />
      <NutritionConsultations />
      <FooterSection />
    </main>
  );
}
