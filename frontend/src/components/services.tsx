"use client";

import {
  ArrowRight,
  CheckCircle2,
  Camera,
  Cpu,
  Video,
  Calendar,
  ShoppingBag,
  Globe2,
  Utensils,
  Sparkles,
  Check,
  Stethoscope,
  Heart,
  Target,
  FileText,
  Sun,
  Moon,
  Info,
} from "lucide-react";
import { motion } from "framer-motion";

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-background text-white font-sans antialiased pt-24 pb-32 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 space-y-40">
        {/* --- HERO SECTION --- */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="grid lg:grid-cols-2 gap-16 items-center"
        >
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/60 border border-border">
              <div className="w-1.5 h-1.5 rounded-full bg-brand" />
              <span className="text-[10px] font-bold text-white/80 uppercase tracking-widest">
                Our Services
              </span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-tight">
              A Complete <span className="text-brand">Ecosystem</span>
            </h1>

            <p className="text-lg text-muted-foreground max-w-md leading-relaxed">
              Combining AI-powered tools and professional human expertise to
              support sustainable nutrition and long-term health.
            </p>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-[#61dda3] to-[#5dd9d8] text-[#00161c] font-bold shadow-[0_0_15px_rgba(97,221,163,0.3)] hover:shadow-[0_0_25px_rgba(97,221,163,0.5)] transition-all"
            >
              Explore Services
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </div>

          <div className="relative rounded-[2.5rem] overflow-hidden aspect-square md:aspect-[4/3] shadow-2xl border border-border/50 group">
            <img
              src="https://placehold.co/800x600/0D3239/61dda3?text=Sustainable+Health"
              alt="Sustainable Health Ecosystem"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute bottom-6 left-6 right-6 bg-card/80 backdrop-blur-xl p-5 rounded-2xl border border-border flex items-center gap-5">
              <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center text-brand shrink-0">
                <Heart className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm mb-0.5">
                  Long-term Health
                </h4>
                <p className="text-xs text-white/60">
                  Built for real-life adherence and results.
                </p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* --- AI CALORIE ESTIMATION SECTION --- */}
        <section id="ai-calorie-estimation">
          <motion.section
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="grid lg:grid-cols-2 gap-16 items-center"
          >
            <div className="space-y-8 lg:order-1 order-2">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/60 border border-border">
                <Sparkles className="w-3 h-3 text-brand" />
                <span className="text-[10px] font-bold text-white/80 uppercase tracking-widest">
                  Pro Subscription
                </span>
              </div>

              <div>
                <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
                  AI Calorie Estimation
                </h2>
                <h3 className="text-xl text-brand font-medium mb-4">
                  Smarter tracking through food recognition
                </h3>
                <p className="text-muted-foreground leading-relaxed text-lg max-w-md">
                  Upload a photo of your meal and receive an instant calorie
                  estimate powered by computer vision and nutritional databases.
                </p>
              </div>

              <div className="space-y-6">
                <ul className="space-y-4">
                  {[
                    "Build food awareness",
                    "Track intake without manual logging",
                    "Stay consistent outside structured plans",
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-brand shrink-0" />
                      <span className="text-white/90 font-medium">{item}</span>
                    </li>
                  ))}
                </ul>

                <div className="flex items-start gap-3 bg-accent/30 p-4 rounded-xl border border-border/50">
                  <Info className="w-5 h-5 text-white/50 shrink-0 mt-0.5" />
                  <p className="text-sm text-white/60">
                    Results are approximate and designed for awareness, not
                    medical diagnosis.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 lg:order-2 order-1">
              <div className="bg-card p-6 rounded-[2rem] border border-border flex flex-col items-center text-center justify-center aspect-square shadow-lg">
                <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center text-brand mb-4">
                  <Camera className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-white mb-2 text-sm">
                  1. Snap a Photo
                </h4>
                <p className="text-xs text-white/60">
                  Capture your meal easily.
                </p>
              </div>

              <div className="bg-card p-6 rounded-[2rem] border border-border flex flex-col items-center text-center justify-center aspect-square shadow-lg">
                <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center text-brand mb-4">
                  <Cpu className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-white mb-2 text-sm">
                  2. AI Analysis
                </h4>
                <p className="text-xs text-white/60">
                  Instant estimate generated.
                </p>
              </div>

              <div className="col-span-2 relative rounded-[2rem] overflow-hidden h-48 md:h-56 border border-border/50">
                <img
                  src="https://placehold.co/800x400/051b20/61dda3?text=Scanning+Food"
                  alt="Scanning"
                  className="w-full h-full object-cover opacity-80"
                />
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-card/90 backdrop-blur-md px-5 py-2.5 rounded-full border border-border flex items-center gap-3 whitespace-nowrap shadow-xl">
                  <div className="w-2 h-2 rounded-full bg-brand animate-pulse" />
                  <span className="text-sm font-bold text-white">
                    Scanning... ~450 kcal
                  </span>
                </div>
              </div>
            </div>
          </motion.section>
        </section>

        {/* --- ONLINE CONSULTATIONS SECTION --- */}
        <section id="online-consultation">
          <motion.section
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="grid lg:grid-cols-2 gap-16 items-center"
          >
            {/* Visual Column */}
            <div className="relative h-full min-h-[400px]">
              <div className="absolute inset-0 bg-card rounded-[2.5rem] border border-border shadow-xl p-8 flex flex-col justify-between overflow-hidden">
                <div className="flex items-center justify-between mb-8 relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center border border-brand/30">
                      <Stethoscope className="w-6 h-6 text-brand" />
                    </div>
                    <div>
                      <div className="text-white font-bold">
                        Dr. Sarah Jenkins
                      </div>
                      <div className="text-white/60 text-xs">
                        Certified Nutritionist
                      </div>
                    </div>
                  </div>
                  <div className="bg-brand/10 text-brand px-3 py-1 rounded-full text-xs font-bold border border-brand/20 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
                    Live Session
                  </div>
                </div>

                <div className="flex-1 bg-muted rounded-2xl border border-border/60 relative overflow-hidden flex items-center justify-center">
                  <Video className="w-16 h-16 text-white/10" />
                  <div className="absolute bottom-4 right-4 bg-card px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground">
                    45:00
                  </div>
                </div>

                <div className="mt-6 bg-accent/40 p-4 rounded-xl border border-border flex items-start gap-3">
                  <Check className="w-5 h-5 text-brand shrink-0" />
                  <p className="text-sm text-white/90 font-medium">
                    "Every consultation includes a personalized dietary plan."
                  </p>
                </div>
              </div>
            </div>

            {/* Text Column */}
            <div className="space-y-8 flex flex-col">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/60 border border-border w-fit">
                <Globe2 className="w-3 h-3 text-brand" />
                <span className="text-[10px] font-bold text-white/80 uppercase tracking-widest">
                  Available to all users
                </span>
              </div>

              <div>
                <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
                  Online Nutrition Consultations
                </h2>
                <h3 className="text-xl text-brand font-medium mb-4">
                  Professional guidance, worldwide
                </h3>
                <p className="text-muted-foreground leading-relaxed text-lg max-w-md">
                  Work directly with certified nutritionists through private
                  online sessions. No ongoing subscription required.
                </p>
              </div>

              <div className="space-y-4">
                <h4 className="text-white font-bold mb-2">
                  Consultations focus on:
                </h4>
                <div className="grid gap-4">
                  {[
                    "Understanding your health history",
                    "Identifying underlying challenges",
                    "Creating a clear path toward your goals",
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="bg-card p-4 rounded-xl border border-border flex items-center gap-4"
                    >
                      <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-brand shrink-0 font-bold text-sm">
                        {i + 1}
                      </div>
                      <span className="text-white/90 text-sm font-medium">
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.section>
        </section>

        {/* --- PERSONALIZED DIETARY PLANS SECTION --- */}
        <section id="personalized-plans">
          <motion.section
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="grid lg:grid-cols-2 gap-16 items-center"
          >
            {/* Text Column */}
            <div className="space-y-8 lg:order-1 order-2">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/60 border border-border w-fit">
                <Utensils className="w-3 h-3 text-brand" />
                <span className="text-[10px] font-bold text-white/80 uppercase tracking-widest">
                  Included with 1-on-1 Consultations
                </span>
              </div>

              <div>
                <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
                  Personalized Dietary Plans
                </h2>
                <h3 className="text-xl text-brand font-medium mb-4">
                  Nutrition built around you
                </h3>
                <p className="text-muted-foreground leading-relaxed text-lg max-w-md">
                  Personalized plans are designed after a full consultation.
                  They go beyond calories — focusing on real-life adherence and
                  results.
                </p>
              </div>

              <div>
                <h4 className="text-white font-bold mb-4">
                  Plans take into account:
                </h4>
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    { icon: Stethoscope, text: "Medical conditions" },
                    { icon: Target, text: "Hormonal & metabolic factors" },
                    { icon: Calendar, text: "Lifestyle & preferences" },
                    { icon: Heart, text: "Long-term sustainability" },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 bg-card p-3.5 rounded-xl border border-border"
                    >
                      <item.icon className="w-5 h-5 text-brand" />
                      <span className="text-sm text-white/90">{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Visual Column */}
            <div className="relative lg:order-2 order-1 bg-card rounded-[2.5rem] border border-border shadow-xl p-8">
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-border pb-4">
                  <h4 className="font-bold text-lg text-white">
                    Your Daily Targets
                  </h4>
                  <FileText className="w-5 h-5 text-brand" />
                </div>

                {/* Mock Macro UI */}
                <div className="space-y-4">
                  {[
                    {
                      label: "Protein",
                      current: 140,
                      max: 160,
                      color: "bg-blue-400",
                    },
                    {
                      label: "Carbs",
                      current: 180,
                      max: 200,
                      color: "bg-brand",
                    },
                    {
                      label: "Fats",
                      current: 45,
                      max: 60,
                      color: "bg-yellow-400",
                    },
                  ].map((macro, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-white/80">{macro.label}</span>
                        <span className="text-white/60">
                          {macro.current}g / {macro.max}g
                        </span>
                      </div>
                      <div className="w-full h-2 bg-accent rounded-full overflow-hidden">
                        <div
                          className={`h-full ${macro.color} rounded-full`}
                          style={{
                            width: `${(macro.current / macro.max) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-muted p-4 rounded-xl border border-border/60 mt-6">
                  <div className="text-xs text-brand font-bold uppercase tracking-wider mb-2">
                    Meal 1 • 08:00 AM
                  </div>
                  <div className="text-sm text-white font-medium">
                    Oatmeal with Berries & Whey
                  </div>
                  <div className="text-xs text-white/50 mt-1">
                    Customized for your metabolic phase
                  </div>
                </div>
              </div>
            </div>
          </motion.section>
        </section>

        {/* --- PLAN MARKETPLACE SECTION --- */}
        <section id="plan-marketplace">
          <motion.section
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="grid lg:grid-cols-2 gap-16 items-center"
          >
            {/* Visual Column */}
            <div className="relative grid grid-cols-2 gap-4">
              <div className="bg-card p-6 rounded-3xl border border-border shadow-lg transform hover:-translate-y-2 transition-transform">
                <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center text-brand mb-4">
                  <Target className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-white mb-1">Fat Loss Protocol</h4>
                <p className="text-xs text-white/60 mb-4">8-Week Structure</p>
                <div className="text-brand text-sm font-bold">
                  View Plan →
                </div>
              </div>
              <div className="bg-card p-6 rounded-3xl border border-border shadow-lg transform translate-y-8 hover:translate-y-6 transition-transform">
                <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center text-blue-400 mb-4">
                  <Heart className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-white mb-1">Gut Health Reset</h4>
                <p className="text-xs text-white/60 mb-4">4-Week Structure</p>
                <div className="text-blue-400 text-sm font-bold">
                  View Plan →
                </div>
              </div>
            </div>

            {/* Text Column */}
            <div className="space-y-8 flex flex-col">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/60 border border-border w-fit">
                <ShoppingBag className="w-3 h-3 text-brand" />
                <span className="text-[10px] font-bold text-white/80 uppercase tracking-widest">
                  Available to all users
                </span>
              </div>

              <div>
                <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
                  Plan Marketplace
                </h2>
                <h3 className="text-xl text-brand font-medium mb-4">
                  Ready-made plans by professionals
                </h3>
                <p className="text-muted-foreground leading-relaxed text-lg max-w-md">
                  Access professionally designed meal plans without booking a
                  consultation. Ideal for users who want guidance without
                  ongoing supervision.
                </p>
              </div>

              <div className="space-y-4">
                {[
                  "Created by certified nutritionists",
                  "Structured and goal-specific",
                  "Ready to use immediately",
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-brand shrink-0" />
                    <span className="text-white/90 font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.section>
        </section>

        {/* --- SEASONAL PROGRAMS SECTION --- */}
        <section id="seasonal-programs">
          <motion.section
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="grid lg:grid-cols-2 gap-16 items-center"
          >
            {/* Text Column */}
            <div className="space-y-8 lg:order-1 order-2">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/60 border border-border w-fit">
                <Calendar className="w-3 h-3 text-brand" />
                <span className="text-[10px] font-bold text-white/80 uppercase tracking-widest">
                  Standalone Plans in Marketplace
                </span>
              </div>

              <div>
                <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
                  Seasonal Programs
                </h2>
                <h3 className="text-xl text-brand font-medium mb-4">
                  Nutrition adapted to the moment
                </h3>
                <p className="text-muted-foreground leading-relaxed text-lg max-w-md">
                  Seasonal programs are time-specific plans designed to provide
                  structure during periods where your routine and habits change
                  naturally.
                </p>
              </div>

              <div>
                <h4 className="text-white font-bold mb-4">Designed around:</h4>
                <div className="flex flex-wrap gap-3">
                  <div className="bg-card px-4 py-2.5 rounded-xl border border-border flex items-center gap-2">
                    <Moon className="w-4 h-4 text-yellow-400" />
                    <span className="text-sm font-medium text-white/90">
                      Ramadan Fasting
                    </span>
                  </div>
                  <div className="bg-card px-4 py-2.5 rounded-xl border border-border flex items-center gap-2">
                    <Sun className="w-4 h-4 text-orange-400" />
                    <span className="text-sm font-medium text-white/90">
                      Summer/Winter Phases
                    </span>
                  </div>
                  <div className="bg-card px-4 py-2.5 rounded-xl border border-border flex items-center gap-2">
                    <Target className="w-4 h-4 text-brand" />
                    <span className="text-sm font-medium text-white/90">
                      Short-term Shifts
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Visual Column */}
            <div className="relative lg:order-2 order-1">
              <div className="bg-card p-10 rounded-[2.5rem] border border-border shadow-xl overflow-hidden group">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-8xl font-black text-white/[0.02] pointer-events-none tracking-tighter whitespace-nowrap text-center leading-[0.8]">
                  SEASONAL
                </div>
                <div className="relative z-10 text-center flex flex-col items-center">
                  <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center text-yellow-400 mb-6 border border-border">
                    <Moon className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2 text-white">
                    Ramadan Protocol
                  </h3>
                  <p className="text-white/60 text-sm leading-relaxed mb-6 max-w-xs mx-auto">
                    Maintain muscle and energy levels during fasting hours with
                    optimal nutrient timing.
                  </p>
                  <button className="inline-flex items-center gap-2 text-brand text-sm font-bold hover:gap-3 transition-all">
                    View Program <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </motion.section>
        </section>

        {/* --- BOTTOM CTA SECTION --- */}
        <motion.section
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-4xl mx-auto pt-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
            One Platform, <span className="text-brand">Multiple Paths</span>
          </h2>
          <p className="text-white/60 text-lg mb-8 max-w-2xl mx-auto">
            You can choose the path that fits your current needs — and change
            anytime.
          </p>

          <div className="flex flex-wrap justify-center gap-3 mb-10">
            {[
              "Full professional supervision",
              "AI-assisted self-tracking",
              "A ready-made plan",
              "Seasonal guidance",
            ].map((path, i) => (
              <span
                key={i}
                className="px-4 py-2 rounded-full bg-card border border-border text-white/80 text-sm"
              >
                {path}
              </span>
            ))}
          </div>

          <div className="flex flex-wrap justify-center gap-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-6 py-3 rounded-xl border border-border text-white text-sm font-bold hover:bg-accent transition-colors"
            >
              Explore Services
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-6 py-3 rounded-xl border border-border text-white text-sm font-bold hover:bg-accent transition-colors"
            >
              Browse Marketplace
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#61dda3] to-[#5dd9d8] text-[#00161c] text-sm font-bold shadow-[0_0_15px_rgba(97,221,163,0.3)] hover:shadow-[0_0_20px_rgba(97,221,163,0.5)] transition-all"
            >
              Book a Consultation
            </motion.button>
          </div>
        </motion.section>
      </div>
    </div>
  );
}
