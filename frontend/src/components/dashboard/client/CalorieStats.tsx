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
      <Card className="bg-card border-none shadow-sm shadow-card/50">
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className="mt-1 rounded-xl bg-secondary p-3 text-muted-foreground">
              <Flame className="h-6 w-6" />
            </div>
            <div className="w-full space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Calories Today
              </p>
              <p className="text-lg font-bold text-foreground">{Math.round(intakeCalories)} kcal</p>
              <div className="mt-2 flex w-full items-center gap-3">
                <div className="h-2 w-full overflow-hidden rounded-full bg-input">
                  <div className="h-full bg-brand" style={{ width: `${progressPercent}%` }} />
                </div>
                <span className="text-xs text-muted-foreground">{Math.round(progressPercent)}%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-none shadow-sm shadow-card/50">
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className="mt-1 rounded-xl bg-secondary p-3 text-muted-foreground">
              <Target className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Remaining</p>
              <p className="text-lg font-bold text-foreground">{Math.round(remainingCalories)} kcal</p>
              <p className="text-sm text-muted-foreground">Daily target: {Math.round(targetCalories)} kcal</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
