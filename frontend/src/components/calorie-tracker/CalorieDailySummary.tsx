"use client";

import React from "react";
import Link from "next/link";
import { Clock, History, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import type { CalorieLog, MealType } from "@/lib/client";

interface CalorieDailySummaryProps {
  logsLoading: boolean;
  todayLogs: CalorieLog[];
  todayTotals: { calories: number; protein: number; carbs: number; fats: number };
  dailyTarget: number | null;
  totalToday: number;
  macroTargets: { protein: number; carbs: number; fats: number };
  mealTypes: readonly MealType[];
  mealLabels: Record<MealType, string>;
  mealSummary: (logs: CalorieLog[], type: MealType) => CalorieLog[];
  getIngredientName: (item: any) => string;
}

export default function CalorieDailySummary({
  logsLoading,
  todayLogs,
  todayTotals,
  dailyTarget,
  totalToday,
  macroTargets,
  mealTypes,
  mealLabels,
  mealSummary,
  getIngredientName,
}: CalorieDailySummaryProps) {
  return (
    <div className="order-2 space-y-6 lg:order-1">
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b border-border pb-3">
          <CardTitle className="flex items-center gap-2 text-lg text-card-foreground">
            <Clock className="h-5 w-5 text-primary" />
            Today&apos;s Log
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {logsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-4">
              {mealTypes.map((type) => {
                const logs = mealSummary(todayLogs, type);
                const calories = logs.reduce(
                  (sum, log) => sum + (log.total_calories ?? 0),
                  0,
                );
                return (
                  <div
                    key={type}
                    className="border-b border-border pb-3 last:border-0 last:pb-0"
                  >
                    <div className="mb-1 flex items-start justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-semibold text-foreground">
                          {mealLabels[type]}
                        </h4>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {logs.length > 0
                            ? logs
                                .flatMap((log) => log.user_final_log ?? [])
                                .map(getIngredientName)
                                .join(", ")
                            : `No ${mealLabels[type].toLowerCase()} logged`}
                        </p>
                      </div>
                      {logs.length > 0 && (
                        <span className="rounded bg-accent px-2 py-0.5 text-sm font-bold text-primary">
                          {calories.toFixed(0)} kcal
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
              <div className="flex items-center justify-between pt-2 text-sm">
                <span className="font-medium text-muted-foreground">
                  Total Today
                </span>
                <span className="font-bold text-foreground">
                  {totalToday.toFixed(0)}
                  {dailyTarget ? (
                    <span className="text-xs font-normal text-muted-foreground">
                      {" "}
                      / {dailyTarget.toFixed(0)} kcal
                    </span>
                  ) : (
                    <span className="text-xs font-normal text-muted-foreground">
                      {" "}
                      kcal
                    </span>
                  )}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 border-t border-border pt-3">
                <div className="rounded-lg bg-background px-3 py-2 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Protein
                  </p>
                  <p className="text-sm font-bold text-foreground">
                    {todayTotals.protein.toFixed(0)}g
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {macroTargets.protein
                      ? `/ ${macroTargets.protein.toFixed(0)}g`
                      : "No target"}
                  </p>
                </div>
                <div className="rounded-lg bg-background px-3 py-2 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Carbs
                  </p>
                  <p className="text-sm font-bold text-foreground">
                    {todayTotals.carbs.toFixed(0)}g
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {macroTargets.carbs
                      ? `/ ${macroTargets.carbs.toFixed(0)}g`
                      : "No target"}
                  </p>
                </div>
                <div className="rounded-lg bg-background px-3 py-2 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Fat
                  </p>
                  <p className="text-sm font-bold text-foreground">
                    {todayTotals.fats.toFixed(0)}g
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {macroTargets.fats
                      ? `/ ${macroTargets.fats.toFixed(0)}g`
                      : "No target"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Button
        variant="outline"
        asChild
        className="flex w-full items-center justify-center gap-2 py-6 shadow-sm"
      >
        <Link href="/client/calorie-tracker/history">
          <History className="h-5 w-5" /> View Full History
        </Link>
      </Button>
    </div>
  );
}
