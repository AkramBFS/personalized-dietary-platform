"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";
import {
  CheckCircle,
  Zap,
  Sparkles,
  LineChart,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";
import { getSubscriptionAmount } from "@/lib/payment";

export default function SubscriptionCards() {
  const prices = useMemo(
    () => ({
      monthly: getSubscriptionAmount("monthly").toFixed(2),
      yearly: getSubscriptionAmount("yearly").toFixed(2),
    }),
    [],
  );

  return (
    <section className="relative overflow-hidden bg-background py-24">
      {/* Background ambient glow */}
      <div className="absolute left-1/2 top-1/2 -z-10 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-[120px] pointer-events-none" />

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid lg:grid-cols-3 gap-6 items-stretch">
          {/* Free Plan Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              opacity: { duration: 0.6, delay: 0.1 },
              y: { duration: 0.6, delay: 0.1 },
            }}
            whileHover={{ y: -8 }}
            className="bg-muted rounded-[2rem] p-7 border border-border/60 hover:border-border transition-colors duration-300 shadow-xl flex flex-col justify-between"
          >
            <div>
              <div className="mb-8">
                <span className="px-4 py-1.5 rounded-full bg-accent text-accent-foreground text-xs font-bold uppercase tracking-wider mb-4 inline-block">
                  Starter
                </span>
                <h3 className="font-[Syne] text-2xl font-bold text-foreground mb-1">
                  Free Plan
                </h3>
                <p className="text-muted-foreground text-sm">
                  For learning and getting started
                </p>
              </div>

              <div className="mb-8 pb-6 border-b border-border">
                <div className="text-3xl font-[Syne] font-bold text-foreground">
                  Free
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Forever
                </div>
              </div>

              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <CheckCircle className="text-brand w-5 h-5 shrink-0" />
                  <span className="text-sm text-foreground/80">
                    Manual tracking
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="text-brand w-5 h-5 shrink-0" />
                  <span className="text-sm text-foreground/80">
                    Educational content
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="text-brand w-5 h-5 shrink-0" />
                  <span className="text-sm text-foreground/80">
                    Limited community
                  </span>
                </li>
              </ul>
            </div>

            <Link href="/subscription" className="w-full mt-auto block">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3 rounded-xl border border-border text-foreground font-medium hover:bg-accent transition-colors"
              >
                Start Free
              </motion.button>
            </Link>
          </motion.div>

          {/* Yearly Pro Card (Best Value) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              opacity: { duration: 0.6, delay: 0.2 },
              y: { duration: 0.6, delay: 0.2 },
            }}
            whileHover={{ y: -8 }}
            className="bg-card rounded-[2rem] p-7 relative overflow-hidden shadow-brand lg:scale-105 z-20 border border-brand/30 flex flex-col justify-between"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand/10 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />

            <div className="relative z-10">
              <div className="mb-8">
                <span className="px-4 py-1.5 rounded-full bg-brand/20 text-brand text-xs font-bold uppercase tracking-wider mb-4 inline-block">
                  Best Value
                </span>
                <h3 className="font-[Syne] text-2xl font-bold text-foreground mb-1">
                  Yearly Pro
                </h3>
                <p className="text-muted-foreground text-sm">
                  Precision & intelligent support
                </p>
              </div>

              <div className="mb-8 pb-6 border-b border-border">
                <div className="text-3xl font-[Syne] font-bold text-foreground">
                  ${prices.yearly}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Billed yearly (Save 15%)
                </div>
              </div>

              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <Zap className="text-brand w-5 h-5 shrink-0" />
                  <span className="text-sm text-foreground">
                    AI image calorie estimation
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Sparkles className="text-brand w-5 h-5 shrink-0" />
                  <span className="text-sm text-foreground">
                    AI nutrition assistant
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <LineChart className="text-brand w-5 h-5 shrink-0" />
                  <span className="text-sm text-foreground">
                    Advanced insights
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <MessageSquare className="text-brand w-5 h-5 shrink-0" />
                  <span className="text-sm text-foreground">
                    Full community access
                  </span>
                </li>
              </ul>
            </div>

            <Link
              href="/subscription"
              className="w-full mt-auto block relative z-10"
            >
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-4 rounded-xl bg-button-primary text-button-primary-foreground bg-brand font-bold shadow-brand hover:shadow-brand/50 transition-all inline-flex items-center justify-center"
              >
                Get Yearly Pro
              </motion.button>
            </Link>
          </motion.div>

          {/* Monthly Pro Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              opacity: { duration: 0.6, delay: 0.3 },
              y: { duration: 0.6, delay: 0.3 },
            }}
            whileHover={{ y: -8 }}
            className="bg-muted rounded-[2rem] p-7 border border-border/60 hover:border-border transition-colors duration-300 shadow-xl flex flex-col justify-between"
          >
            <div className="relative z-10">
              <div className="mb-8">
                <span className="px-4 py-1.5 rounded-full bg-accent text-accent-foreground text-xs font-bold uppercase tracking-wider mb-4 inline-block">
                  Flexible
                </span>
                <h3 className="font-[Syne] text-2xl font-bold text-foreground mb-1">
                  Monthly Pro
                </h3>
                <p className="text-muted-foreground text-sm">
                  Precision & intelligent support
                </p>
              </div>

              <div className="mb-8 pb-6 border-b border-border">
                <div className="text-3xl font-[Syne] font-bold text-foreground">
                  ${prices.monthly}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Monthly subscription
                </div>
              </div>

              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <Zap className="text-brand w-5 h-5 shrink-0" />
                  <span className="text-sm text-foreground">
                    AI image calorie estimation
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Sparkles className="text-brand w-5 h-5 shrink-0" />
                  <span className="text-sm text-foreground">
                    AI nutrition assistant
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <LineChart className="text-brand w-5 h-5 shrink-0" />
                  <span className="text-sm text-foreground">
                    Advanced insights
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <MessageSquare className="text-brand w-5 h-5 shrink-0" />
                  <span className="text-sm text-foreground">
                    Full community access
                  </span>
                </li>
              </ul>
            </div>

            <Link
              href="/subscription"
              className="w-full mt-auto block relative z-10"
            >
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3 rounded-xl border border-brand/50 text-foreground font-medium hover:bg-brand/10 transition-colors inline-flex items-center justify-center"
              >
                Get Monthly Pro
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
