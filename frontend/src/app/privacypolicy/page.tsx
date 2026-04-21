"use clint";
import PrivacyPolicy from "@/components/PrivacyPolicy";
import { HeroHeader } from "@/components/header";
import FooterSection from "@/components/layout/footer";
export default function PrivacyPolicyPage() {
  return (
    <main className="bg-foreground">
      <HeroHeader />
      <PrivacyPolicy />
      <FooterSection />
    </main>
  );
}
