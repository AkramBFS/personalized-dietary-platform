import Features from "@/components/features";
import ContentSection from "@/components/content";
import FAQs from "@/components/faqs";
import FooterSection2 from "@/components/layout/footer2";
import SubscriptionCards from "@/components/landing-subscription";
import Testimonials from "@/components/testimonials";
import CallToAction from "@/components/calltoaction";
import UnifiedHeroSection from "@/components/ai/aidetection";
import { HeroHeader } from "@/components/layout/navbar";
import NewsletterSection from "@/components/newsletter";
export default function HomePage() {
  return (
    <div className="selection:bg-brand/30 selection:text-brand min-h-screen">
      <HeroHeader isLanding />

      <UnifiedHeroSection />

      <ContentSection />

      <SubscriptionCards />
      <FAQs />
      <CallToAction />
      <NewsletterSection />
      <FooterSection2 />
    </div>
  );
}
