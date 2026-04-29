"use client";

import {
  ChevronLeft,
  ChevronRight,
  Sun,
  Sunset,
  CheckCircle2,
  CalendarX,
  MailCheck,
} from "lucide-react";

export default function ScheduleConsultation() {
  return (
    <main className="flex-grow pt-12 pb-24 px-6 max-w-7xl mx-auto w-full font-sans">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
        {/* Left Column: Content & Selection */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          {/* Header Section */}
          <div className="flex flex-col gap-2">
            <h1 className="font-serif text-4xl md:text-5xl font-bold tracking-tight text-foreground">
              Schedule Your Consultation
            </h1>
            <p className="text-lg text-muted-foreground">
              You're booking a private 1-on-1 session with a certified
              nutritionist.
            </p>
          </div>

          {/* Provider Card */}
          <section className="bg-card rounded-2xl border border-border p-6 flex flex-col sm:flex-row gap-6 items-start shadow-sm">
            <div className="w-24 h-24 rounded-full overflow-hidden flex-shrink-0 border border-border">
              <img
                alt="Sarah Jenkins, MS, RDN"
                className="w-full h-full object-cover"
                src="https://placehold.co/150x150/png"
              />
            </div>
            <div className="flex flex-col w-full">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-3">
                <div>
                  <h2 className="font-serif text-2xl font-bold text-foreground">
                    Sarah Jenkins, MS, RDN
                  </h2>
                  <p className="text-muted-foreground font-medium mt-1">
                    Lead Clinical Dietitian
                  </p>
                </div>
                <button className="text-sm font-semibold text-primary border border-primary rounded-lg px-4 py-2 hover:bg-primary/5 transition-colors w-full sm:w-auto">
                  Change Nutritionist
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="bg-muted text-foreground text-xs font-bold px-3 py-1.5 rounded-full">
                  Hormonal Health
                </span>
                <span className="bg-muted text-foreground text-xs font-bold px-3 py-1.5 rounded-full">
                  Weight Loss
                </span>
                <span className="bg-muted text-foreground text-xs font-bold px-3 py-1.5 rounded-full">
                  Metabolic Disorders
                </span>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Sarah specializes in evidence-based nutritional strategies for
                complex metabolic conditions, focusing on sustainable lifestyle
                modifications and targeted medical nutrition therapy.
              </p>
            </div>
          </section>

          {/* Scheduler Section */}
          <section className="flex flex-col gap-4 mt-2">
            <h3 className="font-serif text-2xl font-bold text-foreground">
              Choose a Time Slot
            </h3>
            <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
              {/* Date Selector */}
              <div className="border-b border-border p-4 flex items-center justify-between bg-muted">
                <button className="p-2 hover:bg-accent rounded-full transition-colors text-muted-foreground">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="flex gap-4 overflow-x-auto py-2 no-scrollbar px-4 w-full justify-center">
                  <div className="flex flex-col items-center justify-center w-14 h-14 rounded-full cursor-pointer hover:bg-accent transition-colors">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      Mon
                    </span>
                    <span className="text-lg font-bold text-foreground">12</span>
                  </div>
                  {/* Active Selected Date */}
                  <div className="flex flex-col items-center justify-center w-14 h-14 rounded-full cursor-pointer bg-primary text-primary-foreground shadow-md">
                    <span className="text-[10px] font-bold text-primary-foreground/80 uppercase tracking-wider">
                      Tue
                    </span>
                    <span className="text-lg font-bold text-primary-foreground">13</span>
                  </div>
                  <div className="flex flex-col items-center justify-center w-14 h-14 rounded-full cursor-pointer hover:bg-accent transition-colors">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      Wed
                    </span>
                    <span className="text-lg font-bold text-foreground">14</span>
                  </div>
                  <div className="flex flex-col items-center justify-center w-14 h-14 rounded-full cursor-pointer hover:bg-accent transition-colors">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      Thu
                    </span>
                    <span className="text-lg font-bold text-foreground">15</span>
                  </div>
                  <div className="flex flex-col items-center justify-center w-14 h-14 rounded-full cursor-not-allowed opacity-40">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      Fri
                    </span>
                    <span className="text-lg font-bold text-foreground">16</span>
                  </div>
                </div>
                <button className="p-2 hover:bg-accent rounded-full transition-colors text-muted-foreground">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* Time Slots */}
              <div className="p-6 flex flex-col gap-8">
                {/* Morning */}
                <div>
                  <h4 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                    <Sun className="w-5 h-5 text-muted-foreground" /> Morning
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <button className="py-3 px-4 rounded-lg border border-border text-sm font-semibold text-foreground hover:border-primary hover:text-primary transition-colors text-center">
                      09:00 AM
                    </button>
                    <button className="py-3 px-4 rounded-lg border border-border text-sm font-semibold text-foreground hover:border-primary hover:text-primary transition-colors text-center">
                      09:30 AM
                    </button>
                    <button className="py-3 px-4 rounded-lg border border-border text-sm font-semibold text-foreground hover:border-primary hover:text-primary transition-colors text-center">
                      10:00 AM
                    </button>
                    <button className="py-3 px-4 rounded-lg border border-border text-sm font-semibold text-muted-foreground bg-muted cursor-not-allowed line-through text-center">
                      11:00 AM
                    </button>
                  </div>
                </div>

                {/* Afternoon */}
                <div>
                  <h4 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                    <Sunset className="w-5 h-5 text-muted-foreground" /> Afternoon
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {/* Active Selected Time */}
                    <button className="py-3 px-4 rounded-lg bg-primary text-sm font-semibold text-primary-foreground shadow-md text-center">
                      01:00 PM
                    </button>
                    <button className="py-3 px-4 rounded-lg border border-border text-sm font-semibold text-foreground hover:border-primary hover:text-primary transition-colors text-center">
                      01:30 PM
                    </button>
                    <button className="py-3 px-4 rounded-lg border border-border text-sm font-semibold text-foreground hover:border-primary hover:text-primary transition-colors text-center">
                      02:30 PM
                    </button>
                    <button className="py-3 px-4 rounded-lg border border-border text-sm font-semibold text-foreground hover:border-primary hover:text-primary transition-colors text-center">
                      03:00 PM
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Summary & Payment */}
        <div className="lg:col-span-4 flex flex-col gap-8">
          <div className="bg-card rounded-2xl border border-border p-6 shadow-sm sticky top-8 flex flex-col gap-6">
            <h3 className="font-serif text-xl font-bold text-foreground border-b border-border pb-4">
              Consultation Overview
            </h3>

            <ul className="flex flex-col gap-4">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-foreground flex-shrink-0 mt-0.5" />
                <span className="text-foreground text-sm font-medium">
                  Live 1-on-1 online consultation (45 min)
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-foreground flex-shrink-0 mt-0.5" />
                <span className="text-foreground text-sm font-medium">
                  In-depth medical & lifestyle assessment
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-foreground flex-shrink-0 mt-0.5" />
                <span className="text-foreground text-sm font-medium">
                  Personalized dietary plan delivery
                </span>
              </li>
            </ul>

            <div className="bg-muted p-5 rounded-xl border border-border mt-2">
              <div className="flex justify-between items-end mb-1">
                <span className="text-sm font-bold text-muted-foreground">
                  Total Due Today
                </span>
                <span className="font-serif text-3xl text-foreground font-bold">
                  $150
                </span>
              </div>
              <p className="text-xs text-muted-foreground text-right mt-1">
                One-time payment. No hidden fees.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <button className="bg-button-primary bg-btn-primary text-button-primary-foreground font-bold text-base py-4 px-6 rounded-xl w-full hover:opacity-90 transition-all shadow-sm">
                Confirm Time & Continue to Payment
              </button>
              <p className="text-xs text-muted-foreground text-center mt-2">
                By continuing, you agree to our{" "}
                <a className="underline hover:text-foreground font-medium cursor-pointer">
                  cancellation policy
                </a>
                .
              </p>
            </div>

            <div className="border-t border-border pt-6 mt-2 flex flex-col gap-4">
              <div className="flex gap-3 items-start">
                <CalendarX className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Rescheduling is permitted up to 24 hours before your scheduled
                  time.
                </p>
              </div>
              <div className="flex gap-3 items-start">
                <MailCheck className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Your personalized plan will be delivered within 48 hours
                  post-consultation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
