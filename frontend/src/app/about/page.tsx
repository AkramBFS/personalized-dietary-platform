"use client";
import AboutComponent from "@/components/About";
import { HeroHeader } from "@/components/layout/navbar";
import FooterSection from "@/components/layout/footer";
export default function AboutPage() {
  return (
    <main>
      <HeroHeader />
      <AboutComponent />
      <FooterSection />
    </main>
  );
}
