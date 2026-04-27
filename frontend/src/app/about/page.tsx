"use client";
import AboutPage from "@/components/About";
import { HeroHeader } from "@/components/header";
import FooterSection from "@/components/layout/footer";
export default function PrivacyPolicyPage() {
  return (
    <main className="bg-gradient-to-br from-[#052025] via-[#01181D] to-[#052025]">
      <HeroHeader />
      <AboutPage />
      <FooterSection />
    </main>
  );
}
