import HeroSection from "@/components/hero-section";
import Features from "@/components/features";
import ContentSection from "@/components/content";
import FAQs from "@/components/faqs";
import Stats from "@/components/stats";
import FooterSection from "@/components/layout/footer";
import FadeIn from "@/components/FadeIn";

export default function HomePage() {
  return (
    <main>
      <HeroSection /> {/* Hero should not wait for scroll */}
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
        <Stats />
      </FadeIn>
      <FooterSection />
    </main>
  );
}
