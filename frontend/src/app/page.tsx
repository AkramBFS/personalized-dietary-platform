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
    <main className="selection:bg-[#3DDC97]/30 selection:text-[#3DDC97]">
      <HeroHeader />
      <HeroSection />
      <AIDetection />
      <FadeIn>
        <Features />
      </FadeIn>
      <FadeIn delay={0.1}>
        <ContentSection />
      </FadeIn>
      <FadeIn delay={0.2}>
        <FAQs />
      </FadeIn>
      <FadeIn delay={0.3}>
        <Testimonials />
      </FadeIn>
      <FadeIn delay={0.3}>
        <CallToAction />
      </FadeIn>
      <FooterSection />
    </main>
  );
}
