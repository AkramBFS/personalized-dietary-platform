"use client";

import Link from "next/link";
import React, { useRef } from "react";
import { Button } from "@/components/ui/Button";
import { UserPlus, BadgeCheck, ArrowRight } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function CallToAction() {
  const containerRef = useRef<HTMLDivElement>(null);
  const panel1Ref = useRef<HTMLDivElement>(null);
  const panel2Ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      // 1. PIN THE PREVIOUS SECTION TO CREATE A SLIDE-OVER OVERLAY EFFECT
      const faqSection =
        document.getElementById("faq-section") ||
        containerRef.current?.previousElementSibling;

      if (faqSection) {
        ScrollTrigger.create({
          trigger: faqSection,
          start: "bottom bottom", // Activates when the bottom of FAQ hits the bottom of the screen
          endTrigger: containerRef.current,
          end: "top top", // Pin stops exactly when the CTA has completely covered it
          pin: true,
          pinSpacing: false, // Prevents GSAP from adding extra space, forcing CTA to slide over it
        });
      }

      // 2. ORIGINAL PANEL ANIMATIONS
      // Initialize Panel 2 to be positioned directly below Panel 1
      gsap.set(panel2Ref.current, { yPercent: 100 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: "+=1000", // Matches the ~100vh scroll duration request
          scrub: 1,
          pin: true,
          anticipatePin: 1,
        },
      });

      // Slide Panel 1 slightly up and fade it out
      tl.to(
        panel1Ref.current,
        { yPercent: -50, opacity: 0, ease: "power1.inOut", duration: 1 },
        0,
      );

      // Slide Panel 2 up into view from the bottom
      tl.to(
        panel2Ref.current,
        { yPercent: 0, ease: "power1.inOut", duration: 1 },
        0,
      );
    },
    { scope: containerRef },
  );

  return (
    <section
      ref={containerRef}
      className="relative z-20 h-screen w-full bg-background overflow-hidden text-foreground font-syne"
    >
      {/* =========================================
          SCREEN 1: CLIENT GET STARTED
      ========================================= */}
      <div
        ref={panel1Ref}
        className="absolute inset-0 w-full h-full flex flex-col md:flex-row items-center justify-center p-8 md:p-16 gap-8 md:gap-16"
      >
        {/* Left Col: Headers & CTA */}
        <div className="flex-1 max-w-xl space-y-6">
          <div className="bg-accent text-accent-foreground border border-border w-fit px-4 py-2 rounded-full font-semibold flex items-center gap-2 mb-4 text-sm">
            <UserPlus className="w-4 h-4" /> For Clients
          </div>
          <h2 className="text-5xl md:text-7xl font-bold leading-tight">
            Begin Your <br />
            <span className="text-primary">Health Journey</span>
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed max-w-md">
            Join SVMB today and transform your lifestyle with personalized AI
            tracking, expert meal plans, and a supportive community.
          </p>

          <Button className="bg-button-primary hover:opacity-90 text-button-primary-foreground font-semibold rounded-full px-8 py-6 flex items-center gap-2 group mt-4">
            <Link href="/register" className="flex items-center gap-2">
              Get Started
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>

        {/* Right Col: Image */}
        <div className="flex-1 flex w-full justify-center items-center">
          <div className="relative w-full max-w-lg aspect-square md:aspect-[4/3] bg-muted rounded-3xl overflow-hidden group shadow-brand">
            <img
              src="https://plus.unsplash.com/premium_photo-1733342485605-42058eb2daf3?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
              alt="Healthy lifestyle tracking"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-secondary/40 to-transparent" />
          </div>
        </div>
      </div>

      {/* =========================================
          SCREEN 2: NUTRITIONIST ONBOARDING
      ========================================= */}
      <div
        ref={panel2Ref}
        className="absolute inset-0 w-full h-full flex flex-col md:flex-row-reverse items-center justify-center p-8 md:p-16 gap-8 md:gap-16 bg-card"
      >
        {/* Right Col (Visual Left due to row-reverse): Headers & CTA */}
        <div className="flex-1 max-w-xl space-y-6">
          <div className="bg-primary/10 text-primary border border-primary/20 w-fit px-4 py-2 rounded-full font-semibold flex items-center gap-2 mb-4 text-sm">
            <BadgeCheck className="w-4 h-4" /> For Professionals
          </div>
          <h2 className="text-5xl md:text-7xl font-bold leading-tight">
            Are you a certified <br />
            <span className="text-primary">Nutritionist?</span>
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed max-w-md">
            Get onboard and join the SVMB family! Expand your reach, offer
            online consultations, and sell your custom meal plans directly on
            our active marketplace.
          </p>

          <Button className="bg-button-accent hover:opacity-90 text-button-accent-foreground font-semibold rounded-full px-8 py-6 flex items-center gap-2 group mt-4 border border-primary/30">
            <Link
              href="/register/nutritionist"
              className="flex items-center gap-2"
            >
              Get Onboard
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>

        {/* Left Col (Visual Right): Image */}
        <div className="flex-1 flex w-full justify-center items-center">
          <div className="relative w-full max-w-lg aspect-square md:aspect-[4/3] bg-muted rounded-[2.5rem] overflow-hidden group border border-border">
            <img
              src="https://plus.unsplash.com/premium_photo-1661766718556-13c2efac1388?auto=format&fit=crop&q=80&w=1000"
              alt="Certified Nutritionist Onboarding"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-bl from-transparent to-background/50" />
          </div>
        </div>
      </div>
    </section>
  );
}
