"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, CheckCircle, ChevronRight, BookOpen, AlertCircle } from "lucide-react";
import Link from "next/link";

interface CheckedMeals {
  breakfast: boolean;
  lunch: boolean;
  dinner: boolean;
  snacks: boolean[];
}

export default function MealPlanDetailPage() {
  const { id } = useParams();
  const [content, setContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [advancing, setAdvancing] = useState(false);
  const [checkedMeals, setCheckedMeals] = useState<CheckedMeals>({
    breakfast: false,
    lunch: false,
    dinner: false,
    snacks: [],
  });

  const fetchContent = useCallback(async (retryCount = 0) => {
    let hasError = false;
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/client/user-plans/${id}/content/`);
      setContent(response.data);
      
      // Initialize snacks state based on response length
      const snacksCount = response.data?.snacks?.length || 0;
      setCheckedMeals({
        breakfast: false,
        lunch: false,
        dinner: false,
        snacks: new Array(snacksCount).fill(false),
      });
    } catch (err) {
      hasError = true;
      if (retryCount < 1) {
        console.warn("Failed to fetch plan content, retrying in 1.5s...");
        setTimeout(() => fetchContent(retryCount + 1), 1500);
      } else {
        console.error("Failed to fetch plan content after retry", err);
        setError("Failed to load your meal plan for today. Please try again later.");
      }
    } finally {
      // If we are retrying, don't set loading to false yet
      if (retryCount === 1 || !hasError) setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    let isMounted = true;
    if (id) {
      fetchContent();
    }
    return () => { isMounted = false; };
  }, [id, fetchContent]);

  const handleAdvance = async () => {
    setAdvancing(true);
    try {
      await api.patch(`/client/user-plans/${id}/advance/`);
      // Re-fetch next day logic, this will automatically uncheck meals since fetchContent resets the state
      await fetchContent();
    } catch (error) {
      console.error("Failed to advance", error);
      alert("Failed to advance day. Please try again.");
    } finally {
      setAdvancing(false);
    }
  };

  const handleSnackChange = (index: number, checked: boolean) => {
    // TODO: Future backend integration for saving individual checking state immediately
    setCheckedMeals(prev => {
      const newSnacks = [...prev.snacks];
      newSnacks[index] = checked;
      return { ...prev, snacks: newSnacks };
    });
  };

  const handleMealChange = (meal: 'breakfast' | 'lunch' | 'dinner', checked: boolean) => {
    // TODO: Future backend integration for saving individual checking state immediately
    setCheckedMeals(prev => ({ ...prev, [meal]: checked }));
  };

  const isAllComplete = 
    Boolean(content) &&
    (!content.breakfast || checkedMeals.breakfast) &&
    (!content.lunch || checkedMeals.lunch) &&
    (!content.dinner || checkedMeals.dinner) &&
    (!content.snacks || checkedMeals.snacks.every(Boolean));

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
              <h2 className="text-xl font-bold text-destructive">Oops, something went wrong</h2>
              <p className="text-destructive/80">{error}</p>
            </div>
            <Button onClick={() => fetchContent()} variant="outline" className="mt-4 border-destructive/30 text-destructive hover:bg-destructive/10">
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
        <Link href="/client/meal-plans" className="hover:text-foreground">Meal Plans</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-foreground">Plan #{id as string}</span>
      </div>

      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Day {content.day_index + 1}</h1>
          <p className="text-muted-foreground mt-1">Today's customized nutritional guide.</p>
        </div>
        <Button 
          onClick={handleAdvance} 
          disabled={!isAllComplete || advancing} 
          className={`shadow-sm transition-all ${isAllComplete ? '' : 'bg-secondary text-muted-foreground hover:bg-secondary border-none cursor-not-allowed'}`}
        >
          {advancing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
          Next Day
        </Button>
      </div>

      {content.instructions && (
        <Card className="bg-accent border-accent shadow-sm">
          <CardContent className="p-4 flex gap-4 items-start">
            <BookOpen className="w-6 h-6 text-primary shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-primary mb-1">Nutritionist Notes</h3>
              <p className="text-accent-foreground text-sm leading-relaxed">{content.instructions}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        {/* Breakfast */}
        <Card className={`transition-all duration-200 shadow-sm ${checkedMeals.breakfast ? 'bg-muted/50 border-primary/30' : ''}`}>
          <CardHeader className="pb-3 border-b border-border flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-lg text-card-foreground">Breakfast</CardTitle>
            <Checkbox 
              checked={checkedMeals.breakfast}
              onCheckedChange={(c) => handleMealChange('breakfast', c as boolean)}
              className={checkedMeals.breakfast ? "data-[state=checked]:bg-primary data-[state=checked]:border-none text-white focus-visible:ring-offset-0" : "focus-visible:ring-offset-0"}
            />
          </CardHeader>
          <CardContent className={`pt-4 ${checkedMeals.breakfast ? 'opacity-60 grayscale-[50%]' : ''}`}>
            <div className="flex justify-between items-start mb-2">
              <span className={`font-medium ${checkedMeals.breakfast ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                {content.breakfast?.name}
              </span>
              <span className="text-primary font-bold text-sm bg-accent px-2 py-1 rounded">
                {content.breakfast?.calories} kcal
              </span>
            </div>
            {content.breakfast?.notes && <p className="text-sm text-muted-foreground mt-2">{content.breakfast.notes}</p>}
          </CardContent>
        </Card>

        {/* Lunch */}
        <Card className={`transition-all duration-200 shadow-sm ${checkedMeals.lunch ? 'bg-muted/50 border-primary/30' : ''}`}>
          <CardHeader className="pb-3 border-b border-border flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-lg text-card-foreground">Lunch</CardTitle>
            <Checkbox 
              checked={checkedMeals.lunch}
              onCheckedChange={(c) => handleMealChange('lunch', c as boolean)}
              className={checkedMeals.lunch ? "data-[state=checked]:bg-primary data-[state=checked]:border-none text-white focus-visible:ring-offset-0" : "focus-visible:ring-offset-0"}
            />
          </CardHeader>
          <CardContent className={`pt-4 ${checkedMeals.lunch ? 'opacity-60 grayscale-[50%]' : ''}`}>
            <div className="flex justify-between items-start mb-2">
              <span className={`font-medium ${checkedMeals.lunch ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                {content.lunch?.name}
              </span>
              <span className="text-primary font-bold text-sm bg-accent px-2 py-1 rounded">
                {content.lunch?.calories} kcal
              </span>
            </div>
            {content.lunch?.notes && <p className="text-sm text-muted-foreground mt-2">{content.lunch.notes}</p>}
          </CardContent>
        </Card>

        {/* Dinner */}
        <Card className={`transition-all duration-200 shadow-sm ${checkedMeals.dinner ? 'bg-muted/50 border-primary/30' : ''}`}>
          <CardHeader className="pb-3 border-b border-border flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-lg text-card-foreground">Dinner</CardTitle>
            <Checkbox 
              checked={checkedMeals.dinner}
              onCheckedChange={(c) => handleMealChange('dinner', c as boolean)}
              className={checkedMeals.dinner ? "data-[state=checked]:bg-primary data-[state=checked]:border-none text-white focus-visible:ring-offset-0" : "focus-visible:ring-offset-0"}
            />
          </CardHeader>
          <CardContent className={`pt-4 ${checkedMeals.dinner ? 'opacity-60 grayscale-[50%]' : ''}`}>
            <div className="flex justify-between items-start mb-2">
              <span className={`font-medium ${checkedMeals.dinner ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                {content.dinner?.name}
              </span>
              <span className="text-primary font-bold text-sm bg-accent px-2 py-1 rounded">
                {content.dinner?.calories} kcal
              </span>
            </div>
            {content.dinner?.notes && <p className="text-sm text-muted-foreground mt-2">{content.dinner.notes}</p>}
          </CardContent>
        </Card>
      </div>

      {Array.isArray(content.snacks) && content.snacks.length > 0 && (
        <Card className="mt-6 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-card-foreground">Snacks</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {content.snacks.map((snack: any, idx: number) => {
                const isChecked = checkedMeals.snacks[idx];
                return (
                  <li key={idx} className={`flex items-center gap-4 py-3 border-b border-border last:border-0 transition-all ${isChecked ? 'opacity-60 grayscale-[50%]' : ''}`}>
                    <Checkbox 
                      checked={isChecked}
                      onCheckedChange={(c) => handleSnackChange(idx, c as boolean)}
                      className={isChecked ? "data-[state=checked]:bg-primary data-[state=checked]:border-none text-white focus-visible:ring-offset-0" : "focus-visible:ring-offset-0"}
                    />
                    <div className="flex-1 flex justify-between items-center">
                      <span className={`${isChecked ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{snack.name}</span>
                      <span className="text-sm text-muted-foreground font-medium">{snack.calories} kcal</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
