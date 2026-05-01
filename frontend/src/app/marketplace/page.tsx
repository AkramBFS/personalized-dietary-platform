"use client";
import { HeroHeader } from "@/components/layout/navbar";
import FooterSection from "@/components/layout/footer";
import PlanMarketplace from "@/components/planmaketplace";

export default function MarketplacePage() {
  return (
    <main>
      <HeroHeader />
      <PlanMarketplace />
      <FooterSection />
    </main>
  );
}
