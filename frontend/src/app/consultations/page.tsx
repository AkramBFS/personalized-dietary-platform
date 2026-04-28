"use client";

import NutritionConsultations from "@/components/consultations";
import { HeroHeader } from "@/components/header";
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
