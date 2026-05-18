import HeroSection from "@/components/hero-section";
import Features from "@/components/features";
import ContentSection from "@/components/content";
import FAQs from "@/components/faqs";
import FooterSection from "@/components/layout/footer";
import FadeIn from "@/components/animations/FadeIn";
import Testimonials from "@/components/testimonials";
import CallToAction from "@/components/calltoaction";
import { AIDetection } from "@/components/ai/aidetection";
import { HeroHeader } from "@/components/layout/navbar";

export default function HomePage() {
  return (
    <div className="selection:bg-brand/30 selection:text-brand min-h-screen">
      <HeroHeader />
      <HeroSection />
      <AIDetection />

      <Features />

      <ContentSection />

      <FAQs />

      <Testimonials />

      <CallToAction />

      <FooterSection />
    </div>
  );
}
