"use clint";
import PrivacyPolicy from "@/components/PrivacyPolicy";
import { HeroHeader } from "@/components/layout/navbar";
import FooterSection from "@/components/layout/footer";
export default function PrivacyPolicyPage() {
  return (
    <main>
      <HeroHeader />
      <PrivacyPolicy />
      <FooterSection />
    </main>
  );
}
