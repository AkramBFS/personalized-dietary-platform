"use client";
import FAQPage from "@/components/FaqPage";
import { HeroHeader } from "@/components/header";
import FooterSection from "@/components/layout/footer";
export default function PrivacyPolicyPage() {
  return (
    <main className="bg-foreground">
      <HeroHeader />
      <FAQPage />
      <FooterSection />
    </main>
  );
}
