"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/Card";
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

  return (
    <Card className="bg-card border-none shadow-sm shadow-card/50">
      <CardContent className="p-6">
        <h2 className="mb-6 text-xl font-bold tracking-wide text-foreground">{title}</h2>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
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
                itemStyle={{ color: "var(--primary)" }}
              />
              <ReferenceLine
                y={fallbackTarget}
                stroke="var(--muted-foreground)"
                strokeDasharray="3 3"
                label={{
                  position: "insideTopLeft",
                  value: targetLabel,
                  fill: "var(--muted-foreground)",
                  fontSize: 13,
                }}
              />
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
  );
}
