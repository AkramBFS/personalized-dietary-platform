"use client";

import {
  Stethoscope,
  ArrowRight,
  MessageSquare,
  ClipboardList,
  ListChecks,
  Scale,
  Droplets,
  Activity,
  CheckSquare,
  CreditCard,
  CalendarCheck,
  Trophy,
  Check,
} from "lucide-react";
import { motion } from "framer-motion";

export default function NutritionConsultations() {
  return (
    <div className="pt-32 pb-24 relative overflow-hidden font-body antialiased bg-background text-foreground min-h-screen">
      <main className="max-w-6xl mx-auto px-6">
        {/* Hero Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-32 items-center relative z-10"
        >
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand/10 border border-brand/20 rounded-full text-brand text-xs font-bold uppercase tracking-widest">
              <Stethoscope className="w-4 h-4" />
              Clinical Precision
            </div>

            <h1 className="font-[Syne] text-4xl md:text-6xl font-bold text-foreground leading-tight tracking-tight">
              1-on-1 Nutrition Consultations
            </h1>

            <p className="text-lg text-muted-foreground max-w-xl leading-relaxed font-light">
              Work directly with a certified nutritionist and receive a
              personalized dietary plan built specifically for your body, health
              history, and goals.
            </p>

            <div className="pt-4">
              <a
                href="/consultations/nutritionists"
                className="inline-block focus:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded-xl"
              >
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-brand text-primary-foreground px-6 py-3 rounded-xl font-bold hover:bg-card hover:text-card-foreground transition-colors inline-flex items-center gap-2 tracking-wide shadow-[0_0_15px_rgba(61,220,151,0.2)]"
                  type="button"
                  tabIndex={-1}
                  aria-label="Book a Consultation"
                >
                  Book a Consultation
                  <ArrowRight className="w-5 h-5" />
                </motion.button>
              </a>
            </div>
          </div>

          <div className="relative h-[400px] md:h-[500px] rounded-3xl overflow-hidden shadow-2xl bg-card border border-border">
            <img
              alt="Consultation Placeholder"
              className="absolute inset-0 w-full h-full object-cover opacity-80 mix-blend-luminosity"
              src="branding/Expert-call.jpg"
            />
            <div className="absolute inset-0 bg-brand/10 mix-blend-overlay"></div>
          </div>
        </motion.section>

        {/* What a Consultation Includes */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6 }}
          className="mb-32 bg-card rounded-[2rem] border border-border p-10 md:p-14 shadow-xl"
        >
          <div className="text-center mb-14">
            <h2 className="font-[Syne] text-3xl md:text-5xl font-bold text-card-foreground mb-4 tracking-tight">
              What a Consultation Includes
            </h2>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto font-light">
              A comprehensive approach to your nutritional health, designed for
              lasting results.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <motion.div
              whileHover={{ y: -8 }}
              className="flex flex-col items-center text-center space-y-4"
            >
              <div className="w-16 h-16 rounded-2xl bg-brand/10 flex items-center justify-center text-brand mb-2 shadow-[0_0_20px_rgba(61,220,151,0.15)]">
                <MessageSquare className="w-8 h-8" />
              </div>
              <h3 className="font-[Syne] text-xl font-bold text-card-foreground">
                Private Session
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                In-depth discussion of your lifestyle, dietary habits, and
                health goals in a confidential setting.
              </p>
            </motion.div>

            <motion.div
              whileHover={{ y: -8 }}
              className="flex flex-col items-center text-center space-y-4 relative z-10"
            >
              <div className="w-16 h-16 rounded-2xl bg-brand/10 flex items-center justify-center text-brand mb-2 shadow-[0_0_20px_rgba(61,220,151,0.15)]">
                <ClipboardList className="w-8 h-8" />
              </div>
              <h3 className="font-[Syne] text-xl font-bold text-card-foreground">
                Personalized Plan
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Receive a custom dietary roadmap tailored to your specific
                biometrics and preferences.
              </p>
            </motion.div>

            <motion.div
              whileHover={{ y: -8 }}
              className="flex flex-col items-center text-center space-y-4"
            >
              <div className="w-16 h-16 rounded-2xl bg-brand/10 flex items-center justify-center text-brand mb-2 shadow-[0_0_20px_rgba(61,220,151,0.15)]">
                <ListChecks className="w-8 h-8" />
              </div>
              <h3 className="font-[Syne] text-xl font-bold text-card-foreground">
                Clear Structure
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Actionable steps, meal guidelines, and structured milestones to
                track your progress effectively.
              </p>
            </motion.div>
          </div>
        </motion.section>

        {/* How It Works & Who This Is For */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 mb-32">
          {/* How It Works */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="space-y-10"
          >
            <h2 className="font-[Syne] text-3xl md:text-4xl font-bold text-foreground border-b border-border pb-4">
              How It Works
            </h2>
            <ol className="space-y-12 relative before:absolute before:inset-y-0 before:left-[1.35rem] before:w-px before:bg-brand/20 ml-2">
              <li className="relative pl-16 flex flex-col gap-1">
                <div className="absolute left-0 top-0 w-12 h-12 rounded-full bg-card border-4 border-background flex items-center justify-center font-[Syne] text-lg font-bold text-brand">
                  1
                </div>
                <h3 className="text-base font-bold text-foreground mt-2 uppercase tracking-wider">
                  Choose
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Select a nutritionist whose expertise aligns with your health
                  goals.
                </p>
              </li>

              <li className="relative pl-16 flex flex-col gap-1">
                <div className="absolute left-0 top-0 w-12 h-12 rounded-full bg-card border-4 border-background flex items-center justify-center font-[Syne] text-lg font-bold text-brand">
                  2
                </div>
                <h3 className="text-base font-bold text-foreground mt-2 uppercase tracking-wider">
                  Book
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Schedule a convenient time for your initial 1-on-1 virtual or
                  in-person consultation.
                </p>
              </li>

              <li className="relative pl-16 flex flex-col gap-1">
                <div className="absolute left-0 top-0 w-12 h-12 rounded-full bg-card border-4 border-background flex items-center justify-center font-[Syne] text-lg font-bold text-brand">
                  3
                </div>
                <h3 className="text-base font-bold text-foreground mt-2 uppercase tracking-wider">
                  Attend
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Meet with your nutritionist to discuss your history,
                  challenges, and objectives.
                </p>
              </li>

              <li className="relative pl-16 flex flex-col gap-1">
                <div className="absolute left-0 top-0 w-12 h-12 rounded-full bg-brand border-4 border-background flex items-center justify-center font-[Syne] text-lg font-bold text-primary-foreground shadow-[0_0_15px_rgba(61,220,151,0.4)]">
                  4
                </div>
                <h3 className="text-base font-bold text-foreground mt-2 uppercase tracking-wider">
                  Receive
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Get your personalized dietary plan and begin your structured
                  journey.
                </p>
              </li>
            </ol>
          </motion.div>

          {/* Who This Is For */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="bg-card rounded-[2rem] p-10 md:p-12 flex flex-col justify-center border border-border shadow-xl"
          >
            <h2 className="font-[Syne] text-3xl md:text-4xl font-bold text-card-foreground mb-10 tracking-tight">
              Who This Is For
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div className="flex items-start gap-4">
                <Scale className="text-brand w-6 h-6 shrink-0 mt-1" />
                <div>
                  <h4 className="font-bold text-card-foreground mb-1 text-sm uppercase tracking-wide">
                    Weight Loss
                  </h4>
                  <p className="text-muted-foreground text-sm">
                    Sustainable strategies over crash diets.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <Droplets className="text-brand w-6 h-6 shrink-0 mt-1" />
                <div>
                  <h4 className="font-bold text-card-foreground mb-1 text-sm uppercase tracking-wide">
                    Hormonal Issues
                  </h4>
                  <p className="text-muted-foreground text-sm">
                    Nutritional support for balance.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <Activity className="text-brand w-6 h-6 shrink-0 mt-1" />
                <div>
                  <h4 className="font-bold text-card-foreground mb-1 text-sm uppercase tracking-wide">
                    Diabetes Mgmt
                  </h4>
                  <p className="text-muted-foreground text-sm">
                    Blood sugar stabilization plans.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <CheckSquare className="text-brand w-6 h-6 shrink-0 mt-1" />
                <div>
                  <h4 className="font-bold text-card-foreground mb-1 text-sm uppercase tracking-wide">
                    Accountability
                  </h4>
                  <p className="text-muted-foreground text-sm">
                    Ongoing support and check-ins.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Pricing & Details Cards */}
        <section className="mb-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Pricing */}
            <motion.div
              whileHover={{ y: -8 }}
              className="bg-card rounded-[2rem] border border-border p-10 shadow-xl flex flex-col justify-between min-h-[320px]"
            >
              <div>
                <div className="w-14 h-14 rounded-2xl bg-brand/10 flex items-center justify-center text-brand mb-8">
                  <CreditCard className="w-7 h-7" />
                </div>
                <h3 className="font-[Syne] text-2xl font-bold text-card-foreground mb-4">
                  Pricing & Payments
                </h3>
                <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
                  Rates are set independently by each nutritionist. Purchased as
                  a one-time package.
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-transparent border border-brand text-brand px-6 py-3.5 rounded-xl font-bold hover:bg-brand hover:text-primary-foreground transition-colors tracking-wide"
              >
                View Providers
              </motion.button>
            </motion.div>

            {/* Subscription */}
            <motion.div
              whileHover={{ y: -8 }}
              className="bg-card rounded-[2rem] border border-border p-10 shadow-xl flex flex-col justify-between min-h-[320px]"
            >
              <div>
                <div className="w-14 h-14 rounded-2xl bg-brand/10 flex items-center justify-center text-brand mb-8">
                  <CalendarCheck className="w-7 h-7" />
                </div>
                <h3 className="font-[Syne] text-2xl font-bold text-card-foreground mb-4">
                  No Subscription
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Pay only for the consultation package you need. No hidden fees
                  or recurring charges.
                </p>
              </div>
            </motion.div>

            {/* Why Packages */}
            <motion.div
              whileHover={{ y: -8 }}
              className="bg-card border border-brand/20 text-card-foreground rounded-[2rem] p-10 shadow-xl flex flex-col justify-between min-h-[320px]"
            >
              <div>
                <div className="w-14 h-14 rounded-2xl bg-brand/10 flex items-center justify-center text-brand mb-8 shadow-[0_0_20px_rgba(61,220,151,0.15)]">
                  <Trophy className="w-7 h-7" />
                </div>
                <h3 className="font-[Syne] text-2xl font-bold text-card-foreground mb-6">
                  Why Packages?
                </h3>
                <ul className="text-sm text-muted-foreground space-y-4">
                  <li className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-brand" />
                    Clear Outcomes
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-brand" />
                    Fosters Commitment
                  </li>
                  <li className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-brand" />
                    Measurable Results
                  </li>
                </ul>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
    </div>
  );
}