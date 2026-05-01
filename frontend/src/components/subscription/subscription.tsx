"use client";

import {
  CheckCircle,
  Zap,
  Sparkles,
  LineChart,
  MessageSquare,
  Activity,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

type FaqItem = {
  id: string;
  question: string;
  answer: string;
};

export default function SubscriptionPlans() {
  const faqItems: FaqItem[] = [
    {
      id: "item-1",

      question: "Is my payment information secure?",
      answer:
        "Absolutely. We use industry-standard 256-bit encryption and partner with top-tier payment processors like Stripe. Your credit card details are never stored on our servers, ensuring bank-level security for every transaction.",
    },
    {
      id: "item-2",

      question: "Can I cancel my subscription at any time?",
      answer:
        "Yes, you can cancel or pause your subscription at any moment directly from your dashboard. There are no hidden fees or lock-in contracts. You will retain full access to your Pro features until the end of your current billing cycle.",
    },
    {
      id: "item-3",

      question: "What payment methods do you accept?",
      answer:
        "We accept all major credit and debit cards, including Visa, MasterCard, and American Express. For a faster checkout experience, we also support secure digital wallets like Apple Pay and Google Pay.",
    },
    {
      id: "item-4",

      question: "How is my personal health data protected?",
      answer:
        "Your privacy is our highest priority. All personal and nutritional data is strictly confidential, fully encrypted at rest and in transit, and never sold to third parties. We fully comply with global data protection regulations.",
    },
  ];

  return (
    <div className="pt-32 pb-24 relative overflow-hidden font-body antialiased bg-gradient-to-br from-[#052023] via-[#01181D] to-[#052025]">
      {/* Background decorative "S" aura */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-brand/5 rounded-full blur-[120px] pointer-events-none -z-10"></div>

      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-4xl mx-auto px-6 text-center mb-24 relative z-10"
      >
        <h1 className="font-[Syne] text-5xl md:text-7xl font-bold tracking-tight mb-8 text-white leading-tight">
          Subscription{" "}
          <span className="bg-gradient-to-r from-[#61dda3] to-[#5dd9d8] bg-clip-text text-transparent">
            Plans
          </span>
        </h1>
        <p className="text-xl md:text-2xl text-muted-foreground font-light mb-6 max-w-2xl mx-auto leading-relaxed">
          Choose how much intelligence and guidance you want in your nutrition
          journey.
        </p>
        <p className="text-sm uppercase tracking-widest text-brand font-medium">
          Start free, upgrade when you're ready — no pressure, no lock-in.
        </p>
      </motion.section>

      {/* What we provide Section */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.6 }}
        className="max-w-4xl mx-auto px-6 text-center mb-32 relative z-10"
      >
        <h2 className="font-[Syne] text-4xl md:text-6xl font-bold tracking-tight mb-12 text-white leading-tight">
          What we{" "}
          <span className="bg-gradient-to-r from-[#61dda3] to-[#5dd9d8] bg-clip-text text-transparent">
            provide
          </span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            whileHover={{ y: -8 }}
            className="bg-card p-8 rounded-3xl border border-border flex flex-col items-center text-center shadow-lg "
          >
            <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center text-brand mb-6 shadow-brand">
              <Zap className="w-8 h-8" />
            </div>
            <h3 className="font-[Syne] text-xl font-bold mb-3 text-white">
              AI Estimation
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Instantly estimate calories and macros from photos with our
              advanced AI model.
            </p>
          </motion.div>

          <motion.div
            whileHover={{ y: -8 }}
            className="bg-card p-8 rounded-3xl border border-border flex flex-col items-center text-center shadow-lg relative overflow-hidden md:scale-105 z-10 "
          >
            <div className="absolute inset-0 bg-gradient-to-b from-[#61dda3]/10 to-transparent pointer-events-none"></div>
            <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center text-brand mb-6 shadow-brand relative z-10">
              <Sparkles className="w-8 h-8" />
            </div>
            <h3 className="font-[Syne] text-xl font-bold mb-3 text-white relative z-10">
              Smart Assistant
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed relative z-10">
              Your personal AI nutritionist, available 24/7 for guidance and
              meal planning.
            </p>
          </motion.div>

          <motion.div
            whileHover={{ y: -8 }}
            className="bg-card p-8 rounded-3xl border border-border flex flex-col items-center text-center shadow-lg "
          >
            <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center text-brand mb-6 shadow-brand">
              <Activity className="w-8 h-8" />
            </div>
            <h3 className="font-[Syne] text-xl font-bold mb-3 text-white">
              Deep Analytics
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Uncover trends in your nutrition with detailed, easy-to-read
              charts and reports.
            </p>
          </motion.div>
        </div>
      </motion.section>

      {/* Pricing Cards */}
      <section className="max-w-6xl mx-auto px-6 mb-32">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          {/* Free Plan */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              opacity: { duration: 0.6, delay: 0.2 },
              x: { duration: 0.6, delay: 0.2 },
            }}
            whileHover={{ y: -8 }}
            className="bg-muted rounded-[2rem] p-10 border border-border/60 hover:border-border transition-colors duration-300 shadow-xl"
          >
            <div className="mb-8">
              <span className="px-4 py-1.5 rounded-full bg-accent text-white/90 text-xs font-bold uppercase tracking-wider mb-6 inline-block">
                Starter
              </span>
              <h3 className="font-[Syne] text-3xl font-bold text-white mb-2">
                Free Plan
              </h3>
              <p className="text-white/60 text-sm">
                For learning, awareness, and getting started
              </p>
            </div>

            <div className="mb-10 pb-10 border-b border-border">
              <div className="text-4xl font-[Syne] font-bold text-white">
                Free
              </div>
              <div className="text-sm text-white/60 mt-1">— forever</div>
            </div>

            <ul className="space-y-6 mb-10">
              <li className="flex items-start gap-4">
                <CheckCircle className="text-brand w-6 h-6 shrink-0" />
                <span className="text-sm text-white/80">Manual tracking</span>
              </li>
              <li className="flex items-start gap-4">
                <CheckCircle className="text-brand w-6 h-6 shrink-0" />
                <span className="text-sm text-white/80">
                  Educational content
                </span>
              </li>
              <li className="flex items-start gap-4">
                <CheckCircle className="text-brand w-6 h-6 shrink-0" />
                <span className="text-sm text-white/80">Limited community</span>
              </li>
            </ul>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-4 rounded-xl border border-border text-white font-medium hover:bg-accent transition-colors"
            >
              Start Free
            </motion.button>
          </motion.div>

          {/* Pro Plan */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              opacity: { duration: 0.6, delay: 0.2 },
              x: { duration: 0.6, delay: 0.2 },
            }}
            whileHover={{ y: -8 }}
            className="bg-card rounded-[2rem] p-10 relative overflow-hidden shadow-[0_30px_60px_rgba(5,43,52,0.4)] md:scale-105 z-10 border border-brand/30"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand/10 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

            <div className="mb-8 relative z-10">
              <span className="px-4 py-1.5 rounded-full bg-brand/20 text-brand text-xs font-bold uppercase tracking-wider mb-6 inline-block">
                Recommended
              </span>
              <h3 className="font-[Syne] text-3xl font-bold text-white mb-2">
                Pro Plan
              </h3>
              <p className="text-muted-foreground text-sm">
                For autonomy, precision, and intelligent support
              </p>
            </div>

            <div className="mb-10 pb-10 border-b border-border relative z-10">
              <div className="text-4xl font-[Syne] font-bold text-white">
                $19
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                Monthly subscription
              </div>
            </div>

            <ul className="space-y-6 mb-10 relative z-10">
              <li className="flex items-start gap-4">
                <Zap className="text-brand w-6 h-6 shrink-0" />
                <span className="text-sm text-white">
                  AI image calorie estimation
                </span>
              </li>
              <li className="flex items-start gap-4">
                <Sparkles className="text-brand w-6 h-6 shrink-0" />
                <span className="text-sm text-white">
                  AI nutrition assistant
                </span>
              </li>
              <li className="flex items-start gap-4">
                <LineChart className="text-brand w-6 h-6 shrink-0" />
                <span className="text-sm text-white">
                  Advanced insights & analytics
                </span>
              </li>
              <li className="flex items-start gap-4">
                <MessageSquare className="text-brand w-6 h-6 shrink-0" />
                <span className="text-sm text-white">
                  Full community access
                </span>
              </li>
            </ul>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-[#61dda3] to-[#5dd9d8] text-[#00161c] font-bold shadow-[0_0_15px_rgba(97,221,163,0.3)] hover:shadow-[0_0_25px_rgba(97,221,163,0.5)] transition-all relative z-10"
            >
              Upgrade to Pro
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.6 }}
        className="max-w-4xl mx-auto px-6 mb-16 relative z-10"
      >
        <div className="bg-card rounded-[2rem] p-10 md:p-12 shadow-xl border border-border/50">
          <h2 className="font-[Syne] text-3xl font-bold mb-8 text-center text-brand">
            Frequently Asked Questions
          </h2>
          <Accordion type="single" collapsible className="w-full space-y-4">
            {faqItems.map((item) => (
              <AccordionItem
                key={item.id}
                value={item.id}
                className="bg-accent rounded-xl overflow-hidden border-none px-6 transition-colors hover:bg-accent/80"
              >
                <AccordionTrigger className="hover:no-underline py-6">
                  <span className="font-bold text-white text-left text-[15px]">
                    {item.question}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pb-6">
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {item.answer}
                  </p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </motion.section>
    </div>
  );
}
