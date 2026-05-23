import Features from "@/components/features";
import ContentSection from "@/components/content";
import FAQs from "@/components/faqs";
import FooterSection from "@/components/layout/footer";
import SubscriptionCards from "@/components/landing-subscription";
import Testimonials from "@/components/testimonials";
import CallToAction from "@/components/calltoaction";
import UnifiedHeroSection from "@/components/ai/aidetection";
import { HeroHeader } from "@/components/layout/navbar";
import NewsletterSection from "@/components/newsletter";
import { HeroTopNavbar } from "@/components/layout/navbar2";

export default function HomePage() {
  return (
    <div className="selection:bg-brand/30 selection:text-brand min-h-screen">
      <HeroTopNavbar />
      <HeroHeader />

      <UnifiedHeroSection />

      <ContentSection />

      <SubscriptionCards />
      <FAQs />
      <CallToAction />
      <NewsletterSection />
      <FooterSection />
    </div>
  );
}
