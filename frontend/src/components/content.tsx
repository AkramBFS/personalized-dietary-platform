"use client";

import Link from "next/link";
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
  Store,
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
    image:
      "https://plus.unsplash.com/premium_photo-1743169049314-0666e8e35ca3?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    link: "/services#ai-calorie-estimation",
  },
  {
    id: "online-consultations",
    title: "Online Consultations",
    icon: Video,
    description:
      "Book personalized video sessions with certified professionals. Get tailored advice, discuss your health goals, and receive customized dietary guidance.",
    image: "/branding/Expert-call.jpg",
    link: "/consultations",
  },
  {
    id: "personalized-plans",
    title: "Personalized Meal Plans",
    icon: ClipboardList,
    description:
      "Browse predefined plans or request a custom schedule tailored to your exact needs. Easily track your daily meals and nutritional goals.",
    image:
      "https://images.unsplash.com/photo-1543362906-acfc16c67564?auto=format&fit=crop&q=80&w=1000",
    link: "/services#personalized-plans",
  },
  {
    id: "Plan-marketplace",
    title: "Plan Marketplace",
    icon: Store,
    description:
      "Explore a variety of pre-designed meal plans or create your own custom schedule. Track your progress and stay on course with your nutritional goals.",
    image: "/branding/marketplace.PNG",
    link: "/services#plan-marketplace",
  },
  {
    id: "community-feed",
    title: "Community Feed",
    icon: Users,
    description:
      "Join an active ecosystem of health enthusiasts. Share your journey, read curated posts, and stay motivated with our moderated community platform.",
    image:
      "https://images.unsplash.com/photo-1528629297340-d1d466945dc5?auto=format&fit=crop&q=80&w=1000",
    link: "/community",
  },
  {
    id: "expert-coaches",
    title: "Verified Expert Coaches",
    icon: BadgeCheck,
    description:
      "Connect with highly rated, certified nutritionists. View detailed profiles, verified credentials, and real patient reviews to find your perfect match.",
    image:
      "https://plus.unsplash.com/premium_photo-1661690177761-8d521bd794f9?q=80&w=869&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    link: "/services#online-consultation",
  },
];

const expertsData = [
  {
    name: "Dr. Luke Atme",
    role: "Fitness and nutrition expert",
    image: "/professionals/pf2.jpg",
  },
  {
    name: "David Chen",
    role: "Sports nutritionist",
    image: "/professionals/mj.jpg",
  },
  {
    name: "James Wilson",
    role: "Nutrition educator",
    image:
      "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=800",
  },
  {
    name: "Michael Brooks",
    role: "Pediatric nutrition expert",
    image:
      "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&q=80&w=800",
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
      gsap.set(panel2Ref.current, { xPercent: 100 });
      gsap.set(panel3Ref.current, { xPercent: 100 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: "+=3000",
          scrub: 1,
          pin: true,
          anticipatePin: 1,
        },
      });

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

      tl.to({}, { duration: 0.3 });

      tl.to(
        panel2Ref.current,
        {
          filter: "blur(16px)",
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
        "<",
      );
    },
    { scope: containerRef },
  );

  return (
    <section
      ref={containerRef}
      className="relative z-20 -mt-[100vh] h-screen w-full bg-background overflow-hidden text-foreground font-syne"
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
          <div className="text-primary mb-2">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
              <path d="M12 2L15 9L22 12L15 15L12 22L9 15L2 12L9 9L12 2Z" />
            </svg>
          </div>
          <h2 className="text-5xl md:text-6xl font-bold leading-tight">
            Our <br /> <span className="text-primary">Service</span>
          </h2>
          <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
            We offer expert nutrition services designed to support balanced
            health and well-being.
          </p>

          <Button className="bg-button-primary hover:opacity-90 text-button-primary-foreground font-semibold rounded-full px-8 py-6">
            <Link href="/services">Explore our services</Link>
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
                    ? "bg-accent border border-border opacity-100"
                    : "hover:bg-muted opacity-60 hover:opacity-100 border border-transparent"
                }`}
              >
                <div className="bg-secondary p-3 rounded-xl text-secondary-foreground">
                  <item.icon className="w-6 h-6" />
                </div>
                <span
                  className={`font-semibold text-lg transition-all ${
                    isActive
                      ? "text-accent-foreground underline decoration-primary/50 underline-offset-4"
                      : "text-foreground font-medium no-underline"
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
          <div
            key={activeIndex}
            className="animate-in fade-in slide-in-from-right-4 duration-500 fill-mode-both"
          >
            <Link
              href={servicesData[activeIndex].link}
              className="relative block w-full aspect-video md:aspect-[4/3] bg-muted rounded-3xl overflow-hidden group mb-6 cursor-pointer"
            >
              {/* Dynamic Image from servicesData */}
              <img
                src={servicesData[activeIndex].image}
                alt={servicesData[activeIndex].title}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-secondary/10" />

              <div className="absolute bottom-4 right-4 bg-background/50 backdrop-blur-md p-3 rounded-xl border border-border group-hover:bg-primary transition-colors">
                <ArrowUpRight className="w-5 h-5 text-foreground group-hover:text-primary-foreground" />
              </div>
            </Link>

            <div>
              <h3 className="text-2xl font-bold mb-2 text-foreground">
                {servicesData[activeIndex].title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-md">
                {servicesData[activeIndex].description}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================
          SCREEN 2: TITLE
      ========================================= */}
      <div
        ref={panel2Ref}
        className="absolute inset-0 w-full h-full flex flex-col items-center justify-center bg-background z-10"
      >
        <div className="text-primary mb-6">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10">
            <path d="M12 2L15 9L22 12L15 15L12 22L9 15L2 12L9 9L12 2Z" />
          </svg>
        </div>
        <h2 className="text-5xl md:text-7xl font-bold text-center tracking-tight text-foreground">
          The certified nutritionist staff <br />
          <span className="text-primary">Members</span>
        </h2>
      </div>

      {/* =========================================
          SCREEN 3: CARDS
      ========================================= */}
      <div
        ref={panel3Ref}
        className="absolute inset-0 w-full h-full flex items-center justify-center bg-transparent z-20 pointer-events-none"
      >
        <div className="w-full px-8 md:px-16 flex gap-6 overflow-x-auto snap-x pointer-events-auto items-center justify-center">
          {expertsData.map((expert, i) => {
            return (
              <div
                key={expert.name}
                className="snap-center min-w-[280px] w-[280px] h-[400px] bg-card/80 backdrop-blur-xl border border-border rounded-[2rem] overflow-hidden relative group cursor-pointer"
              >
                {/* Expert Profile Image */}
                <img
                  src={expert.image}
                  alt={expert.name}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/50 via-background/20 to-transparent z-10 transition-opacity duration-300 group-hover:opacity-80" />

                <div className="absolute bottom-6 left-6 z-20">
                  <h4 className="text-2xl font-bold text-white mb-1">
                    {expert.name}
                  </h4>
                  <p className="text-white/80 text-sm font-medium">
                    {expert.role}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
