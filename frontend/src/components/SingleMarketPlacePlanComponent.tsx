"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  BadgeCheck,
  ShoppingCart,
  Star,
  StarHalf,
  Activity,
  HeartPulse,
  Calendar,
  Utensils,
  Leaf,
  Quote,
  BookOpen,
  ClipboardList,
  Pill,
  MessageCircle,
  Info,
  Loader2,
} from "lucide-react";
import Image from "next/image";
// Importing api utility if you want to fetch real data
// import api, { unwrapResponse } from "@/lib/api"; 

interface PlanProps {
  slug: string;
}

// Reusable Star component
const RenderStars = ({ rating }: { rating: number }) => {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    if (i <= rating) {
      stars.push(
        <Star key={i} className="w-4 h-4 fill-brand text-brand" />
      );
    } else if (i - 0.5 === rating) {
      stars.push(
        <StarHalf key={i} className="w-4 h-4 fill-brand text-brand" />
      );
    } else {
      stars.push(<Star key={i} className="w-4 h-4 text-muted" />);
    }
  }
  return <div className="flex items-center gap-0.5">{stars}</div>;
};

export default function SingleMarketPlacePlanComponent({ slug }: PlanProps) {
  // Logic state for data fetching
  const [loading, setLoading] = useState(false);
  
  // In a real scenario, you would use useEffect to fetch plan data by slug
  /*
  useEffect(() => {
    const fetchPlan = async () => {
      try {
        setLoading(true);
        const res = await api.get(`marketplace/plans/${slug}/`);
        // setData(unwrapResponse(res));
      } catch (err) {
        console.error("Failed to fetch plan", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPlan();
  }, [slug]);
  */

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 text-brand animate-spin" />
        <p className="text-muted-foreground animate-pulse">Loading protocol details...</p>
      </div>
    );
  }

  return (
    <div className="bg-background text-foreground font-sans min-h-screen flex flex-col selection:bg-brand selection:text-brand-foreground mt-8">
      <main className="flex-grow w-full max-w-[1280px] mx-auto px-6 md:px-8 py-12 flex flex-col gap-20">
        
        {/* Hero Section */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col gap-6"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-brand/10 border border-brand/20 w-fit">
              <BadgeCheck className="w-4 h-4 text-brand" />
              <span className="text-xs font-bold text-brand uppercase tracking-wider">
                Clinical Grade Protocol
              </span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-7xl font-serif font-medium text-foreground leading-tight tracking-tight">
              28-Day Metabolic Reset
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-xl font-light leading-relaxed">
              A scientifically-backed nutritional protocol designed to optimize
              insulin sensitivity, enhance cellular energy, and promote
              sustainable fat loss through precision macronutrient balancing.
            </p>
            
            <div className="flex items-end gap-4 mt-4 mb-2">
              <div className="flex flex-col">
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Investment</span>
                <span className="text-4xl font-serif text-brand">$49.00</span>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 mt-2">
               <button className="flex items-center justify-center gap-3 bg-brand text-brand-foreground px-8 py-4 rounded-lg font-bold text-sm uppercase tracking-widest hover:opacity-90 transition-all duration-300 shadow-lg shadow-brand/20 cursor-pointer">
                  <ShoppingCart className="w-5 h-5" />
                  Purchase Plan
               </button>
               <button className="flex items-center justify-center gap-2 border border-border text-foreground px-8 py-4 rounded-lg font-bold text-sm uppercase tracking-widest hover:bg-muted transition-all duration-300 cursor-pointer">
                  View Sample Menu
               </button>
            </div>
            
            <div className="flex items-center gap-4 mt-4">
              <RenderStars rating={4.5} />
              <span className="text-sm font-semibold text-muted-foreground">
                4.9/5 (124 Patient Reviews)
              </span>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative rounded-3xl shadow-2xl bg-card border border-border p-4 aspect-[4/3] group"
          >
            <div className="relative w-full h-full rounded-2xl overflow-hidden">
                <Image 
                  src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1200&q=80"
                  alt="Clinical meal prep containers with fresh vegetables"
                  fill
                  className="object-cover grayscale-[0.2] transition-transform duration-700 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
            </div>
          </motion.div>
        </section>

        {/* Plan Overview & Stats (Bento Grid) */}
        <section>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="lg:col-span-8 bg-card rounded-2xl p-8 md:p-10 border border-border shadow-sm flex flex-col justify-center"
            >
              <h2 className="text-3xl lg:text-4xl font-serif font-medium text-foreground mb-8 tracking-tight">The Scientific Basis</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                <div className="flex flex-col gap-4">
                  <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center border border-border">
                    <Activity className="w-6 h-6 text-brand" />
                  </div>
                  <h3 className="text-lg font-bold uppercase tracking-widest text-foreground">Insulin Sensitivity</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    By strategically timing carbohydrate intake and focusing on low-glycemic sources, this protocol helps resensitize cellular receptors to insulin.
                  </p>
                </div>
                
                <div className="flex flex-col gap-4">
                  <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center border border-border">
                    <HeartPulse className="w-6 h-6 text-brand" />
                  </div>
                  <h3 className="text-lg font-bold uppercase tracking-widest text-foreground">Sustainable Fat Loss</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Rather than extreme caloric restriction, we prioritize metabolic flexibility.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Quick Stats Cards */}
            <div className="lg:col-span-4 flex flex-col gap-6">
               <motion.div 
                 initial={{ opacity: 0, y: 20 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 viewport={{ once: true }}
                 transition={{ delay: 0.1 }}
                 className="bg-brand text-brand-foreground rounded-2xl p-8 flex items-center gap-6 shadow-lg shadow-brand/10"
               >
                 <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                    <Calendar className="w-7 h-7 text-white" />
                 </div>
                 <div>
                   <p className="text-sm font-bold text-white/80 uppercase tracking-wider mb-1">Duration</p>
                   <p className="text-3xl font-extrabold text-white">28 Days</p>
                 </div>
               </motion.div>

               <motion.div 
                 initial={{ opacity: 0, y: 20 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 viewport={{ once: true }}
                 transition={{ delay: 0.2 }}
                 className="bg-card rounded-2xl p-8 border border-border flex items-center gap-6 shadow-sm group hover:border-brand/30 transition-colors"
               >
                 <div className="w-14 h-14 rounded-full bg-secondary border border-border flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <Utensils className="w-7 h-7 text-brand" />
                 </div>
                 <div>
                   <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">Included</p>
                   <p className="text-2xl font-bold text-foreground">60+ Recipes</p>
                 </div>
               </motion.div>
            </div>
          </div>
        </section>

        {/* Expert Endorsement */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm"
        >
           <div className="grid grid-cols-1 md:grid-cols-5 items-stretch">
             <div className="md:col-span-2 relative min-h-[300px] bg-muted">
                <Image 
                  src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=800&q=80"
                  alt="Dr. Sarah Jenkins"
                  fill
                  className="object-cover grayscale-[0.2]"
                  referrerPolicy="no-referrer"
                />
             </div>
             <div className="md:col-span-3 p-10 md:p-14 flex flex-col justify-center bg-secondary/30 border-l-[6px] border-brand">
                <Quote className="w-12 h-12 text-brand/20 mb-6" />
                <p className="text-2xl md:text-4xl font-serif italic text-foreground mb-8 leading-snug">
                    "True metabolic health isn't about restriction; it's about providing the body with the precise biochemical signals it needs to thrive."
                </p>
                <div>
                  <p className="text-sm font-bold uppercase tracking-widest text-foreground">Dr. Sarah Jenkins, RD, PhD</p>
                  <p className="text-muted-foreground font-medium">Lead Clinical Dietitian, Clinical Health & Nutrition Group</p>
                </div>
             </div>
           </div>
        </motion.section>

        {/* Curriculum Elements */}
        <section className="bg-secondary/30 rounded-2xl p-8 md:p-12 border border-border">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            <div>
              <h2 className="text-3xl lg:text-4xl font-serif font-medium text-foreground mb-10 tracking-tight">Curriculum Elements</h2>
              <div className="space-y-4">
                {[
                  { icon: BookOpen, title: "Weekly Meal Guides", text: "Detailed itineraries optimized for ease of prep." },
                  { icon: ClipboardList, title: "Precision Grocery Lists", text: "Streamlined lists organized by department." },
                  { icon: Pill, title: "Targeted Supplement Guide", text: "Evidence-based recommendations for the transition phase." },
                ].map((item, i) => (
                  <div key={i} className="bg-card p-6 rounded-2xl border border-border flex gap-5 hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 rounded-full border border-brand/20 bg-brand/5 flex items-center justify-center shrink-0">
                      <item.icon className="w-6 h-6 text-brand" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold uppercase tracking-widest text-foreground mb-1">{item.title}</h4>
                      <p className="text-muted-foreground">{item.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Macronutrient Framework */}
            <div>
              <h2 className="text-3xl lg:text-4xl font-serif font-medium text-foreground mb-6 tracking-tight">Macronutrient Framework</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {[
                  { val: "30%", label: "Protein" },
                  { val: "45%", label: "Fats" },
                  { val: "25%", label: "Carbs" }
                ].map((macro, i) => (
                  <div key={i} className="bg-card p-6 rounded-2xl border border-border flex flex-col items-center text-center hover:border-brand/30 transition-colors">
                    <div className="w-20 h-20 rounded-full bg-brand flex items-center justify-center mb-5 border-4 border-brand/10">
                      <span className="text-2xl font-serif font-semibold text-brand-foreground">{macro.val}</span>
                    </div>
                    <h4 className="text-xs font-bold uppercase tracking-widest text-foreground">{macro.label}</h4>
                  </div>
                ))}
              </div>

              <div className="mt-8 p-6 bg-secondary/50 rounded-2xl border-l-[4px] border-brand shadow-sm">
                <div className="flex items-start gap-4">
                  <Info className="w-6 h-6 text-brand mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold uppercase tracking-widest text-foreground mb-1">Caloric Customization</h4>
                    <p className="text-muted-foreground leading-relaxed">
                        Adjust portion sizes based on your individual basal metabolic rate (BMR).
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}