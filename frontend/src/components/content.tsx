"use client";

import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import {
  Brain,
  Video,
  ClipboardList,
  Users,
  Activity,
  BadgeCheck,
  ArrowUpRight,
} from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const servicesData = [
  {
    id: "ai-tracker",
    title: "AI Tracker",
    icon: Brain,
    description:
      "Instantly log your meals with our advanced computer vision tool. Snap a photo to estimate portion masses, calculate macros, and track daily progress effortlessly.",
  },
  {
    id: "online-consultations",
    title: "Online Consultations",
    icon: Video,
    description:
      "Book personalized video sessions with certified professionals. Get tailored advice, discuss your health goals, and receive customized dietary guidance.",
  },
  {
    id: "personalized-plans",
    title: "Personalized Meal Plans",
    icon: ClipboardList,
    description:
      "Browse predefined plans or request a custom schedule tailored to your exact needs. Easily track your daily meals and nutritional goals.",
  },
  {
    id: "community-feed",
    title: "Community Feed",
    icon: Users,
    description:
      "Join an active ecosystem of health enthusiasts. Share your journey, read curated posts, and stay motivated with our moderated community platform.",
  },
  {
    id: "daily-tracking",
    title: "Daily Progress Tracking",
    icon: Activity,
    description:
      "Monitor your adherence to health goals with detailed day-by-day logs of calories, fats, carbohydrates, and protein intake.",
  },
  {
    id: "expert-coaches",
    title: "Verified Expert Coaches",
    icon: BadgeCheck,
    description:
      "Connect with highly rated, certified nutritionists. View detailed profiles, verified credentials, and real patient reviews to find your perfect match.",
  },
];
export default function ContentSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const panel1Ref = useRef<HTMLDivElement>(null);
  const panel2Ref = useRef<HTMLDivElement>(null);
  const panel3Ref = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useGSAP(
    () => {
      // Initialize panels out of view to the right
      gsap.set(panel2Ref.current, { xPercent: 100 });
      gsap.set(panel3Ref.current, { xPercent: 100 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: "+=3000", // Controls the duration of the entire pinned scroll interaction
          scrub: 1,
          pin: true,
          anticipatePin: 1,
        },
      });

      // 1. Move Screen 1 out left, Move Screen 2 in from right
      tl.to(
        panel1Ref.current,
        { xPercent: -50, opacity: 0, ease: "power1.inOut", duration: 1 },
        0,
      );
      tl.to(
        panel2Ref.current,
        { xPercent: 0, ease: "power1.inOut", duration: 1 },
        0,
      );

      // 2. Pause slightly so the user can read the big title on Screen 2
      tl.to({}, { duration: 0.3 });

      // 3. Blur Screen 2 while sliding Screen 3 (Cards) in from the right over it
      tl.to(
        panel2Ref.current,
        {
          filter: "blur(16px)", // Blur effect
          opacity: 0.4,
          ease: "none",
          duration: 1,
        },
        "+=0",
      );
      tl.to(
        panel3Ref.current,
        {
          xPercent: 0,
          ease: "none",
          duration: 1,
        },
        "<", // The "<" symbol ensures this runs at the exact same time as the blur animation
      );
    },
    { scope: containerRef },
  );

  return (
    <section
      ref={containerRef}
      // Added z-20 and -mt-[100vh] below
      className="relative z-20 -mt-[100vh] h-screen w-full bg-[#113129] overflow-hidden text-white font-syne"
    >
      {/* =========================================
          SCREEN 1: SERVICES
      ========================================= */}
      <div
        ref={panel1Ref}
        className="absolute inset-0 w-full h-full flex flex-col md:flex-row items-center p-8 md:p-16 gap-8 md:gap-12"
      >
        {/* Left Col: Headers & CTA */}
        <div className="flex-1 max-w-sm space-y-6">
          <div className="text-orange-500 mb-2">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
              <path d="M12 2L15 9L22 12L15 15L12 22L9 15L2 12L9 9L12 2Z" />
            </svg>
          </div>
          <h2 className="text-5xl md:text-6xl font-bold leading-tight">
            Our <br /> <span className="text-orange-500">Service</span>
          </h2>
          <p className="text-white/80 text-sm md:text-base leading-relaxed">
            We offer expert nutrition services designed to support balanced
            health and well-being.
          </p>
          <Button className="bg-orange-500 hover:bg-orange-600 text-black font-semibold rounded-full px-8 py-6">
            More service
          </Button>
        </div>

        {/* Mid Col: Services List */}
        <div className="flex-1 flex flex-col w-full max-w-md space-y-2">
          {servicesData.map((item, idx) => {
            const isActive = idx === activeIndex;
            return (
              <div
                key={item.id}
                onClick={() => setActiveIndex(idx)}
                className={`flex items-center gap-4 rounded-2xl p-4 cursor-pointer transition-all duration-300 ${
                  isActive
                    ? "bg-white/10 border border-white/5 opacity-100"
                    : "hover:bg-white/5 opacity-60 hover:opacity-100 border border-transparent"
                }`}
              >
                <div className="bg-white/5 p-3 rounded-xl text-white">
                  <item.icon className="w-6 h-6" />
                </div>
                <span
                  className={`font-semibold text-lg transition-all ${
                    isActive
                      ? "underline decoration-white/30 underline-offset-4"
                      : "font-medium no-underline"
                  }`}
                >
                  {item.title}
                </span>
              </div>
            );
          })}
        </div>

        {/* Right Col: Image & Description */}
        <div className="flex-1 flex flex-col h-full justify-center space-y-6 overflow-hidden">
          {/* The key prop forces a re-mount on index change, triggering the Tailwind animation */}
          <div
            key={activeIndex}
            className="animate-in fade-in slide-in-from-right-4 duration-500 fill-mode-both"
          >
            <div className="relative w-full aspect-video md:aspect-[4/3] bg-white/10 rounded-3xl overflow-hidden group mb-6">
              {/* Image Placeholder */}
              <div className="absolute inset-0 bg-emerald-950 flex items-center justify-center">
                <span className="text-white/30 text-sm font-medium">
                  {servicesData[activeIndex].title} Image
                </span>
              </div>
              {/* Arrow Button */}
              <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-md p-3 rounded-xl border border-white/10 group-hover:bg-orange-500 transition-colors cursor-pointer">
                <ArrowUpRight className="w-5 h-5 text-white" />
              </div>
            </div>

            <div>
              <h3 className="text-2xl font-bold mb-2">
                {servicesData[activeIndex].title}
              </h3>
              <p className="text-white/60 text-sm leading-relaxed max-w-md">
                {servicesData[activeIndex].description}
              </p>
            </div>
          </div>
        </div>
      </div>
      {/* =========================================
          SCREEN 2: TITLE (will blur out)
      ========================================= */}
      <div
        ref={panel2Ref}
        className="absolute inset-0 w-full h-full flex flex-col items-center justify-center bg-[#113129] z-10"
      >
        <div className="text-orange-500 mb-6">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10">
            <path d="M12 2L15 9L22 12L15 15L12 22L9 15L2 12L9 9L12 2Z" />
          </svg>
        </div>
        <h2 className="text-5xl md:text-7xl font-bold text-center tracking-tight">
          The certified coaching staff <br />
          <span className="text-orange-500">Members</span>
        </h2>
      </div>

      {/* =========================================
          SCREEN 3: CARDS (Transparent bg, slides over screen 2)
      ========================================= */}
      <div
        ref={panel3Ref}
        className="absolute inset-0 w-full h-full flex items-center justify-center bg-transparent z-20 pointer-events-none"
      >
        {/* Enable pointer events on the inner wrapper so user can click cards if needed */}
        <div className="w-full px-8 md:px-16 flex gap-6 overflow-x-auto snap-x pointer-events-auto items-center justify-center">
          {/* Card 1 */}
          <div className="snap-center min-w-[280px] w-[280px] h-[400px] bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
            <div className="absolute bottom-6 left-6 z-20">
              <h4 className="text-2xl font-bold text-white mb-1">Emily rose</h4>
              <p className="text-white/70 text-sm font-medium">
                Pediatric nutritionist
              </p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="snap-center min-w-[280px] w-[280px] h-[400px] bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
            <div className="absolute bottom-6 left-6 z-20">
              <h4 className="text-2xl font-bold text-white mb-1">Andy king</h4>
              <p className="text-white/70 text-sm font-medium">
                Sports nutritionist
              </p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="snap-center min-w-[280px] w-[280px] h-[400px] bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
            <div className="absolute bottom-6 left-6 z-20">
              <h4 className="text-2xl font-bold text-white mb-1">Lisa white</h4>
              <p className="text-white/70 text-sm font-medium">
                Nutrition educator
              </p>
            </div>
          </div>

          {/* Card 4 */}
          <div className="snap-center min-w-[280px] w-[280px] h-[400px] bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
            <div className="absolute bottom-6 left-6 z-20">
              <h4 className="text-2xl font-bold text-white mb-1">Tom brown</h4>
              <p className="text-white/70 text-sm font-medium">
                Fitness and nutrition expert
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
