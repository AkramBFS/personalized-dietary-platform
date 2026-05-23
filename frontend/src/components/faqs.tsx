"use client";

import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { DynamicIcon, type IconName } from "lucide-react/dynamic";
import { Mail, ArrowRight } from "lucide-react";
import Link from "next/link";

type FAQItem = {
  id: string;
  icon: IconName;
  question: string;
  answer: string;
};

const faqItems: FAQItem[] = [
  {
    id: "item-1",
    icon: "brain",
    question: "How does the AI calorie estimation work?",
    answer:
      "You can upload an image of your meal, and our AI system analyzes it using computer vision to recognize food items and estimate portion sizes. The system then calculates approximate calorie values based on nutritional databases. Results are designed to support awareness and self-monitoring, not replace professional advice.",
  },
  {
    id: "item-2",
    icon: "user-check",
    question: "How do personalized nutrition consultations work?",
    answer:
      "After creating an account and completing your health profile, you can book an online consultation with a certified nutritionist. Based on your medical history, lifestyle, and goals, a personalized dietary plan is created and monitored through scheduled follow-ups.",
  },
  {
    id: "item-3",
    icon: "credit-card",
    question: "How do subscriptions and payments work?",
    answer:
      "Each nutrition plan has a defined duration and price. Payment must be completed to access personalized consultations and follow-up services. Seasonal or limited-period programs (such as summer or Ramadan plans) may also be available depending on the period.",
  },
  {
    id: "item-4",
    icon: "activity",
    question: "Can I use the platform without a personalized plan?",
    answer:
      "Yes. Users can access the AI calorie tracking feature independently for self-monitoring. This is especially useful for maintaining weight after completing a structured program or for those enrolled in flexible or seasonal plans.",
  },
  {
    id: "item-5",
    icon: "book-open",
    question: "What additional resources are available?",
    answer:
      "The platform includes educational blogs, nutrition news, healthy lifestyle content, and community features where users can share experiences and testimonials. You can also subscribe to newsletters for updates and wellness tips.",
  },
];

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 260,
      damping: 20,
    },
  },
} as const;

export default function FAQsThree() {
  return (
    <section
      id="faq-section"
      className="relative z-10 overflow-hidden bg-background py-24"
    >
      {/* Background ambient glow */}
      <div className="absolute left-1/2 top-0 -z-10 h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-primary/5 blur-[120px]" />

      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        <div className="flex flex-col gap-16 lg:flex-row lg:gap-20">
          {/* Left Column: Context & Sticky header */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="lg:w-2/5"
          >
            <div className="sticky top-24">
              <div className="mb-6 inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary">
                Support & Info
              </div>

              <h2 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl mb-6">
                Got questions? <br />
                <span className="text-muted-foreground">
                  We've got answers.
                </span>
              </h2>

              <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                Everything you need to know about our AI tracking, personalized
                consultations, and how our platform works.
              </p>

              <div className="flex flex-col gap-4 sm:flex-row lg:flex-col xl:flex-row">
                <Link
                  href="/faq"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Mail className="size-4" />
                  See full FAQ page
                </Link>
                <Link
                  href="/client/support"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-input bg-background px-6 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  Contact support
                  <ArrowRight className="size-4" />
                </Link>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Accordion Items */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            className="lg:w-3/5"
          >
            <Accordion type="single" collapsible className="w-full space-y-4">
              {faqItems.map((item) => (
                <motion.div key={item.id} variants={itemVariants}>
                  <AccordionItem
                    value={item.id}
                    className="group rounded-2xl border border-border/60 bg-card px-6 py-2 shadow-sm transition-all duration-200 hover:border-primary/40 hover:shadow-md data-[state=open]:border-primary/50 data-[state=open]:bg-primary/[0.02]"
                  >
                    <AccordionTrigger className="hover:no-underline py-5 text-left">
                      <div className="flex items-center gap-5">
                        {/* Interactive Icon Container */}
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-primary/10 bg-primary/5 text-primary transition-all duration-300 group-hover:bg-primary group-hover:text-primary-foreground group-data-[state=open]:bg-primary group-data-[state=open]:text-primary-foreground group-data-[state=open]:rotate-3">
                          <DynamicIcon name={item.icon} className="size-5" />
                        </div>
                        <span className="text-[17px] font-semibold text-foreground group-data-[state=open]:text-primary transition-colors">
                          {item.question}
                        </span>
                      </div>
                    </AccordionTrigger>

                    <AccordionContent className="pb-6 pt-2">
                      <div className="pl-[68px] pr-4">
                        {" "}
                        {/* Aligns perfectly with the text next to the 48px icon (48 + 20 gap) */}
                        <p className="text-base text-muted-foreground leading-relaxed">
                          {item.answer}
                        </p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </motion.div>
              ))}
            </Accordion>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
