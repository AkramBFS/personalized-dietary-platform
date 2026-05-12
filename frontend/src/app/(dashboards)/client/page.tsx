"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import {
  Calendar,
  Camera,
  CheckCircle2,
  Flame,
  ListTodo,
  Loader2,
  Plus,
  RotateCw,
  Star,
  Target,
} from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
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

        setProfileName(profile.username || "there");

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

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8 pb-10">
      {showTargetsReminder && (
        <Card className="border-accent/50 bg-accent/20 shadow-sm transition-all">
          <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3 md:items-center">
              {/* Using the accent-foreground color for the icon to make it pop */}
              <div className="rounded-full bg-accent-foreground/10 p-2 text-accent-foreground">
                <Target className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-bold uppercase tracking-widest text-accent-foreground">
                  Daily Targets Missing
                </p>
                <p className="text-sm text-foreground/80">
                  Set your calorie, protein, carbs, and fat goals to unlock full
                  progress tracking.
                </p>
              </div>
            </div>

            {/* Using the standard primary button which adapts to each theme */}
            <Button asChild className="w-full font-semibold md:w-auto">
              <Link href="/client/profile">Set Targets</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
          Good morning, {profileName}!
        </h1>
        <Button asChild className="rounded-lg px-6 py-6 font-medium">
          <Link href="/client/calorie-tracker">
            <Plus className="mr-2 h-5 w-5" />
            Log New Meal
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-none shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className="mt-1 rounded-xl bg-primary/20 p-3 text-primary">
                <Star className="h-6 w-6" />
              </div>
              <div className="min-w-0 space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Current Plan
                </p>
                <p className="truncate text-lg font-bold text-foreground">
                  {getPlanTitle(activePlan)}
                </p>
                <p className="text-sm font-medium text-primary">
                  {activePlan
                    ? `${activePlan.progress_percent ?? 0}% Completed`
                    : "Browse Marketplace"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className="mt-1 rounded-xl bg-secondary p-3 text-muted-foreground">
                <Flame className="h-6 w-6" />
              </div>
              <div className="w-full space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Calories Today
                </p>
                <p className="text-lg font-bold text-foreground">
                  {todayIntake.toFixed(0)} kcal
                </p>
                {dailyTarget ? (
                  <div className="mt-2 flex w-full items-center gap-3">
                    <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${progressPercentage}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {progressPercentage.toFixed(0)}%
                    </span>
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Set a daily target to track progress.
                  </p>
                )}
                {goalAchieved && (
                  <p className="flex items-center gap-1 text-xs font-medium text-primary">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Goal achieved
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className="mt-1 rounded-xl bg-secondary p-3 text-muted-foreground">
                <Target className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Remaining
                </p>
                <p className="text-lg font-bold text-foreground">
                  {remainingCalories !== null
                    ? `${remainingCalories.toFixed(0)} kcal`
                    : "Target not set"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {dailyTarget !== null
                    ? `Daily goal: ${dailyTarget.toFixed(0)} kcal`
                    : "Add your daily targets in your profile."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className="mt-1 rounded-xl bg-secondary p-3 text-muted-foreground">
                <RotateCw className="h-6 w-6" />
              </div>
              <div className="min-w-0 space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Next Consultation
                </p>
                {nextConsultation ? (
                  <>
                    <p className="truncate text-lg font-bold text-foreground">
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
                      className={`text-sm font-medium ${nextConsultation.zoom_link ? "text-blue-500" : "text-amber-500"}`}
                    >
                      {nextConsultation.zoom_link
                        ? "Zoom Link Ready"
                        : "Pending Link"}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-lg font-bold text-foreground">
                      None Scheduled
                    </p>
                    <Link
                      href="/client/consultations"
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      Book now
                    </Link>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="border-none shadow-sm lg:col-span-2">
          <CardContent className="p-6">
            <h2 className="mb-6 text-xl font-bold tracking-wide text-foreground">
              Weekly Progress: Intake vs Target
            </h2>
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 20, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="var(--border)"
                    className="opacity-30"
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "var(--muted-foreground)", fontSize: 13 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "var(--muted-foreground)", fontSize: 13 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      color: "var(--card-foreground)",
                    }}
                    formatter={(value) => [
                      `${Number(value).toFixed(0)} kcal`,
                      "Intake",
                    ]}
                    labelFormatter={(_, payload) =>
                      payload?.[0]?.payload?.date ?? ""
                    }
                  />
                  {dailyTarget !== null && (
                    <ReferenceLine
                      y={dailyTarget}
                      stroke="var(--muted-foreground)"
                      strokeDasharray="3 3"
                      label={{
                        position: "insideTopLeft",
                        value: "Target",
                        fill: "var(--muted-foreground)",
                        fontSize: 13,
                      }}
                    />
                  )}
                  <Line
                    type="monotone"
                    dataKey="intake"
                    stroke="var(--primary)"
                    strokeWidth={3}
                    dot={{ fill: "var(--primary)", strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <h2 className="mb-2 mt-4 text-xl font-bold tracking-wide text-foreground lg:mb-1 lg:mt-0">
            Quick Actions
          </h2>
          <Button
            asChild
            className="flex h-auto w-full flex-col items-center justify-center gap-3 rounded-xl py-6 shadow-sm"
          >
            <Link href="/client/calorie-tracker">
              <Camera className="mb-1 h-8 w-8" />
              <span className="text-base font-semibold">Upload Meal</span>
            </Link>
          </Button>
          <Button
            asChild
            className="flex h-auto w-full flex-col items-center justify-center gap-3 rounded-xl py-6 shadow-sm"
          >
            <Link href="/client/consultations">
              <Calendar className="mb-1 h-8 w-8" />
              <span className="text-base font-semibold">Book Consultation</span>
            </Link>
          </Button>
          <Button
            asChild
            className="flex h-auto w-full flex-col items-center justify-center gap-3 rounded-xl py-6 shadow-sm"
          >
            <Link href="/client/meal-plans">
              <ListTodo className="mb-1 h-8 w-8" />
              <span className="text-base font-semibold">View Digital Plan</span>
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
