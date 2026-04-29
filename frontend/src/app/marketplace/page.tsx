"use client";
import { HeroHeader } from "@/components/header";
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
