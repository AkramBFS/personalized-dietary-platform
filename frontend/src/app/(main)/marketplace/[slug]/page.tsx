
"use client";
import React from "react";
import { HeroHeader } from "@/components/layout/navbar";
import FooterSection from "@/components/layout/footer";
import SingleMarketPlacePlanComponent from "@/components/SingleMarketPlacePlanComponent";

// Use React.use() to unwrap params in Client Components in Next.js 15+
export default function MarketplacePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = React.use(params);

  return (
    <main>
      <HeroHeader />
      {/* Pass the slug down so the component knows which plan to show */}
      <SingleMarketPlacePlanComponent slug={slug} />
      <FooterSection />
    </main>
  );
}