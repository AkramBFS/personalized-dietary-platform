"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import {
  Calendar,
  Camera,
  CheckCircle2,
  Flame,
  Info,
  ListTodo,
  Loader2,
  Plus,
  Star,
  Target,
} from "lucide-react";
import Link from "next/link";
import {
  ClientConsultation,
  ClientUserPlan,
  formatDateParam,
  getClientConsultations,
  getClientProfile,
  getClientProgress,
  getClientUserPlans,
} from "@/lib/client";
import { formatClientName } from "@/lib/utils";

interface ChartPoint {
  date: string;
  name: string;
  intake: number;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function getPlanTitle(plan: ClientUserPlan | null): string {
  return plan?.plan?.title ?? plan?.plan_title ?? "No Active Plan";
}

export default function ClientDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [profileName, setProfileName] = useState("there");
  const [activePlan, setActivePlan] = useState<ClientUserPlan | null>(null);
  const [nextConsultation, setNextConsultation] =
    useState<ClientConsultation | null>(null);
  const [todayIntake, setTodayIntake] = useState(0);
  const [todayMacros, setTodayMacros] = useState({
    protein: 0,
    carbs: 0,
    fats: 0,
  });
  const [dailyTarget, setDailyTarget] = useState<number | null>(null);
  const [goalAchieved, setGoalAchieved] = useState(false);
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [showTargetsReminder, setShowTargetsReminder] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchDashboardData = async () => {
      const today = new Date();
      const startDate = formatDateParam(addDays(today, -6));
      const endDate = formatDateParam(today);

      try {
        const [profile, plans, progress, consultations] = await Promise.all([
          getClientProfile(),
          getClientUserPlans().catch(() => []),
          getClientProgress(startDate, endDate).catch(() => []),
          getClientConsultations().catch(() => []),
        ]);

        if (!isMounted) return;

        setProfileName(formatClientName(profile.username));

        const currentPlan =
          plans.find((plan) => plan.status === "active") ?? null;
        setActivePlan(currentPlan);

        const upcoming =
          consultations
            .filter((consultation) => consultation.status === "scheduled")
            .sort(
              (a, b) =>
                new Date(
                  `${a.appointment_date}T${a.start_time ?? "00:00"}`,
                ).getTime() -
                new Date(
                  `${b.appointment_date}T${b.start_time ?? "00:00"}`,
                ).getTime(),
            )[0] ?? null;
        setNextConsultation(upcoming);

        const todayStr = formatDateParam(today);
        const progressByDate = new Map(
          progress.map((log) => [log.log_date, log]),
        );
        const todayLog = progressByDate.get(todayStr);
        const resolvedTargets = {
          calories:
            todayLog?.target_calories ?? profile.target_calories ?? null,
          protein: todayLog?.target_protein ?? profile.target_protein ?? null,
          carbs: todayLog?.target_carbs ?? profile.target_carbs ?? null,
          fats: todayLog?.target_fats ?? profile.target_fats ?? null,
        };

        setTodayIntake(todayLog?.total_calories_consumed ?? 0);
        setTodayMacros({
          protein: todayLog?.total_protein_consumed ?? 0,
          carbs: todayLog?.total_carbs_consumed ?? 0,
          fats: todayLog?.total_fats_consumed ?? 0,
        });
        setDailyTarget(resolvedTargets.calories);
        setGoalAchieved(todayLog?.is_goal_achieved ?? false);
        setShowTargetsReminder(
          Object.values(resolvedTargets).some(
            (value) => value === null || value === undefined || value <= 0,
          ),
        );

        const points: ChartPoint[] = [];
        for (let offset = -6; offset <= 0; offset += 1) {
          const date = addDays(today, offset);
          const dateStr = formatDateParam(date);
          const log = progressByDate.get(dateStr);
          points.push({
            date: dateStr,
            name: date.toLocaleDateString("en-US", { weekday: "short" }),
            intake: log?.total_calories_consumed ?? 0,
          });
        }
        setChartData(points);
      } catch (error) {
        console.error("Failed to load dashboard data", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    void fetchDashboardData();

    return () => {
      isMounted = false;
    };
  }, []);

  const remainingCalories =
    dailyTarget !== null ? Math.max(0, dailyTarget - todayIntake) : null;
  const progressPercentage = useMemo(() => {
    if (!dailyTarget) return 0;
    return Math.min(100, (todayIntake / dailyTarget) * 100);
  }, [dailyTarget, todayIntake]);

  const chartScaleMax = useMemo(() => {
    const maxIntake = Math.max(0, ...chartData.map((d) => d.intake));
    const targetVal = dailyTarget && dailyTarget > 0 ? dailyTarget : 2000;
    return Math.max(2400, Math.ceil(Math.max(maxIntake, targetVal * 1.15) / 400) * 400);
  }, [chartData, dailyTarget]);

  const targetMarkerPercent = useMemo(() => {
    const targetVal = dailyTarget && dailyTarget > 0 ? dailyTarget : 2000;
    return Math.min(100, Math.max(0, (targetVal / chartScaleMax) * 100));
  }, [dailyTarget, chartScaleMax]);

  const donutCircumference = 2 * Math.PI * 40;
  const donutStrokeDashoffset =
    donutCircumference - (progressPercentage / 100) * donutCircumference;

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-[1240px] flex-col gap-4 pb-10">
      {showTargetsReminder && (
        <div className="rounded-[28px] border border-border bg-card p-5 shadow-xs transition-all">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3.5 md:items-center">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-accent text-primary">
                <Target className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-bold uppercase tracking-widest text-primary">
                  Daily Targets Missing
                </p>
                <p className="text-sm text-muted-foreground">
                  Set your calorie, protein, carbs, and fat goals to unlock full
                  progress tracking.
                </p>
              </div>
            </div>

            <Button
              asChild
              className="w-full rounded-full px-6 font-semibold md:w-auto"
            >
              <Link href="/client/profile">Set Targets</Link>
            </Button>
          </div>
        </div>
      )}

      {/* Hero Banner with Integrated Quick Actions */}
      <div className="relative overflow-hidden rounded-[36px] md:rounded-[44px] border border-border bg-card bg-section-hero p-7 md:px-10 md:py-9 flex flex-col justify-between gap-7 shadow-xs">
        {/* Decorative concentric circles */}
        <svg
          className="pointer-events-none absolute -top-20 -right-10 h-[400px] w-[400px] opacity-60"
          viewBox="0 0 400 400"
          fill="none"
          aria-hidden="true"
        >
          <circle
            cx="250"
            cy="150"
            r="100"
            stroke="var(--border)"
            strokeWidth="1.5"
          />
          <circle
            cx="250"
            cy="150"
            r="150"
            stroke="var(--border)"
            strokeWidth="1.5"
          />
          <circle
            cx="250"
            cy="150"
            r="200"
            stroke="var(--border)"
            strokeWidth="1.5"
          />
          <circle
            cx="250"
            cy="150"
            r="250"
            stroke="var(--border)"
            strokeWidth="1.5"
          />
        </svg>

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-4xl md:text-[52px] font-bold tracking-tight text-foreground leading-[1.05]">
            Good morning, {profileName}!
          </h1>
          <Link
            href="/client/calorie-tracker"
            className="inline-flex items-center gap-3 rounded-full bg-primary bg-btn-primary text-primary-foreground px-7 py-4 text-base font-bold transition-transform hover:-translate-y-0.5 shadow-sm"
          >
            <Plus className="h-[18px] w-[18px] stroke-[2.5]" />
            Log New Meal
          </Link>
        </div>

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
            Quick Actions
          </span>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/client/calorie-tracker"
              className="inline-flex items-center gap-2.5 rounded-full border border-border bg-accent/60 hover:bg-accent px-5 py-2.5 text-[13px] font-semibold text-foreground transition-colors"
            >
              <Camera className="h-4 w-4 text-primary" />
              Upload Meal
            </Link>
            <Link
              href="/client/consultations"
              className="inline-flex items-center gap-2.5 rounded-full border border-border bg-accent/60 hover:bg-accent px-5 py-2.5 text-[13px] font-semibold text-foreground transition-colors"
            >
              <Calendar className="h-4 w-4 text-primary" />
              Book Consultation
            </Link>
            <Link
              href="/client/meal-plans"
              className="inline-flex items-center gap-2.5 rounded-full border border-border bg-accent/60 hover:bg-accent px-5 py-2.5 text-[13px] font-semibold text-foreground transition-colors"
            >
              <ListTodo className="h-4 w-4 text-primary" />
              View Digital Plan
            </Link>
          </div>
        </div>
      </div>

      {/* Main 2-Column Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4 items-stretch">
        {/* Left Column: Macros Today + Next Consultation */}
        <div className="flex flex-col gap-4">
          {/* Macros Today Card */}
          <div className="rounded-[28px] border border-border bg-card p-6 flex flex-col justify-between flex-1 shadow-xs">
            <h2 className="text-[15px] font-bold text-foreground">
              Macros Today
            </h2>

            <div className="relative w-[130px] h-[130px] mx-auto my-4 flex items-center justify-center">
              <svg
                viewBox="0 0 100 100"
                className="w-full h-full -rotate-90"
                aria-hidden="true"
              >
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="var(--progress-track)"
                  strokeWidth="10"
                />
                {progressPercentage > 0 && (
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="var(--primary)"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={donutCircumference}
                    strokeDashoffset={donutStrokeDashoffset}
                  />
                )}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-bold text-foreground leading-none">
                  {todayIntake.toFixed(0)}
                </span>
                <span className="text-[11px] font-semibold text-muted-foreground mt-1">
                  kcal
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between text-[13px]">
                <div className="flex items-center gap-2 font-medium text-muted-foreground">
                  <span className="w-2 h-2 rounded-full bg-protein inline-block" />
                  Protein
                </div>
                <span className="font-bold text-foreground">
                  {todayMacros.protein.toFixed(0)}g
                </span>
              </div>
              <div className="flex items-center justify-between text-[13px]">
                <div className="flex items-center gap-2 font-medium text-muted-foreground">
                  <span className="w-2 h-2 rounded-full bg-carbs inline-block" />
                  Carbs
                </div>
                <span className="font-bold text-foreground">
                  {todayMacros.carbs.toFixed(0)}g
                </span>
              </div>
              <div className="flex items-center justify-between text-[13px]">
                <div className="flex items-center gap-2 font-medium text-muted-foreground">
                  <span className="w-2 h-2 rounded-full bg-fats inline-block" />
                  Fats
                </div>
                <span className="font-bold text-foreground">
                  {todayMacros.fats.toFixed(0)}g
                </span>
              </div>
            </div>
          </div>

          {/* Next Consultation Card */}
          <div className="rounded-[28px] border border-border bg-card p-6 flex flex-col justify-between gap-5 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-accent border border-border flex items-center justify-center text-ember shrink-0">
                <Info className="w-5 h-5" />
              </div>
              <span className="text-[15px] font-bold text-foreground">
                Next Consultation
              </span>
            </div>

            <div>
              {nextConsultation ? (
                <>
                  <p className="truncate text-xl font-bold text-foreground">
                    {new Date(
                      `${nextConsultation.appointment_date}T00:00`,
                    ).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                    {nextConsultation.start_time
                      ? `, ${nextConsultation.start_time}`
                      : ""}
                  </p>
                  <p
                    className={`mt-1 mb-3 text-xs font-semibold ${
                      nextConsultation.zoom_link
                        ? "text-primary"
                        : "text-ember"
                    }`}
                  >
                    {nextConsultation.zoom_link
                      ? "Zoom Link Ready"
                      : "Pending Link"}
                  </p>
                  <Link
                    href="/client/consultations"
                    className="inline-flex items-center justify-center rounded-full border border-border bg-transparent hover:bg-accent px-5 py-2.5 text-xs font-bold text-foreground transition-colors"
                  >
                    Book now
                  </Link>
                </>
              ) : (
                <>
                  <p className="text-xl font-bold text-foreground mb-3">
                    None Scheduled
                  </p>
                  <Link
                    href="/client/consultations"
                    className="inline-flex items-center justify-center rounded-full border border-border bg-transparent hover:bg-accent px-5 py-2.5 text-xs font-bold text-foreground transition-colors"
                  >
                    Book now
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: 3 Stat Cards + Weekly Progress */}
        <div className="flex flex-col gap-4">
          {/* Top 3 Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Current Plan */}
            <div className="rounded-[28px] border border-border bg-card p-6 pb-8 relative overflow-hidden flex flex-col justify-between gap-4 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-accent border border-border flex items-center justify-center text-ember shrink-0">
                  <Star className="w-5 h-5" />
                </div>
                <span className="text-[15px] font-bold text-foreground">
                  Current Plan
                </span>
              </div>

              <div className="min-w-0">
                <p className="truncate text-[22px] font-bold text-foreground tracking-tight leading-tight">
                  {getPlanTitle(activePlan)}
                </p>
                <p className="text-xs font-bold text-primary mt-1.5">
                  {activePlan
                    ? `${activePlan.progress_percent ?? 0}% Completed`
                    : "Browse Marketplace"}
                </p>
              </div>

              <div className="absolute bottom-4 left-6 right-6 h-1.5 rounded-full bg-progress-track overflow-hidden">
                <div
                  className="h-full rounded-full bg-ember transition-all"
                  style={{
                    width: `${Math.min(100, Math.max(0, activePlan?.progress_percent ?? 0))}%`,
                  }}
                />
              </div>
            </div>

            {/* Calories Today */}
            <div className="rounded-[28px] border border-border bg-card p-6 pb-8 relative overflow-hidden flex flex-col justify-between gap-4 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-accent border border-border flex items-center justify-center text-primary shrink-0">
                  <Flame className="w-5 h-5" />
                </div>
                <span className="text-[15px] font-bold text-foreground">
                  Calories Today
                </span>
              </div>

              <div>
                <p className="text-[22px] font-bold text-foreground tracking-tight leading-tight">
                  {todayIntake.toFixed(0)} kcal
                </p>
                {dailyTarget ? (
                  <p className="text-xs font-medium text-muted-foreground mt-1.5">
                    {progressPercentage.toFixed(0)}%
                  </p>
                ) : (
                  <p className="text-xs font-medium text-muted-foreground mt-1.5">
                    Set a daily target to track progress.
                  </p>
                )}
                {goalAchieved && (
                  <p className="mt-1 flex items-center gap-1 text-xs font-medium text-primary">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Goal achieved
                  </p>
                )}
              </div>

              <div className="absolute bottom-4 left-6 right-6 h-1.5 rounded-full bg-progress-track overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>

            {/* Remaining */}
            <div className="rounded-[28px] border border-border bg-card p-6 flex flex-col justify-between gap-4 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-accent border border-border flex items-center justify-center text-protein shrink-0">
                  <Target className="w-5 h-5" />
                </div>
                <span className="text-[15px] font-bold text-foreground">
                  Remaining
                </span>
              </div>

              <div>
                <p className="text-[22px] font-bold text-foreground tracking-tight leading-tight">
                  {remainingCalories !== null
                    ? `${remainingCalories.toFixed(0)} kcal`
                    : "Target not set"}
                </p>
                <p className="text-xs font-medium text-muted-foreground mt-1.5">
                  {dailyTarget !== null
                    ? `Daily goal: ${dailyTarget.toFixed(0)} kcal`
                    : "Add your daily targets in your profile."}
                </p>
              </div>
            </div>
          </div>

          {/* Weekly Progress: Intake vs Target */}
          <div className="rounded-[28px] border border-border bg-card p-6 md:p-7 flex-1 flex flex-col justify-between shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <span className="inline-flex items-center rounded-full bg-accent border border-border px-4 py-2 text-[13px] font-bold text-foreground">
                Weekly Progress: Intake vs Target
              </span>
              <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-[3px] bg-primary inline-block" />
                  Intake
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-0.5 bg-ember inline-block" />
                  Target
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {/* Scale Header */}
              <div className="grid grid-cols-[44px_1fr_92px] gap-4 mb-1">
                <div />
                <div className="flex justify-between text-[11px] font-medium text-muted-foreground px-0.5">
                  <span>0</span>
                  <span>{Math.round(chartScaleMax * 0.25)}</span>
                  <span>{Math.round(chartScaleMax * 0.5)}</span>
                  <span>{Math.round(chartScaleMax * 0.75)}</span>
                  <span>{chartScaleMax}</span>
                </div>
                <div />
              </div>

              {/* 7 Day Horizontal Bars */}
              <div className="flex flex-col gap-3.5">
                {chartData.map((point) => {
                  const barPct = Math.min(
                    100,
                    Math.max(0, (point.intake / chartScaleMax) * 100),
                  );
                  const pctOfTarget =
                    dailyTarget && dailyTarget > 0
                      ? Math.round((point.intake / dailyTarget) * 100)
                      : 0;

                  return (
                    <div
                      key={point.date}
                      className="grid grid-cols-[44px_1fr_92px] items-center gap-4"
                    >
                      <span className="text-xs font-semibold text-foreground">
                        {point.name}
                      </span>
                      <div className="relative h-3 rounded-full bg-progress-track flex items-center">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${barPct}%` }}
                        />
                        <div
                          className="absolute -top-1.5 -bottom-1.5 w-0 border-l-2 border-dashed border-ember z-10"
                          style={{ left: `${targetMarkerPercent}%` }}
                          title={
                            dailyTarget
                              ? `Target: ${dailyTarget.toFixed(0)} kcal`
                              : "Target: 2000 kcal"
                          }
                        />
                      </div>
                      <span className="text-[11px] font-medium text-muted-foreground text-right tabular-nums">
                        {point.intake.toFixed(0)} ({pctOfTarget}%)
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

