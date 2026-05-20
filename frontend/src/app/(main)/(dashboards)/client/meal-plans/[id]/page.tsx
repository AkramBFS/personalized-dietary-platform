"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Loader2,
  CheckCircle,
  ChevronRight,
  BookOpen,
  AlertCircle,
  ChevronLeft,
} from "lucide-react";
import Link from "next/link";
import {
  getMealPlanDayContent,
  advanceMealPlanDay,
  MealPlanDayContent,
} from "@/lib/client";

interface CheckedMeals {
  breakfast: boolean;
  lunch: boolean;
  dinner: boolean;
  snacks: boolean[];
}

export default function MealPlanDetailPage() {
  const { id } = useParams();
  const [content, setContent] = useState<MealPlanDayContent | null>(null);
  const [currentDayIndex, setCurrentDayIndex] = useState<number>(0);
  const [viewingDayIndex, setViewingDayIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [advancing, setAdvancing] = useState(false);
  const [checkedMeals, setCheckedMeals] = useState<CheckedMeals>({
    breakfast: false,
    lunch: false,
    dinner: false,
    snacks: [false],
  });

  const fetchContent = useCallback(
    async (dayIdx?: number, retryCount = 0) => {
      try {
        setLoading(true);
        setError(null);
        const data = await getMealPlanDayContent(Number(id), dayIdx);
        setContent(data);
        if (dayIdx === undefined) {
          setCurrentDayIndex(data.day_index);
          setViewingDayIndex(data.day_index);
        }

        setCheckedMeals({
          breakfast: false,
          lunch: false,
          dinner: false,
          snacks: [false],
        });
      } catch (err) {
        if (retryCount < 1) {
          console.warn("Failed to fetch plan content, retrying...");
          setTimeout(() => fetchContent(dayIdx, retryCount + 1), 1500);
        } else {
          console.error("Failed to fetch plan content after retry", err);
          setError("Failed to load your meal plan. Please try again later.");
        }
      } finally {
        if (retryCount === 1 || !error) setLoading(false);
      }
    },
    [id, error],
  );

  useEffect(() => {
    let isMounted = true;
    if (id) {
      fetchContent();
    }
    return () => {
      isMounted = false;
    };
  }, [id, fetchContent]);

  const handleAdvance = async () => {
    if (!id) return;
    setAdvancing(true);
    try {
      const res = await advanceMealPlanDay(Number(id));
      setCurrentDayIndex(res.day_index);
      setViewingDayIndex(res.day_index);
      await fetchContent(res.day_index);
    } catch (error) {
      console.error("Failed to advance", error);
      alert("Failed to advance day. Please try again.");
    } finally {
      setAdvancing(false);
    }
  };

  const handleNavigate = (direction: "prev" | "next") => {
    if (viewingDayIndex === null) return;
    const nextIdx =
      direction === "next" ? viewingDayIndex + 1 : viewingDayIndex - 1;
    if (nextIdx < 0) return;
    setViewingDayIndex(nextIdx);
    fetchContent(nextIdx);
  };

  const handleSnackChange = (index: number, checked: boolean) => {
    // TODO: Future backend integration for saving individual checking state immediately
    setCheckedMeals((prev) => {
      const newSnacks = [...prev.snacks];
      newSnacks[index] = checked;
      return { ...prev, snacks: newSnacks };
    });
  };

  const handleMealChange = (
    meal: "breakfast" | "lunch" | "dinner",
    checked: boolean,
  ) => {
    // TODO: Future backend integration for saving individual checking state immediately
    setCheckedMeals((prev) => ({ ...prev, [meal]: checked }));
  };

  const isAllComplete =
    Boolean(content) &&
    checkedMeals.breakfast &&
    checkedMeals.lunch &&
    checkedMeals.dinner &&
    checkedMeals.snacks[0];

  const isViewingCurrentDay = viewingDayIndex === currentDayIndex;

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-4 w-48 mb-4 bg-secondary" />
        <div className="flex justify-between items-end mb-6">
          <div className="space-y-2">
            <Skeleton className="h-10 w-32 bg-secondary" />
            <Skeleton className="h-4 w-64 bg-secondary" />
          </div>
          <Skeleton className="h-10 w-40 bg-secondary" />
        </div>
        <Skeleton className="h-24 w-full bg-secondary" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          <Skeleton className="h-40 w-full bg-secondary" />
          <Skeleton className="h-40 w-full bg-secondary" />
          <Skeleton className="h-40 w-full bg-secondary" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto mt-10">
        <Card className="border-destructive/30 bg-destructive/5 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center p-10 text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-destructive" />
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-destructive">
                Oops, something went wrong
              </h2>
              <p className="text-destructive/80">{error}</p>
            </div>
            <Button
              onClick={() => fetchContent()}
              variant="outline"
              className="mt-4 border-destructive/30 text-destructive hover:bg-destructive/10"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!content) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <Link href="/client/meal-plans" className="hover:text-foreground">
          Meal Plans
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-foreground">Plan #{id as string}</span>
      </div>

      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleNavigate("prev")}
              disabled={viewingDayIndex === 0 || loading}
              className="rounded-full"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Day {(viewingDayIndex ?? 0) + 1}
            </h1>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleNavigate("next")}
              disabled={loading}
              className="rounded-full"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-muted-foreground mt-1">
            {isViewingCurrentDay
              ? "Today's customized nutritional guide."
              : "Viewing a different day's plan."}
          </p>
        </div>

        {isViewingCurrentDay && (
          <Button
            onClick={handleAdvance}
            disabled={!isAllComplete || advancing}
            className={`shadow-lg h-12 px-6 rounded-xl transition-all ${isAllComplete ? "bg-primary hover:scale-105" : "bg-secondary text-muted-foreground hover:bg-secondary border-none cursor-not-allowed opacity-50"}`}
          >
            {advancing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle className="w-4 h-4 mr-2" />
            )}
            Mark Day Complete
          </Button>
        )}
      </div>

      {content.instructions && (
        <Card className="bg-accent border-accent shadow-sm">
          <CardContent className="p-4 flex gap-4 items-start">
            <BookOpen className="w-6 h-6 text-primary shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-primary mb-1">
                Nutritionist Notes
              </h3>
              <p className="text-accent-foreground text-sm leading-relaxed">
                {content.instructions}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-4">
        {/* Breakfast */}
        <Card
          className={`transition-all duration-200 shadow-sm ${checkedMeals.breakfast ? "bg-muted/50 border-primary/30" : ""}`}
        >
          <CardHeader className="pb-3 border-b border-border flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Breakfast
            </CardTitle>
            <Checkbox
              checked={checkedMeals.breakfast}
              onCheckedChange={(c) =>
                handleMealChange("breakfast", c as boolean)
              }
              className={
                checkedMeals.breakfast
                  ? "data-[state=checked]:bg-primary data-[state=checked]:border-none text-white"
                  : ""
              }
            />
          </CardHeader>
          <CardContent
            className={`pt-4 ${checkedMeals.breakfast ? "opacity-60 grayscale-[50%]" : ""}`}
          >
            <h3
              className={`font-bold text-lg mb-1 ${checkedMeals.breakfast ? "line-through text-muted-foreground" : "text-foreground"}`}
            >
              {content.breakfast?.name}
            </h3>
            <div className="text-primary font-black text-xs bg-primary/10 w-fit px-2 py-1 rounded mb-3">
              {content.breakfast?.calories} KCAL
            </div>
            {content.breakfast?.ingredients?.length > 0 && (
              <div className="text-[12px] text-muted-foreground mt-2 border-t pt-2">
                <p className="font-bold uppercase tracking-tighter mb-1">
                  Ingredients:
                </p>
                <p>{content.breakfast.ingredients.join(", ")}</p>
              </div>
            )}
            {content.breakfast?.notes && (
              <p className="text-xs italic text-muted-foreground mt-2 border-t pt-2">
                &ldquo;{content.breakfast.notes}&rdquo;
              </p>
            )}
          </CardContent>
        </Card>

        {/* Lunch */}
        <Card
          className={`transition-all duration-200 shadow-sm ${checkedMeals.lunch ? "bg-muted/50 border-primary/30" : ""}`}
        >
          <CardHeader className="pb-3 border-b border-border flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Lunch
            </CardTitle>
            <Checkbox
              checked={checkedMeals.lunch}
              onCheckedChange={(c) => handleMealChange("lunch", c as boolean)}
              className={
                checkedMeals.lunch
                  ? "data-[state=checked]:bg-primary data-[state=checked]:border-none text-white"
                  : ""
              }
            />
          </CardHeader>
          <CardContent
            className={`pt-4 ${checkedMeals.lunch ? "opacity-60 grayscale-[50%]" : ""}`}
          >
            <h3
              className={`font-bold text-lg mb-1 ${checkedMeals.lunch ? "line-through text-muted-foreground" : "text-foreground"}`}
            >
              {content.lunch?.name}
            </h3>
            <div className="text-primary font-black text-xs bg-primary/10 w-fit px-2 py-1 rounded mb-3">
              {content.lunch?.calories} KCAL
            </div>
            {content.lunch?.ingredients?.length > 0 && (
              <div className="text-[12px] text-muted-foreground mt-2 border-t pt-2">
                <p className="font-bold uppercase tracking-tighter mb-1">
                  Ingredients:
                </p>
                <p>{content.lunch.ingredients.join(", ")}</p>
              </div>
            )}
            {content.lunch?.notes && (
              <p className="text-xs italic text-muted-foreground mt-2 border-t pt-2">
                &ldquo;{content.lunch.notes}&rdquo;
              </p>
            )}
          </CardContent>
        </Card>

        {/* Dinner */}
        <Card
          className={`transition-all duration-200 shadow-sm ${checkedMeals.dinner ? "bg-muted/50 border-primary/30" : ""}`}
        >
          <CardHeader className="pb-3 border-b border-border flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Dinner
            </CardTitle>
            <Checkbox
              checked={checkedMeals.dinner}
              onCheckedChange={(c) => handleMealChange("dinner", c as boolean)}
              className={
                checkedMeals.dinner
                  ? "data-[state=checked]:bg-primary data-[state=checked]:border-none text-white"
                  : ""
              }
            />
          </CardHeader>
          <CardContent
            className={`pt-4 ${checkedMeals.dinner ? "opacity-60 grayscale-[50%]" : ""}`}
          >
            <h3
              className={`font-bold text-lg mb-1 ${checkedMeals.dinner ? "line-through text-muted-foreground" : "text-foreground"}`}
            >
              {content.dinner?.name}
            </h3>
            <div className="text-primary font-black text-xs bg-primary/10 w-fit px-2 py-1 rounded mb-3">
              {content.dinner?.calories} KCAL
            </div>
            {content.dinner?.ingredients?.length > 0 && (
              <div className="text-[12px] text-muted-foreground mt-2 border-t pt-2">
                <p className="font-bold uppercase tracking-tighter mb-1">
                  Ingredients:
                </p>
                <p>{content.dinner.ingredients.join(", ")}</p>
              </div>
            )}
            {content.dinner?.notes && (
              <p className="text-xs italic text-muted-foreground mt-2 border-t pt-2">
                &ldquo;{content.dinner.notes}&rdquo;
              </p>
            )}
          </CardContent>
        </Card>

        {/* Snacks (Single Card now) */}
        <Card
          className={`transition-all duration-200 shadow-sm ${checkedMeals.snacks[0] ? "bg-muted/50 border-primary/30" : ""}`}
        >
          <CardHeader className="pb-3 border-b border-border flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Snacks
            </CardTitle>
            <Checkbox
              checked={checkedMeals.snacks[0]}
              onCheckedChange={(c) => handleSnackChange(0, c as boolean)}
              className={
                checkedMeals.snacks[0]
                  ? "data-[state=checked]:bg-primary data-[state=checked]:border-none text-white"
                  : ""
              }
            />
          </CardHeader>
          <CardContent
            className={`pt-4 ${checkedMeals.snacks[0] ? "opacity-60 grayscale-[50%]" : ""}`}
          >
            <h3
              className={`font-bold text-lg mb-1 ${checkedMeals.snacks[0] ? "line-through text-muted-foreground" : "text-foreground"}`}
            >
              {content.snacks?.name || "Daily Snacks"}
            </h3>
            <div className="text-primary font-black text-xs bg-primary/10 w-fit px-2 py-1 rounded mb-3">
              {content.snacks?.calories} KCAL
            </div>
            {content.snacks?.ingredients?.length > 0 && (
              <div className="text-[12px] text-muted-foreground mt-2 border-t pt-2">
                <p className="font-bold uppercase tracking-tighter mb-1">
                  Ingredients:
                </p>
                <p>{content.snacks.ingredients.join(", ")}</p>
              </div>
            )}
            {content.snacks?.notes && (
              <p className="text-xs italic text-muted-foreground mt-2 border-t pt-2">
                &ldquo;{content.snacks.notes}&rdquo;
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
