"use client";

import React from "react";
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
      <div className="rounded-[28px] border border-border bg-card p-5.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            Calories Today
          </span>
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-accent text-primary">
            <Flame className="h-5 w-5" />
          </span>
        </div>
        <div className="mt-3.5 mb-2 text-[28px] font-bold leading-[1.1] tracking-tight text-foreground xl:text-[32px]">
          {Math.round(intakeCalories)} kcal
        </div>
        <div className="text-sm text-muted-foreground">{Math.round(progressPercent)}%</div>
        <div className="mt-3.5 h-1.5 w-full overflow-hidden rounded-full bg-progress-track">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="rounded-[28px] border border-border bg-card p-5.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            Remaining
          </span>
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-accent text-protein">
            <Target className="h-5 w-5" />
          </span>
        </div>
        <div className="mt-3.5 mb-2 text-[28px] font-bold leading-[1.1] tracking-tight text-foreground xl:text-[32px]">
          {Math.round(remainingCalories)} kcal
        </div>
        <div className="text-sm text-muted-foreground">
          Daily goal: {Math.round(targetCalories)} kcal
        </div>
      </div>
    </div>
  );
}

