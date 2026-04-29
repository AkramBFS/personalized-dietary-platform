"use client";
import AboutComponent from "@/components/About";
import { HeroHeader } from "@/components/header";
import FooterSection from "@/components/layout/footer";
export default function AboutPage() {
  return (
    <main className="bg-gradient-to-br from-[#052025] via-[#01181D] to-[#052025]">
      <HeroHeader />
      <AboutComponent />
      <FooterSection />
    </main>
  );
}
