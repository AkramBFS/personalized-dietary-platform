"use client";

import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
  CardFooter,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowRight, ClipboardList, Calendar } from "lucide-react";
import Link from "next/link";

interface UserPlan {
  id: number;
  plan: {
    id: number;
    title: string;
    cover_image_url?: string;
    duration_days: number;
  };
  current_day_index: number;
  progress_percent: number;
  status: string;
  free_consultations_used: number;
}

export default function MealPlansPage() {
  const [plans, setPlans] = useState<UserPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await api.get("/client/user-plans/");
        setPlans(response.data.results || response.data || []);
      } catch (error) {
        console.error("Failed to fetch plans", error);
        // Mock fallback
        setPlans([
          {
            id: 1,
            plan: { id: 101, title: "Hormonal Balance", duration_days: 30 },
            current_day_index: 15,
            progress_percent: 50,
            status: "active",
            free_consultations_used: 1,
          },
          {
            id: 2,
            plan: { id: 102, title: "Detox 7-Day", duration_days: 7 },
            current_day_index: 7,
            progress_percent: 100,
            status: "completed",
            free_consultations_used: 0,
          },
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20">
      {/* Header Section with a more professional layout */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b pb-6">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground">
            My Meal Plans
          </h1>
          <p className="text-lg text-muted-foreground mt-2">
            Manage your nutrition journey and track your daily progress.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-24 space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-muted-foreground animate-pulse">
            Loading your nutrition data...
          </p>
        </div>
      ) : plans.length === 0 ? (
        <Card className="border-dashed bg-muted/30">
          <CardContent className="p-16 text-center">
            <div className="bg-background w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border">
              <ClipboardList className="w-10 h-10 text-muted-foreground/40" />
            </div>
            <h3 className="text-xl font-semibold">No active plans</h3>
            <p className="text-muted-foreground max-w-sm mx-auto mt-2">
              You haven't subscribed to any meal plans yet. Start your journey
              with a professional consultation.
            </p>
            <Button
              className="mt-8 px-8"
              asChild
            >
              <Link href="/client/consultations">Book a Consultation</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {plans.map((userPlan) => (
            <Card
              key={userPlan.id}
              className="group overflow-hidden flex flex-col border-muted-foreground/10 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300"
            >
              {/* Card Visual Header */}
              <div className="h-40 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent flex items-center justify-center relative overflow-hidden">
                {/* Decorative background element */}
                <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                  <ClipboardList className="w-32 h-32" />
                </div>

                <Badge
                  className="absolute top-4 right-4 capitalize backdrop-blur-md bg-card/80 text-primary border-primary/30"
                  variant="outline"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mr-2 animate-pulse" />
                  {userPlan.status}
                </Badge>

                <div className="bg-background/80 backdrop-blur-sm p-3 rounded-2xl shadow-sm border border-border/20">
                  <ClipboardList className="w-8 h-8 text-primary" />
                </div>
              </div>

              <CardHeader className="space-y-1">
                <CardTitle className="text-xl group-hover:text-primary transition-colors">
                  {userPlan.plan.title}
                </CardTitle>
                <CardDescription className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  Day {userPlan.current_day_index + 1} of{" "}
                  {userPlan.plan.duration_days}
                </CardDescription>
              </CardHeader>

              <CardContent className="flex-1 space-y-6">
                {/* Progress Section */}
                <div className="space-y-3">
                  <div className="flex justify-between items-end">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Completion
                    </span>
                    <span className="text-sm font-bold">
                      {Math.round(userPlan.progress_percent)}%
                    </span>
                  </div>
                  <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden border border-inner">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${userPlan.progress_percent}%` }}
                    />
                  </div>
                </div>

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-2 gap-4 py-4 border-y border-dashed">
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase font-semibold text-muted-foreground">
                      Status
                    </p>
                    <p className="text-sm font-medium italic">Active Plan</p>
                  </div>
                  <div className="space-y-1 border-l pl-4">
                    <p className="text-[10px] uppercase font-semibold text-muted-foreground">
                      Updated
                    </p>
                    <p className="text-sm font-medium text-foreground">Today</p>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="bg-muted/30 p-4">
                <Button
                  asChild
                  className="w-full shadow-lg shadow-primary/20 group/btn"
                >
                  <Link href={`/client/meal-plans/${userPlan.id}`}>
                    View Daily Schedule
                    <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
