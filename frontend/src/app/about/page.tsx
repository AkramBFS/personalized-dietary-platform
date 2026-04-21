"use client";
import AboutPage from "@/components/About";
import { HeroHeader } from "@/components/header";
import FooterSection from "@/components/layout/footer";
export default function PrivacyPolicyPage() {
  return (
    <main className="bg-foreground">
      <HeroHeader />
      <AboutPage />
      <FooterSection />
    </main>
  );
}
