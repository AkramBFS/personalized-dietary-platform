"use client";

import React from "react";

export interface ProgressChartPoint {
  name: string;
  intake: number;
  target: number;
}

interface ProgressChartProps {
  title?: string;
  data: ProgressChartPoint[];
  targetLabel?: string;
}

export default function ProgressChart({
  title = "Weekly Progress: Intake vs Target",
  data,
  targetLabel = "Target",
}: ProgressChartProps) {
  const fallbackTarget = data[0]?.target ?? 0;
  const maxScale =
    fallbackTarget > 0
      ? fallbackTarget
      : Math.max(...data.map((d) => d.intake), 2000);
  const ticks = [
    0,
    Math.round(maxScale * 0.25),
    Math.round(maxScale * 0.5),
    Math.round(maxScale * 0.75),
    Math.round(maxScale),
  ];

  return (
    <div className="flex-1 rounded-[28px] border border-border bg-card p-6 md:p-7">
      <div className="mb-5.5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="m-0 rounded-xl bg-primary px-4 py-2 text-base font-bold text-primary-foreground">
          {title}
        </h2>
        <div className="flex items-center gap-4.5 text-sm text-muted-foreground">
          <span className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-primary" />
            Intake
          </span>
          <span className="flex items-center gap-2">
            <span className="w-4.5 border-t-2 border-dashed border-ember" />
            {targetLabel}
          </span>
        </div>
      </div>

      <div className="mb-2.5 grid grid-cols-[36px_1fr_92px] items-center gap-3.5 text-xs text-muted-foreground sm:grid-cols-[44px_1fr_104px]">
        <span />
        <span className="flex justify-between">
          {ticks.map((tick, idx) => (
            <span key={idx}>{tick}</span>
          ))}
        </span>
        <span />
      </div>

      <div className="space-y-3.5">
        {data.map((point) => {
          const targetVal = point.target > 0 ? point.target : maxScale;
          const rawPct = targetVal > 0 ? (point.intake / targetVal) * 100 : 0;
          const barWidth = Math.min(100, Math.max(0, rawPct));
          return (
            <div
              key={point.name}
              className="grid grid-cols-[36px_1fr_92px] items-center gap-3.5 sm:grid-cols-[44px_1fr_104px]"
            >
              <span className="text-sm text-muted-foreground">{point.name}</span>
              <div className="relative h-4 rounded-lg bg-progress-track">
                <div
                  className="h-full rounded-lg bg-button-primary bg-btn-primary transition-all"
                  style={{ width: `${barWidth.toFixed(1)}%` }}
                />
                <i className="pointer-events-none absolute -top-[5px] -bottom-[5px] right-0 border-r-2 border-dashed border-ember" />
              </div>
              <span className="text-sm font-semibold text-foreground">
                {Math.round(point.intake)} ({Math.round(rawPct)}%)
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

