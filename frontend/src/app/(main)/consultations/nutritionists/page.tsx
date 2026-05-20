"use client";

import ChooseNutritionist from "@/components/choosenutritionist";
import { HeroHeader } from "@/components/layout/navbar";
import FooterSection from "@/components/layout/footer";

export default function ConsultationPage() {
  return (
    <main className="min-h-screen selection:bg-primary/30 selection:text-primary">
      <HeroHeader />
      <ChooseNutritionist />
      <FooterSection />
    </main>
  );
}
