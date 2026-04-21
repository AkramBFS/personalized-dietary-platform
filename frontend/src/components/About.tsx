"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, ChevronRight, Circle, Plus, Sparkles } from "lucide-react";

export default function AboutPage() {
  // --- Data Models ---
  const problemStatements = [
    "Hormonal imbalances (thyroid disorders, insulin resistance, PCOS)",
    "Metabolic conditions and chronic diseases",
    "Postpartum body changes",
    "Stress, burnout, and lifestyle constraints",
    "Lack of accurate dietary awareness and professional guidance",
  ];

  const offerings = [
    {
      title: "Personalized Consultations",
      desc: "Book online consultations with certified nutritionists globally. Tailored to medical history, lifestyle, and goals with defined durations and clear objectives.",
    },
    {
      title: "AI-Assisted Calorie Tracking",
      desc: "Upload images of meals for AI food recognition. Uses computer vision and deep learning to estimate portion sizes and calories, building long-term awareness.",
    },
    {
      title: "Structured Subscriptions",
      desc: "Access long-term plans, seasonal programs (e.g., Ramadan, Summer), and pay-per-use services ensuring clarity and structure in service delivery.",
    },
    {
      title: "Education & Community",
      desc: "A supportive ecosystem featuring blogs, wellness education, testimonials, and newsletters to help users stay motivated.",
    },
  ];

  const targetAudience = [
    "Weight loss resistance",
    "Diabetes & Insulin resistance",
    "PCOS & Thyroid disorders",
    "Postpartum recovery",
    "High-stress professionals",
    "Women over 40 (Hormonal health)",
    "Sustainable habit seekers",
  ];

  return (
    <main className="flex-grow pt-40 pb-32 text-[#cce8e7] selection:bg-[#3DDC97]/30">
      <div className="max-w-7xl mx-auto px-6 md:px-12 space-y-48">
        {/* --- HERO SECTION: TYPOGRAPHY FOCUS --- */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8">
          <div className="lg:col-span-8">
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-[#3DDC97] font-medium tracking-[0.2em] uppercase text-sm mb-6 flex items-center gap-3"
            >
              <Circle className="w-2 h-2 fill-[#3DDC97]" />
              The Platform Philosophy
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-6xl md:text-8xl font-bold font-headline tracking-tighter leading-[0.9] text-[#cce8e7] mb-12"
            >
              Redefining <br />
              <span className="text-[#3DDC97] italic">Personalized</span> <br />
              Nutrition.
            </motion.h1>
          </div>

          <div className="lg:col-span-4 lg:pt-32">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-8 border-l border-[#414848] pl-8"
            >
              <p className="text-xl text-[#c0c8c8] leading-relaxed">
                This project is a web-based sanctuary designed to support
                individuals facing complex dietary challenges through
                professional expertise and AI-assisted tracking.
              </p>
              <p className="text-[#c0c8c8] leading-relaxed">
                We promote sustainable, healthy lifestyle changes by
                acknowledging that weight is influenced by metabolic health,
                hormones, and psychological well-being.
              </p>
            </motion.div>
          </div>
        </section>

        {/* --- WHY THIS EXISTS: STRUCTURAL LIST --- */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          <div className="lg:col-span-5">
            <h2 className="text-4xl md:text-5xl font-bold font-headline leading-tight sticky top-32">
              Why <br />
              <span className="text-[#3DDC97]">This Project</span> <br />
              Exists.
            </h2>
          </div>
          <div className="lg:col-span-7 space-y-12">
            <p className="text-2xl text-[#cce8e7] font-light leading-relaxed">
              Obesity and weight management difficulties are not solely caused
              by overeating. Many struggle despite repeated efforts due to
              systemic physiological factors.
            </p>
            <div className="grid grid-cols-1 gap-4">
              {problemStatements.map((item, i) => (
                <div
                  key={i}
                  className="group flex items-center justify-between py-6 border-b border-[#414848] hover:border-[#3DDC97] transition-colors cursor-default"
                >
                  <span className="text-xl md:text-2xl font-medium text-[#c0c8c8] group-hover:text-[#cce8e7] transition-colors">
                    {item}
                  </span>
                  <Plus className="text-[#3DDC97] opacity-0 group-hover:opacity-100 transition-all transform group-hover:rotate-90" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* --- PLATFORM OFFERINGS: GRID REFINED --- */}
        <section className="space-y-20">
          <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-[#414848] pb-12 gap-8">
            <h2 className="text-5xl font-bold font-headline text-[#cce8e7]">
              Core Pillars
            </h2>
            <p className="max-w-md text-[#c0c8c8] text-lg">
              Combining expert human supervision with intelligent digital
              systems to bridge the gap in professional care.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-[#414848] overflow-hidden border border-[#414848]">
            {offerings.map((offer, i) => (
              <div
                key={i}
                className="bg-[#15464E] p-12 md:p-16 hover:bg-[#1c5a64] transition-colors space-y-6"
              >
                <span className="text-[#3DDC97] font-mono text-sm tracking-widest">
                  0{i + 1} //
                </span>
                <h3 className="text-3xl font-bold font-headline text-[#cce8e7]">
                  {offer.title}
                </h3>
                <p className="text-[#c0c8c8] text-lg leading-relaxed">
                  {offer.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* --- TARGET AUDIENCE: MARQUEE STYLE TEXT --- */}
        <section className="py-24 bg-[#15464E] rounded-[3rem] border border-[#414848] overflow-hidden">
          <div className="px-12 mb-16">
            <h2 className="text-sm font-bold tracking-[0.3em] uppercase text-[#3DDC97] mb-4">
              Target Audience
            </h2>
            <p className="text-3xl font-medium max-w-2xl text-[#cce8e7]">
              Designed for those seeking recovery, balance, and longevity
              through science-backed nutrition.
            </p>
          </div>
          <div className="flex flex-wrap gap-4 px-12">
            {targetAudience.map((target, i) => (
              <span
                key={i}
                className="px-8 py-4 rounded-full border border-[#414848] bg-[#15464E] text-xl font-medium text-[#c0c8c8] hover:border-[#3DDC97] hover:text-[#3DDC97] transition-all cursor-default"
              >
                {target}
              </span>
            ))}
          </div>
        </section>

        {/* --- SYSTEM ROLES: LARGE TYPOGRAPHY --- */}
        <section className="space-y-16">
          <h2 className="text-5xl font-bold font-headline text-center text-[#cce8e7]">
            System Architecture
          </h2>
          <div className="grid grid-cols-1 gap-12">
            {[
              {
                role: "Patients",
                desc: "Manage health data and interact with experts for accountability.",
              },
              {
                role: "Nutritionists",
                desc: "Design personalized plans and conduct global consultations.",
              },
              {
                role: "AI System",
                desc: "Calculates approximate caloric values through image recognition.",
              },
            ].map((r, i) => (
              <div
                key={i}
                className="flex flex-col md:flex-row md:items-center gap-8 group"
              >
                <span className="text-8xl md:text-[10rem] font-bold font-headline text-[#414848]/60 group-hover:text-[#3DDC97]/20 transition-colors leading-none">
                  {i + 1}
                </span>
                <div className="space-y-4">
                  <h3 className="text-4xl font-bold text-[#cce8e7]">
                    {r.role}
                  </h3>
                  <p className="text-xl text-[#c0c8c8] max-w-xl">{r.desc}</p>
                </div>
                <div className="hidden md:block flex-grow border-t border-[#414848] border-dashed ml-8" />
              </div>
            ))}
          </div>
        </section>

        {/* --- ACADEMIC & VISION: FINAL STATEMENT --- */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-start pt-24 border-t border-[#414848]">
          <div className="space-y-8">
            <h2 className="text-4xl font-bold font-headline leading-tight text-[#cce8e7]">
              Bridging professional care with accessible digital tools.
            </h2>
            <p className="text-xl text-[#c0c8c8] leading-relaxed">
              Our vision is to help individuals build healthier relationships
              with food. This platform serves as the bridge between theoretical
              research and functional, human-centered design.
            </p>
            <button className="flex items-center gap-4 text-[#3DDC97] font-bold text-lg group">
              Read the Manifesto{" "}
              <ArrowRight className="group-hover:translate-x-2 transition-transform" />
            </button>
          </div>
          <div className="p-12 bg-[#3DDC97]/10 rounded-[2rem] border border-[#3DDC97]/20">
            <h3 className="text-sm font-bold tracking-widest uppercase text-[#3DDC97] mb-6">
              Academic Context
            </h3>
            <p className="text-lg text-[#c0c8c8] leading-relaxed font-medium">
              Developed within Workshop L3 – Computer Science at NTIC. This
              project contributes to research on vision-based dietary
              assessment, comparing real-world implementations with existing
              scientific literature.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
