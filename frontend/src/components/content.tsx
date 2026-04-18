import { Shredder, Lock, Sparkles, Zap } from "lucide-react";

export default function ContentSection() {
  return (
    <section className="bg-background py-16 md:py-24">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-16 px-6 md:flex-row md:items-stretch">
        {/* Left: AI calorie estimation visual */}
        <div className="order-2 flex w-full justify-center md:order-1 md:w-1/2">
          <div className="relative inline-flex items-center justify-center">
            <div className="absolute -left-10 -top-10 h-32 w-32 rounded-full bg-emerald-100/60" />
            <div className="absolute -right-8 bottom-0 h-24 w-24 rounded-full bg-emerald-200/70" />

            <div className="relative flex h-72 w-72 items-center justify-center rounded-full bg-[#052B34] shadow-[0_24px_80px_rgba(15,41,54,0.4)]">
              <img
                className="h-52 w-52 rounded-full border-4 border-emerald-400 object-cover"
                src="branding/expert-call.jpg"
                alt="AI-calculated meal"
                loading="lazy"
              />

              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-white dark:bg-emerald-950 px-4 py-1 text-xs font-semibold text-[#052B34] dark:text-emerald-100 shadow-md border dark:border-emerald-800">
                AI Calorie Estimation
              </div>

              <div className="absolute -left-8 top-16 rounded-full bg-white/95 dark:bg-emerald-900 px-3 py-1 text-[11px] font-medium text-[#052B34] dark:text-emerald-100 shadow-md border dark:border-emerald-800/50">
                + 420 kcal • Lunch
              </div>

              <div className="absolute -right-8 bottom-12 rounded-full bg-[#052B34] dark:bg-emerald-950 px-3 py-1 text-[11px] font-medium text-emerald-50 shadow-md ring-1 ring-emerald-400/50">
                Fiber • Protein • Balance
              </div>
            </div>
          </div>
        </div>

        {/* Right: copy & feature list */}
        <div className="order-1 w-full md:order-2 md:w-1/2">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-700 dark:text-emerald-500">
            AI Calorie Estimation
          </p>
          <h2 className="font-display mt-4 text-3xl font-semibold text-[#052B34] dark:text-white lg:text-4xl">
            Snap, upload, and let AI decode your plate.
          </h2>
          <p className="mt-4 text-sm text-slate-700 dark:text-slate-300 md:text-base">
            Upload a photo of your meal and instantly receive estimated calories
            and macros. Our system combines visual recognition with
            nutrition-science heuristics to support everyday decision-making.
          </p>

          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-sm font-semibold text-[#052B34] dark:text-white">
                  Fast & responsive
                </h3>
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-400">
                Get near-instant estimates so you can adjust portions in real
                time before you eat.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Shredder className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-sm font-semibold text-[#052B34] dark:text-white">
                  Confidential
                </h3>
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-400">
                Your photos and health data are encrypted and stored with strict
                privacy controls.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-sm font-semibold text-[#052B34] dark:text-white">
                  Secure by design
                </h3>
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-400">
                Role-based access and modern security practices keep
                practitioner and patient data protected.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-sm font-semibold text-[#052B34] dark:text-white">
                  AI-guided insights
                </h3>
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-400">
                Intelligent nudges and summaries help bridge the gap between
                clinical plans and real choices.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
