"use client";

import { useRef } from "react";
import { MotionConfig } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
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
import HeroGlTransition from "@/components/landing/HeroGlTransition";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/** Scroll distance (px) per unit of timeline duration inside the pinned stack stage. */
const STEP_SCROLL_PX = 1000;

/** Complementary transition tokens extracted from CallToAction */
const STACK_TRANSITION_FX = {
  blurPx: "12px",
  recedeShiftPercent: 50,
  dimOpacity: 0.45,
  leadingRadius: "48px",
  ease: "power1.inOut",
} as const;

export default function HomePage() {
  const stackStageRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const stage = stackStageRef.current;
      if (!stage) return;

      const servicesEl = stage.querySelector<HTMLElement>("#services");
      const pricingEl = stage.querySelector<HTMLElement>("#pricing");
      const faqEl = stage.querySelector<HTMLElement>("#faq-section");
      const ctaEl = stage.querySelector<HTMLElement>("#cta");
      const newsletterEl = stage.querySelector<HTMLElement>("#newsletter");

      const servicesPanel1 = stage.querySelector<HTMLElement>('[data-services-panel="1"]');
      const servicesPanel2 = stage.querySelector<HTMLElement>('[data-services-panel="2"]');
      const servicesPanel3 = stage.querySelector<HTMLElement>('[data-services-panel="3"]');
      const servicesDimEl = stage.querySelector<HTMLElement>("[data-services-dim]");
      const faqDimEl = stage.querySelector<HTMLElement>("#faq-dim-overlay");

      if (!servicesEl || !pricingEl || !faqEl || !ctaEl || !newsletterEl) return;

      const sectionEls = [servicesEl, pricingEl, faqEl, ctaEl, newsletterEl];
      const clearStackScrollAttrs = () => {
        sectionEls.forEach((el) => el.removeAttribute("data-stack-scroll-y"));
      };

      const mm = gsap.matchMedia();

      mm.add(
        "(min-width: 768px) and (prefers-reduced-motion: no-preference)",
        () => {
          // Initial states for Services internal panels & base section
          gsap.set(servicesEl, {
            xPercent: 0,
            yPercent: 0,
            filter: "blur(0px)",
          });
          if (servicesPanel2) {
            gsap.set(servicesPanel2, { xPercent: 100, filter: "blur(0px)", opacity: 1 });
          }
          if (servicesPanel3) {
            gsap.set(servicesPanel3, { xPercent: 100 });
          }
          if (servicesDimEl) {
            gsap.set(servicesDimEl, { opacity: 0 });
          }
          if (faqDimEl) {
            gsap.set(faqDimEl, { opacity: 0 });
          }

          // Initial states for incoming stack sections (off-screen + blurred + rounded leading edge)
          gsap.set(pricingEl, {
            yPercent: 100,
            xPercent: 0,
            filter: `blur(${STACK_TRANSITION_FX.blurPx})`,
            borderTopLeftRadius: STACK_TRANSITION_FX.leadingRadius,
            borderTopRightRadius: STACK_TRANSITION_FX.leadingRadius,
          });
          gsap.set(faqEl, {
            xPercent: -100,
            yPercent: 0,
            filter: `blur(${STACK_TRANSITION_FX.blurPx})`,
            borderTopRightRadius: STACK_TRANSITION_FX.leadingRadius,
            borderBottomRightRadius: STACK_TRANSITION_FX.leadingRadius,
          });
          gsap.set(ctaEl, {
            xPercent: 100,
            yPercent: 0,
            filter: `blur(${STACK_TRANSITION_FX.blurPx})`,
            borderTopLeftRadius: STACK_TRANSITION_FX.leadingRadius,
            borderBottomLeftRadius: STACK_TRANSITION_FX.leadingRadius,
          });
          gsap.set(newsletterEl, {
            yPercent: 100,
            xPercent: 0,
            filter: `blur(${STACK_TRANSITION_FX.blurPx})`,
            borderTopLeftRadius: STACK_TRANSITION_FX.leadingRadius,
            borderTopRightRadius: STACK_TRANSITION_FX.leadingRadius,
          });

          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: stage,
              start: "top top",
              end: () => `+=${Math.round(tl.duration() * STEP_SCROLL_PX)}`,
              scrub: 1,
              pin: true,
              anticipatePin: 1,
              invalidateOnRefresh: true,
            },
          });

          // 1. ContentSection (#services) internal sequence finishes first
          tl.addLabel("services", 0);

          if (servicesPanel1 && servicesPanel2) {
            tl.to(
              servicesPanel1,
              { xPercent: -50, opacity: 0, ease: "power1.inOut", duration: 1 },
              0,
            );
            tl.to(
              servicesPanel2,
              { xPercent: 0, ease: "power1.inOut", duration: 1 },
              0,
            );
          }

          tl.to({}, { duration: 0.3 });

          if (servicesPanel2 && servicesPanel3) {
            tl.to(
              servicesPanel2,
              { filter: "blur(16px)", opacity: 0.4, ease: "none", duration: 1 },
              "+=0",
            );
            tl.to(
              servicesPanel3,
              { xPercent: 0, ease: "none", duration: 1 },
              "<",
            );
          }

          // 2. SubscriptionCards (#pricing) enters from BOTTOM over ContentSection (#services)
          if (servicesDimEl) {
            tl.to(
              servicesDimEl,
              { opacity: STACK_TRANSITION_FX.dimOpacity, ease: "none", duration: 1 },
              "+=0",
            );
          }
          tl.to(
            servicesEl,
            {
              yPercent: -STACK_TRANSITION_FX.recedeShiftPercent,
              filter: `blur(${STACK_TRANSITION_FX.blurPx})`,
              ease: STACK_TRANSITION_FX.ease,
              duration: 1,
            },
            servicesDimEl ? "<" : "+=0",
          );
          tl.to(
            pricingEl,
            {
              yPercent: 0,
              filter: "blur(0px)",
              borderTopLeftRadius: "0px",
              borderTopRightRadius: "0px",
              ease: STACK_TRANSITION_FX.ease,
              duration: 1,
            },
            "<",
          );
          tl.addLabel("pricing");

          // 3. FAQs (#faq-section) enters from LEFT over SubscriptionCards (#pricing)
          tl.to(
            pricingEl,
            {
              xPercent: STACK_TRANSITION_FX.recedeShiftPercent,
              filter: `blur(${STACK_TRANSITION_FX.blurPx})`,
              ease: STACK_TRANSITION_FX.ease,
              duration: 1,
            },
            "+=0",
          );
          tl.to(
            faqEl,
            {
              xPercent: 0,
              filter: "blur(0px)",
              borderTopRightRadius: "0px",
              borderBottomRightRadius: "0px",
              ease: STACK_TRANSITION_FX.ease,
              duration: 1,
            },
            "<",
          );
          tl.addLabel("faq-section");

          // 4. CallToAction (#cta) enters from RIGHT over FAQs (#faq-section)
          if (faqDimEl) {
            tl.to(
              faqDimEl,
              { opacity: STACK_TRANSITION_FX.dimOpacity, ease: "none", duration: 1 },
              "+=0",
            );
          }
          tl.to(
            faqEl,
            {
              xPercent: -STACK_TRANSITION_FX.recedeShiftPercent,
              filter: `blur(${STACK_TRANSITION_FX.blurPx})`,
              ease: STACK_TRANSITION_FX.ease,
              duration: 1,
            },
            faqDimEl ? "<" : "+=0",
          );
          tl.to(
            ctaEl,
            {
              xPercent: 0,
              filter: "blur(0px)",
              borderTopLeftRadius: "0px",
              borderBottomLeftRadius: "0px",
              ease: STACK_TRANSITION_FX.ease,
              duration: 1,
            },
            "<",
          );
          tl.addLabel("cta");

          // 5. NewsletterSection (#newsletter) enters from BOTTOM over CallToAction (#cta)
          tl.to(
            ctaEl,
            {
              yPercent: -STACK_TRANSITION_FX.recedeShiftPercent,
              filter: `blur(${STACK_TRANSITION_FX.blurPx})`,
              ease: STACK_TRANSITION_FX.ease,
              duration: 1,
            },
            "+=0",
          );
          tl.to(
            newsletterEl,
            {
              yPercent: 0,
              filter: "blur(0px)",
              borderTopLeftRadius: "0px",
              borderTopRightRadius: "0px",
              ease: STACK_TRANSITION_FX.ease,
              duration: 1,
            },
            "<",
          );
          tl.addLabel("newsletter");

          const syncChapterOffsets = () => {
            const st = tl.scrollTrigger;
            if (!st) return;
            const totalScroll = st.end - st.start;
            const totalDur = tl.duration() || 1;

            const mapLabelToScroll = (label: string) => {
              const t = tl.labels[label] ?? 0;
              return Math.round(st.start + (t / totalDur) * totalScroll);
            };

            servicesEl.setAttribute("data-stack-scroll-y", String(mapLabelToScroll("services")));
            pricingEl.setAttribute("data-stack-scroll-y", String(mapLabelToScroll("pricing")));
            faqEl.setAttribute("data-stack-scroll-y", String(mapLabelToScroll("faq-section")));
            ctaEl.setAttribute("data-stack-scroll-y", String(mapLabelToScroll("cta")));
            newsletterEl.setAttribute("data-stack-scroll-y", String(mapLabelToScroll("newsletter")));
          };

          syncChapterOffsets();
          ScrollTrigger.addEventListener("refresh", syncChapterOffsets);

          const scrollToHash = () => {
            const hash = window.location.hash.replace(/^#/, "");
            if (!hash) return;
            const target = stage.querySelector<HTMLElement>(`#${CSS.escape(hash)}`);
            const y = target?.getAttribute("data-stack-scroll-y");
            if (y) {
              window.scrollTo({ top: Number(y), behavior: "smooth" });
            }
          };
          window.addEventListener("hashchange", scrollToHash);

          return () => {
            ScrollTrigger.removeEventListener("refresh", syncChapterOffsets);
            window.removeEventListener("hashchange", scrollToHash);
            clearStackScrollAttrs();
          };
        },
      );

      // Reduced-motion & mobile (<768px): clean vertical flow without horizontal transforms or pinning
      mm.add("(max-width: 767px), (prefers-reduced-motion: reduce)", () => {
        clearStackScrollAttrs();
        gsap.set(
          [
            servicesEl,
            servicesPanel1,
            servicesPanel2,
            servicesPanel3,
            servicesDimEl,
            faqDimEl,
            pricingEl,
            faqEl,
            ctaEl,
            newsletterEl,
          ].filter(Boolean),
          {
            clearProps:
              "transform,opacity,filter,borderTopLeftRadius,borderTopRightRadius,borderBottomLeftRadius,borderBottomRightRadius",
          },
        );
      });
    },
    { scope: stackStageRef },
  );

  return (
    <MotionConfig reducedMotion="user">
      <div className="selection:bg-brand/30 selection:text-brand min-h-screen overflow-x-clip">
        <HeroHeader isLanding />
        <ScrollProgressIndicator />
        <HeroGlTransition />

        <UnifiedHeroSection />
        <HeroBleedBridge />

        <div
          ref={stackStageRef}
          data-landing-stack=""
          className="relative z-20 w-full md:h-screen md:overflow-hidden"
        >
          <ContentSection />
          <SubscriptionCards />
          <FAQs />
          <CallToAction />
          <NewsletterSection />
        </div>

        <FooterSection2 />
      </div>
    </MotionConfig>
  );
}
