import HeroSection from "@/components/hero-section";
import Features from "@/components/features";
import ContentSection from "@/components/content";
import FAQs from "@/components/faqs";
import Stats from "@/components/stats";
import FooterSection from "@/components/layout/footer";

export default function HomePage() {
  return (
    <div>
      <HeroSection />
      <Features />
      <ContentSection />
      <FAQs />
      <Stats />
      <FooterSection />
    </div>
  );
}
