"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Beef,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Coffee,
  Cookie,
  Droplets,
  Flame,
  Loader2,
  Moon,
  Sun,
  UtensilsCrossed,
  Wheat,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import {
  CalorieLog,
  ClientProfile,
  ClientProgress,
  MEAL_TYPES,
  MealType,
  formatDateParam,
  getCalorieLogs,
  getClientProfile,
  getClientProgress,
  getIngredientName,
} from "@/lib/client";

interface Totals {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

interface Targets {
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fats: number | null;
}

const MEAL_CONFIG: Record<
  MealType,
  {
    label: string;
    icon: typeof Coffee;
    gradient: string;
    bg: string;
    text: string;
    border: string;
  }
> = {
  breakfast: {
    label: "Breakfast",
    icon: Coffee,
    gradient: "from-amber-500 to-orange-500",
    bg: "bg-amber-50 dark:bg-amber-950/20",
    text: "text-amber-600 dark:text-amber-400",
    border: "border-amber-100 dark:border-amber-900/30",
  },
  lunch: {
    label: "Lunch",
    icon: Sun,
    gradient: "from-emerald-500 to-teal-500",
    bg: "bg-emerald-50 dark:bg-emerald-950/20",
    text: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-100 dark:border-emerald-900/30",
  },
  dinner: {
    label: "Dinner",
    icon: Moon,
    gradient: "from-violet-500 to-purple-500",
    bg: "bg-violet-50 dark:bg-violet-950/20",
    text: "text-violet-600 dark:text-violet-400",
    border: "border-violet-100 dark:border-violet-900/30",
  },
  snack: {
    label: "Snacks",
    icon: Cookie,
    gradient: "from-rose-500 to-pink-500",
    bg: "bg-rose-50 dark:bg-rose-950/20",
    text: "text-rose-600 dark:text-rose-400",
    border: "border-rose-100 dark:border-rose-900/30",
  },
};

function getToday(): string {
  return formatDateParam(new Date());
}

function formatDate(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00`);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function addDays(dateStr: string, days: number): string {
  const date = new Date(`${dateStr}T00:00:00`);
  date.setDate(date.getDate() + days);
  return formatDateParam(date);
}

function isToday(dateStr: string): boolean {
  return dateStr === getToday();
}

function percent(consumed: number, target: number | null): number {
  if (!target || target <= 0) return 0;
  return Math.min(100, Math.round((consumed / target) * 100));
}

function getTotals(logs: CalorieLog[], progress: ClientProgress | null): Totals {
  if (progress) {
    return {
      calories: progress.total_calories_consumed ?? 0,
      protein: progress.total_protein_consumed ?? 0,
      carbs: progress.total_carbs_consumed ?? 0,
      fats: progress.total_fats_consumed ?? 0,
    };
  }

  return logs.reduce(
    (totals, log) => {
      if (log.status !== "saved") return totals;
      totals.calories += log.total_calories ?? 0;
      totals.protein += log.total_protein ?? 0;
      totals.carbs += log.total_carbs ?? 0;
      totals.fats += log.total_fats ?? 0;
      return totals;
    },
    { calories: 0, protein: 0, carbs: 0, fats: 0 },
  );
}

function getTargets(progress: ClientProgress | null, profile: ClientProfile | null): Targets {
  return {
    calories: progress?.target_calories ?? profile?.target_calories ?? null,
    protein: progress?.target_protein ?? profile?.target_protein ?? null,
    carbs: progress?.target_carbs ?? profile?.target_carbs ?? null,
    fats: progress?.target_fats ?? profile?.target_fats ?? null,
  };
}

function ingredientList(log: CalorieLog): string {
  const ingredients = log.user_final_log ?? [];
  if (ingredients.length === 0) return "No ingredients recorded";
  return ingredients
    .map((ingredient) => {
      const mass = ingredient.mass_grams ? ` (${ingredient.mass_grams}g)` : "";
      return `${getIngredientName(ingredient)}${mass}`;
    })
    .join(", ");
}

function ProgressMetricCard({
  label,
  value,
  target,
  unit,
  icon: Icon,
  colorClass,
  barClass,
}: {
  label: string;
  value: number;
  target: number | null;
  unit: string;
  icon: typeof Flame;
  colorClass: string;
  barClass: string;
}) {
  const pct = percent(value, target);

  return (
    <Card className="shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`rounded-xl p-2.5 ${colorClass}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
            <p className="text-xl font-bold text-foreground">
              {value.toFixed(0)}
              <span className="ml-1 text-xs font-normal text-muted-foreground">
                {target ? `/ ${target.toFixed(0)} ${unit}` : unit}
              </span>
            </p>
          </div>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-progress-track">
  <div className={`h-full rounded-full transition-all duration-700 ease-out ${barClass}`} style={{ width: `${pct}%` }} />
</div>
        <p className="mt-1.5 text-right text-xs text-muted-foreground">
          {target ? `${pct}% of target` : "Target not set"}
        </p>
      </CardContent>
    </Card>
  );
}

export default function CalorieHistoryPage() {
  const [selectedDate, setSelectedDate] = useState(getToday());
  const [dateInput, setDateInput] = useState(selectedDate);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [logs, setLogs] = useState<CalorieLog[]>([]);
  const [progress, setProgress] = useState<ClientProgress | null>(null);
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDateInput(selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    let isMounted = true;

    const loadDay = async () => {
      setLoading(true);
      setError(null);
      try {
        const [dayLogs, progressRows, profileData] = await Promise.all([
          getCalorieLogs(selectedDate),
          getClientProgress(selectedDate, selectedDate).catch(() => []),
          profile ? Promise.resolve(profile) : getClientProfile(),
        ]);

        if (!isMounted) return;
        setLogs(dayLogs);
        setProgress(progressRows.find((row) => row.log_date === selectedDate) ?? null);
        setProfile(profileData);
      } catch (loadError) {
        console.error("Failed to load meal history", loadError);
        if (isMounted) setError("Could not load meal history for this date.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    void loadDay();

    return () => {
      isMounted = false;
    };
  }, [profile, selectedDate]);

  const savedLogs = useMemo(() => logs.filter((log) => log.status === "saved"), [logs]);
  const totals = useMemo(() => getTotals(savedLogs, progress), [progress, savedLogs]);
  const targets = useMemo(() => getTargets(progress, profile), [progress, profile]);
  const hasAnyMeals = savedLogs.length > 0;

  const goToPrevDay = () => setSelectedDate((date) => addDays(date, -1));
  const goToNextDay = () => {
    const next = addDays(selectedDate, 1);
    if (next <= getToday()) setSelectedDate(next);
  };
  const handleDateJump = () => {
    if (dateInput && dateInput <= getToday()) setSelectedDate(dateInput);
    setShowDatePicker(false);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" asChild className="p-2">
          <Link href="/client/calorie-tracker">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Meal History</h1>
          <p className="text-muted-foreground">Browse your daily nutrition logs</p>
        </div>
      </div>

      <Card>
        <CardContent className="px-5 py-4">
          <div className="flex items-center justify-between gap-4">
            <Button variant="ghost" onClick={goToPrevDay} className="flex items-center gap-1 px-3 py-2 text-sm font-medium">
              <ChevronLeft className="h-5 w-5" />
              <span className="hidden sm:inline">Previous</span>
            </Button>
            <div className="flex items-center gap-3 text-center">
              <button
                type="button"
                onClick={() => setShowDatePicker((open) => !open)}
                className="rounded-lg p-2 text-primary transition-colors hover:bg-accent"
                title="Jump to date"
              >
                <CalendarDays className="h-5 w-5" />
              </button>
              <div>
                <p className="text-lg font-bold text-foreground">{isToday(selectedDate) ? "Today" : formatDate(selectedDate)}</p>
                {isToday(selectedDate) && <p className="text-xs text-muted-foreground">{formatDate(selectedDate)}</p>}
              </div>
            </div>
            <Button
              variant="ghost"
              onClick={goToNextDay}
              disabled={selectedDate >= getToday()}
              className="flex items-center gap-1 px-3 py-2 text-sm font-medium disabled:opacity-30"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          {showDatePicker && (
            <div className="mt-4 flex items-center justify-center gap-3 border-t border-border pt-4">
              <input
                type="date"
                value={dateInput}
                max={getToday()}
                onChange={(event) => setDateInput(event.target.value)}
                className="rounded-lg border border-border bg-background px-4 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
              />
              <Button onClick={handleDateJump} size="sm" className="px-5">
                Go
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {error && <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}

      {loading ? (
        <Card>
          <CardContent className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <ProgressMetricCard
  label="Calories"
  value={totals.calories}
  target={targets.calories}
  unit="kcal"
  icon={Flame}
  colorClass="bg-calories/10 text-calories"
  barClass="bg-gradient-to-r from-calories to-calories/80"
/>
<ProgressMetricCard
  label="Protein"
  value={totals.protein}
  target={targets.protein}
  unit="g"
  icon={Beef}
  colorClass="bg-protein/10 text-protein"
  barClass="bg-gradient-to-r from-protein to-protein/80"
/>
<ProgressMetricCard
  label="Carbs"
  value={totals.carbs}
  target={targets.carbs}
  unit="g"
  icon={Wheat}
  colorClass="bg-carbs/10 text-carbs"
  barClass="bg-gradient-to-r from-carbs to-carbs/80"
/>
<ProgressMetricCard
  label="Fat"
  value={totals.fats}
  target={targets.fats}
  unit="g"
  icon={Droplets}
  colorClass="bg-fats/10 text-fats"
  barClass="bg-gradient-to-r from-fats to-fats/80"
/>
          </div>

          {!hasAnyMeals && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-secondary">
                  <UtensilsCrossed className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="mb-2 text-xl font-bold text-foreground">No meals logged</h3>
                <p className="max-w-sm text-muted-foreground">Use the calorie tracker to start logging meals for this day.</p>
              </CardContent>
            </Card>
          )}

          <div className="space-y-4">
            {MEAL_TYPES.map((mealType) => {
              const config = MEAL_CONFIG[mealType];
              const Icon = config.icon;
              const mealLogs = savedLogs.filter((log) => log.meal_type === mealType);
              const mealTotals = getTotals(mealLogs, null);

              return (
                <Card key={mealType} className="overflow-hidden shadow-sm">
                  <CardHeader className="px-5 pb-3 pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`rounded-xl bg-gradient-to-br p-2 text-white shadow-sm ${config.gradient}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <CardTitle className="text-base text-card-foreground">{config.label}</CardTitle>
                          <p className="text-xs text-muted-foreground">
                            {mealLogs.length} entr{mealLogs.length === 1 ? "y" : "ies"}
                          </p>
                        </div>
                      </div>
                      {mealLogs.length > 0 && (
                        <span className="text-lg font-bold text-foreground">
                          {mealTotals.calories.toFixed(0)} <span className="text-xs font-normal text-muted-foreground">kcal</span>
                        </span>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="px-5 pb-4 pt-0">
                    {mealLogs.length === 0 ? (
                      <div className={`rounded-xl border p-4 text-center ${config.bg} ${config.border}`}>
                        <p className={`text-sm font-medium ${config.text}`}>No {config.label.toLowerCase()} logged</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="overflow-hidden rounded-xl border border-border">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="bg-background">
                                <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                  Ingredients
                                </th>
                                <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                  Cal
                                </th>
                                <th className="hidden px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:table-cell">
                                  P
                                </th>
                                <th className="hidden px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:table-cell">
                                  C
                                </th>
                                <th className="hidden px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:table-cell">
                                  F
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                              {mealLogs.map((log) => (
                                <tr key={log.id} className="transition-colors hover:bg-accent">
                                  <td className="px-4 py-2.5 font-medium text-foreground">{ingredientList(log)}</td>
                                  <td className="px-3 py-2.5 text-right font-semibold text-foreground">
                                    {(log.total_calories ?? 0).toFixed(0)}
                                  </td>
                                  <td className="hidden px-3 py-2.5 text-right text-protein sm:table-cell">
  {(log.total_protein ?? 0).toFixed(0)}g
</td>
<td className="hidden px-3 py-2.5 text-right text-carbs sm:table-cell">
  {(log.total_carbs ?? 0).toFixed(0)}g
</td>
<td className="hidden px-4 py-2.5 text-right text-fats sm:table-cell">
  {(log.total_fats ?? 0).toFixed(0)}g
</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <div className="flex items-center gap-4 px-1 pt-2">
                          <div className="flex items-center gap-4 px-1 pt-2">
  <span className="text-xs font-medium text-protein">P: {mealTotals.protein.toFixed(0)}g</span>
  <span className="text-xs font-medium text-carbs">C: {mealTotals.carbs.toFixed(0)}g</span>
  <span className="text-xs font-medium text-fats">F: {mealTotals.fats.toFixed(0)}g</span>
</div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card className="shadow-sm">
            <CardContent className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Daily Total</p>
                  <p className="text-3xl font-extrabold text-primary">
                    {totals.calories.toFixed(0)} <span className="text-sm font-medium text-primary/70">kcal</span>
                  </p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Protein</p>
<p className="text-lg font-bold text-protein">{totals.protein.toFixed(0)}g</p>                  </div>
                  <div className="h-8 w-px bg-border" />
                  <div className="text-center">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Carbs</p>
<p className="text-lg font-bold text-carbs">{totals.carbs.toFixed(0)}g</p>                  </div>
                  <div className="h-8 w-px bg-border" />
                  <div className="text-center">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Fat</p>
<p className="text-lg font-bold text-fats">{totals.fats.toFixed(0)}g</p>                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
