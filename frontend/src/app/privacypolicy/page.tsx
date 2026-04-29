"use clint";
import PrivacyPolicy from "@/components/PrivacyPolicy";
import { HeroHeader } from "@/components/layout/navbar";
import FooterSection from "@/components/layout/footer";
export default function PrivacyPolicyPage() {
  return (
    <main className="bg-gradient-to-br from-[#052023] via-[#01181D] to-[#052025]">
      <HeroHeader />
      <PrivacyPolicy />
      <FooterSection />
    </main>
  );
}
