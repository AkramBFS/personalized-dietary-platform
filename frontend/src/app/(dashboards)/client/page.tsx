"use client";

import React, { useEffect, useState } from "react";
import api from "@/lib/api"; // Ensure you have this configured
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import {
  Star,
  Flame,
  Target,
  RotateCw,
  Camera,
  Calendar,
  ListTodo,
  Plus,
  Loader2,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import Link from "next/link";

export default function ClientDashboardPage() {
  const [loading, setLoading] = useState(true);

  // Dashboard State
  const [profileName, setProfileName] = useState("User");
  const [activePlan, setActivePlan] = useState<any | null>(null);
  const [nextConsultation, setNextConsultation] = useState<any | null>(null);

  // Progress & Chart State
  const [todayIntake, setTodayIntake] = useState(0);
  const [dailyTarget, setDailyTarget] = useState(2000);
  const [chartData, setChartData] = useState<
    { name: string; intake: number }[]
  >([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch all required data concurrently
        const [profileRes, plansRes, progressRes, consultationsRes] =
          await Promise.all([
            api.get("/client/profile/").catch(() => null),
            api.get("/client/user-plans/").catch(() => null),
            api.get("/client/progress/").catch(() => null),
            api.get("/client/consultations/").catch(() => null),
          ]);

        // 1. Profile Name
        if (profileRes?.data) {
          setProfileName(profileRes.data.user?.username || "there");
        }

        // 2. Active Plan
        if (plansRes?.data) {
          const plans = plansRes.data.results || plansRes.data;
          const current = plans.find((p: any) => p.status === "active");
          if (current) setActivePlan(current);
        }

        // 3. Consultations
        if (consultationsRes?.data) {
          const consultations =
            consultationsRes.data.results || consultationsRes.data;
          const upcoming = consultations
            .filter((c: any) => c.status === "scheduled")
            .sort(
              (a: any, b: any) =>
                new Date(a.appointment_date).getTime() -
                new Date(b.appointment_date).getTime(),
            );

          if (upcoming.length > 0) setNextConsultation(upcoming[0]);
        }

        // 4. Progress (Today's stats & Chart)
        if (progressRes?.data) {
          const logs = progressRes.data.results || progressRes.data;

          // Get today's date in YYYY-MM-DD
          const todayStr = new Date().toISOString().split("T")[0];
          const todayLog = logs.find((log: any) => log.log_date === todayStr);

          if (todayLog) {
            setTodayIntake(todayLog.total_calories_consumed || 0);
            setDailyTarget(todayLog.target_calories || 2000);
          }

          // Generate last 7 days for chart
          const last7Days = [];
          for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split("T")[0];
            const dayName = d.toLocaleDateString("en-US", { weekday: "short" });

            const logForDay = logs.find((l: any) => l.log_date === dateStr);
            last7Days.push({
              name: dayName,
              intake: logForDay ? logForDay.total_calories_consumed : 0,
            });
          }
          setChartData(last7Days);
        }
      } catch (error) {
        console.error("Failed to load dashboard data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Derived calculations
  const remainingCalories = Math.max(0, dailyTarget - todayIntake);
  const progressPercentage =
    Math.min(100, (todayIntake / dailyTarget) * 100) || 0;

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 pb-10 max-w-7xl mx-auto">
      {/* Header section */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white tracking-tight capitalize">
          Good morning, {profileName}!{" "}
          <span className="inline-block animate-wave">👋</span>
        </h1>
        <Button
          asChild
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-6 py-6 rounded-lg"
        >
          <Link href="/client/calorie-tracker">
            <Plus className="w-5 h-5 mr-2" />
            Log New Meal
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Plan */}
        <Card className="dark:bg-[#202731] border-none shadow-sm shadow-[#1a2027]/50">
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className="bg-emerald-600/20 p-3 rounded-xl text-emerald-500 mt-1">
                <Star className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground dark:text-gray-400">
                  Current Plan
                </p>
                <p className="text-lg font-bold text-gray-900 dark:text-white truncate">
                  {activePlan ? activePlan.plan.title : "No Active Plan"}
                </p>
                <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                  {activePlan
                    ? `${activePlan.progress_percent}% Completed`
                    : "Browse Marketplace"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Calories Today */}
        <Card className="dark:bg-[#202731] border-none shadow-sm shadow-[#1a2027]/50">
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-xl text-gray-500 dark:text-gray-400 mt-1">
                <Flame className="w-6 h-6" />
              </div>
              <div className="w-full space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground dark:text-gray-400">
                  Calories Today
                </p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {todayIntake.toFixed(0)} kcal
                </p>
                <div className="w-full flex items-center gap-3 mt-2">
                  <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${progressPercentage > 100 ? "bg-red-500" : "bg-emerald-500"}`}
                      style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground dark:text-gray-400">
                    {progressPercentage.toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Remaining Calories */}
        <Card className="dark:bg-[#202731] border-none shadow-sm shadow-[#1a2027]/50">
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-xl text-gray-500 dark:text-gray-400 mt-1">
                <Target className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground dark:text-gray-400">
                  Remaining
                </p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {remainingCalories.toFixed(0)} kcal
                </p>
                <p className="text-sm text-muted-foreground dark:text-gray-400">
                  Daily goal: {dailyTarget} kcal
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Next Consultation */}
        <Card className="dark:bg-[#202731] border-none shadow-sm shadow-[#1a2027]/50">
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-xl text-gray-500 dark:text-gray-400 mt-1">
                <RotateCw className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground dark:text-gray-400">
                  Next Consultation
                </p>
                {nextConsultation ? (
                  <>
                    <p className="text-lg font-bold text-gray-900 dark:text-white truncate">
                      {new Date(
                        nextConsultation.appointment_date,
                      ).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                      , {nextConsultation.start_time}
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
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      None Scheduled
                    </p>
                    <Link
                      href="/client/consultations"
                      className="text-sm text-emerald-600 dark:text-emerald-400 font-medium hover:underline"
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart Area */}
        <Card className="lg:col-span-2 dark:bg-[#202731] border-none shadow-sm shadow-[#1a2027]/50">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 tracking-wide">
              Weekly Progress: Intake vs Target
            </h2>
            <div className="w-full h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 20, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#374151"
                    className="opacity-30"
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#9ca3af", fontSize: 13 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    ticks={[0, 600, 1200, 1800, 2400, 3000]}
                    tick={{ fill: "#9ca3af", fontSize: 13 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1f2937",
                      border: "none",
                      borderRadius: "8px",
                      color: "#fff",
                    }}
                    itemStyle={{ color: "#10b981" }}
                  />
                  <ReferenceLine
                    y={dailyTarget}
                    stroke="#9ca3af"
                    strokeDasharray="3 3"
                    label={{
                      position: "insideTopLeft",
                      value: "Target",
                      fill: "#9ca3af",
                      fontSize: 13,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="intake"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions (Unchanged) */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2 tracking-wide lg:mb-1 lg:mt-0 mt-4">
            Quick Actions
          </h2>

          <Button
            variant="outline"
            asChild
            className="w-full h-auto py-6 flex flex-col items-center justify-center gap-3 border-none bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all rounded-xl"
          >
            <Link href="/client/calorie-tracker">
              <Camera className="w-8 h-8 text-white mb-1" />
              <span className="text-base font-semibold">Upload Meal</span>
            </Link>
          </Button>

          <Button
            variant="outline"
            asChild
            className="w-full h-auto py-6 flex flex-col items-center justify-center gap-3 border-none bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all rounded-xl"
          >
            <Link href="/client/consultations">
              <Calendar className="w-8 h-8 text-white mb-1" />
              <span className="text-base font-semibold">Book Consultation</span>
            </Link>
          </Button>

          <Button
            variant="outline"
            asChild
            className="w-full h-auto py-6 flex flex-col items-center justify-center gap-3 border-none bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all rounded-xl"
          >
            <Link href="/client/meal-plans">
              <ListTodo className="w-8 h-8 text-white mb-1" />
              <span className="text-base font-semibold">View Digital Plan</span>
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
