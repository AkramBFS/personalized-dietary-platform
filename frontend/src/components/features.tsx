import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Sparkles } from "lucide-react";
import { CalendarCheck } from "lucide-react";
import { ClipboardList } from "lucide-react";
import { ReactNode } from "react";

export default function Features() {
  return (
    <section className="bg-[#F5EEE4] dark:bg-[#12161b] py-16 md:py-24 transition-colors duration-300">
      <div className="@container mx-auto max-w-6xl px-6">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-700 dark:text-emerald-500">
            Understanding the Problem
          </p>
          <h2 className="font-display mt-4 text-balance text-3xl font-semibold text-[#052B34] dark:text-white lg:text-4xl">
            Dietary and metabolic issues are solvable with research-driven,
            personalized monitoring.
          </h2>
        </div>

        <div className="@min-4xl:max-w-full @min-4xl:grid-cols-3 mx-auto mt-10 grid max-w-3xl gap-6 md:mt-14 md:max-w-5xl md:grid-cols-3">
          <Card className="group border-0 bg-white/80 dark:bg-[#1a2027]/80 text-left shadow-[0_18px_45px_rgba(15,41,54,0.15)] dark:shadow-none transition-all duration-300">
            <CardHeader className="pb-3">
              <CardDecorator>
                <CalendarCheck className="size-6" aria-hidden />
              </CardDecorator>

              <h3 className="mt-6 text-lg font-semibold text-[#052B34] dark:text-white">
                Obesity
              </h3>
            </CardHeader>

            <CardContent className="mt-3">
              <p className="text-sm text-slate-700 dark:text-slate-300">
                Obesity disrupts metabolic balance and raises the risk of
                chronic disease. Continuous nutrition tracking supports
                sustainable weight management.
              </p>
            </CardContent>
          </Card>

          <Card className="group border-0 bg-white/80 dark:bg-[#1a2027]/80 text-left shadow-[0_18px_45px_rgba(15,41,54,0.15)] dark:shadow-none transition-all duration-300">
            <CardHeader className="pb-3">
              <CardDecorator>
                <ClipboardList className="size-6" aria-hidden />
              </CardDecorator>

              <h3 className="mt-6 text-lg font-semibold text-[#052B34] dark:text-white">
                Metabolic issues
              </h3>
            </CardHeader>

            <CardContent>
              <p className="mt-3 text-sm text-slate-700 dark:text-slate-300">
                Conditions like insulin resistance require precise, consistent
                dietary choices. Data-informed plans help stabilize energy and
                biomarkers.
              </p>
            </CardContent>
          </Card>

          <Card className="group border-0 bg-white/80 dark:bg-[#1a2027]/80 text-left shadow-[0_18px_45px_rgba(15,41,54,0.15)] dark:shadow-none transition-all duration-300">
            <CardHeader className="pb-3">
              <CardDecorator>
                <Sparkles className="size-6" aria-hidden />
              </CardDecorator>

              <h3 className="mt-6 text-lg font-semibold text-[#052B34] dark:text-white">
                Athletic performance
              </h3>
            </CardHeader>

            <CardContent>
              <p className="mt-3 text-sm text-slate-700 dark:text-slate-300">
                High-performing athletes need adaptive nutrition strategies.
                Monitoring intake and recovery keeps performance and health in
                sync.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}

const CardDecorator = ({ children }: { children: ReactNode }) => (
  <div className="mask-radial-from-40% mask-radial-to-60% relative mx-auto size-28 duration-200 [--color-border:color-mix(in_oklab,var(--color-emerald-900)25%,transparent)] group-hover:[--color-border:color-mix(in_oklab,var(--color-emerald-900)40%,transparent)]">
    <div
      aria-hidden
      className="absolute inset-0 bg-[linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] bg-[size:24px_24px] dark:opacity-50"
    />

    <div className="bg-[#052B34] dark:bg-emerald-950 absolute inset-0 m-auto flex size-11 items-center justify-center border-l border-t text-emerald-100">
      {children}
    </div>
  </div>
);
