"use client";

import { MotionConfig } from "framer-motion";
import ContentSection from "@/components/content";
import FAQs from "@/components/faqs";
import FooterSection2 from "@/components/layout/footer2";
import SubscriptionCards from "@/components/landing-subscription";
import CallToAction from "@/components/calltoaction";
import UnifiedHeroSection from "@/components/ai/aidetection";
import { HeroHeader } from "@/components/layout/navbar";
import NewsletterSection from "@/components/newsletter";
import HeroBleedBridge from "@/components/landing/HeroBleedBridge";
import ScrollProgressIndicator from "@/components/layout/ScrollProgressIndicator";

export default function HomePage() {
  return (
    <MotionConfig reducedMotion="user">
      <div className="selection:bg-brand/30 selection:text-brand min-h-screen">
        <HeroHeader isLanding />
        <ScrollProgressIndicator />

        <UnifiedHeroSection />
        <HeroBleedBridge />

        <ContentSection />

        <SubscriptionCards />
        <FAQs />
        <CallToAction />
        <NewsletterSection />
        <FooterSection2 />
      </div>
    </MotionConfig>
  );
}
