"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Flame, Target } from "lucide-react";

interface CalorieStatsProps {
  intakeCalories: number;
  targetCalories: number;
}

export default function CalorieStats({ intakeCalories, targetCalories }: CalorieStatsProps) {
  const remainingCalories = Math.max(targetCalories - intakeCalories, 0);
  const progressPercent = targetCalories > 0 ? Math.min((intakeCalories / targetCalories) * 100, 100) : 0;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Card className="dark:bg-[#202731] border-none shadow-sm shadow-[#1a2027]/50">
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className="mt-1 rounded-xl bg-gray-100 p-3 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
              <Flame className="h-6 w-6" />
            </div>
            <div className="w-full space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground dark:text-gray-400">
                Calories Today
              </p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{Math.round(intakeCalories)} kcal</p>
              <div className="mt-2 flex w-full items-center gap-3">
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                  <div className="h-full bg-emerald-500" style={{ width: `${progressPercent}%` }} />
                </div>
                <span className="text-xs text-muted-foreground dark:text-gray-400">{Math.round(progressPercent)}%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="dark:bg-[#202731] border-none shadow-sm shadow-[#1a2027]/50">
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className="mt-1 rounded-xl bg-gray-100 p-3 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
              <Target className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground dark:text-gray-400">Remaining</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{Math.round(remainingCalories)} kcal</p>
              <p className="text-sm text-muted-foreground dark:text-gray-400">Daily target: {Math.round(targetCalories)} kcal</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
