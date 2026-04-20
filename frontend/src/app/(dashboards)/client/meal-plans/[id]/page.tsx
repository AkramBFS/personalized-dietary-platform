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
        <Skeleton className="h-4 w-48 mb-4 bg-gray-200 dark:bg-gray-800" />
        <div className="flex justify-between items-end mb-6">
          <div className="space-y-2">
            <Skeleton className="h-10 w-32 bg-gray-200 dark:bg-gray-800" />
            <Skeleton className="h-4 w-64 bg-gray-200 dark:bg-gray-800" />
          </div>
          <Skeleton className="h-10 w-40 bg-gray-200 dark:bg-gray-800" />
        </div>
        <Skeleton className="h-24 w-full bg-gray-200 dark:bg-gray-800" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          <Skeleton className="h-40 w-full bg-gray-200 dark:bg-gray-800" />
          <Skeleton className="h-40 w-full bg-gray-200 dark:bg-gray-800" />
          <Skeleton className="h-40 w-full bg-gray-200 dark:bg-gray-800" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto mt-10">
        <Card className="border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/10 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center p-10 text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-red-500" />
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-red-700 dark:text-red-400">Oops, something went wrong</h2>
              <p className="text-red-600 dark:text-red-300">{error}</p>
            </div>
            <Button onClick={() => fetchContent()} variant="outline" className="mt-4 border-red-200 text-red-700 hover:bg-red-100">
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
        <span className="text-foreground dark:text-white">Plan #{id as string}</span>
      </div>

      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Day {content.day_index + 1}</h1>
          <p className="text-muted-foreground dark:text-gray-400 mt-1">Today's customized nutritional guide.</p>
        </div>
        <Button 
          onClick={handleAdvance} 
          disabled={!isAllComplete || advancing} 
          className={`shadow-sm transition-all ${isAllComplete ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-gray-200 text-gray-500 hover:bg-gray-200 border-none dark:bg-[#1a2027]/80 dark:hover:bg-[#1a2027]/80 dark:text-gray-500 cursor-not-allowed'}`}
        >
          {advancing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
          Next Day
        </Button>
      </div>

      {content.instructions && (
        <Card className="bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900 shadow-sm">
          <CardContent className="p-4 flex gap-4 items-start">
            <BookOpen className="w-6 h-6 text-emerald-500 shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-emerald-900 dark:text-emerald-400 mb-1">Nutritionist Notes</h3>
              <p className="text-emerald-800 dark:text-emerald-300 text-sm leading-relaxed">{content.instructions}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        {/* Breakfast */}
        <Card className={`transition-all duration-200 shadow-sm ${checkedMeals.breakfast ? 'bg-gray-50/50 dark:bg-[#1a2027]/50 border-emerald-200 dark:border-emerald-800/50' : 'dark:bg-[#1a2027] border-gray-200 dark:border-[#2a3038]'}`}>
          <CardHeader className="pb-3 border-b border-gray-100 dark:border-gray-800 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-lg dark:text-white">Breakfast</CardTitle>
            <Checkbox 
              checked={checkedMeals.breakfast}
              onCheckedChange={(c) => handleMealChange('breakfast', c as boolean)}
              className={checkedMeals.breakfast ? "data-[state=checked]:bg-emerald-500 data-[state=checked]:border-none text-white focus-visible:ring-offset-0" : "focus-visible:ring-offset-0"}
            />
          </CardHeader>
          <CardContent className={`pt-4 ${checkedMeals.breakfast ? 'opacity-60 grayscale-[50%]' : ''}`}>
            <div className="flex justify-between items-start mb-2">
              <span className={`font-medium ${checkedMeals.breakfast ? 'line-through text-gray-500 dark:text-gray-400' : 'dark:text-gray-200'}`}>
                {content.breakfast?.name}
              </span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold text-sm bg-emerald-50 dark:bg-emerald-950/30 px-2 py-1 rounded">
                {content.breakfast?.calories} kcal
              </span>
            </div>
            {content.breakfast?.notes && <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{content.breakfast.notes}</p>}
          </CardContent>
        </Card>

        {/* Lunch */}
        <Card className={`transition-all duration-200 shadow-sm ${checkedMeals.lunch ? 'bg-gray-50/50 dark:bg-[#1a2027]/50 border-emerald-200 dark:border-emerald-800/50' : 'dark:bg-[#1a2027] border-gray-200 dark:border-[#2a3038]'}`}>
          <CardHeader className="pb-3 border-b border-gray-100 dark:border-gray-800 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-lg dark:text-white">Lunch</CardTitle>
            <Checkbox 
              checked={checkedMeals.lunch}
              onCheckedChange={(c) => handleMealChange('lunch', c as boolean)}
              className={checkedMeals.lunch ? "data-[state=checked]:bg-emerald-500 data-[state=checked]:border-none text-white focus-visible:ring-offset-0" : "focus-visible:ring-offset-0"}
            />
          </CardHeader>
          <CardContent className={`pt-4 ${checkedMeals.lunch ? 'opacity-60 grayscale-[50%]' : ''}`}>
            <div className="flex justify-between items-start mb-2">
              <span className={`font-medium ${checkedMeals.lunch ? 'line-through text-gray-500 dark:text-gray-400' : 'dark:text-gray-200'}`}>
                {content.lunch?.name}
              </span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold text-sm bg-emerald-50 dark:bg-emerald-950/30 px-2 py-1 rounded">
                {content.lunch?.calories} kcal
              </span>
            </div>
            {content.lunch?.notes && <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{content.lunch.notes}</p>}
          </CardContent>
        </Card>

        {/* Dinner */}
        <Card className={`transition-all duration-200 shadow-sm ${checkedMeals.dinner ? 'bg-gray-50/50 dark:bg-[#1a2027]/50 border-emerald-200 dark:border-emerald-800/50' : 'dark:bg-[#1a2027] border-gray-200 dark:border-[#2a3038]'}`}>
          <CardHeader className="pb-3 border-b border-gray-100 dark:border-gray-800 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-lg dark:text-white">Dinner</CardTitle>
            <Checkbox 
              checked={checkedMeals.dinner}
              onCheckedChange={(c) => handleMealChange('dinner', c as boolean)}
              className={checkedMeals.dinner ? "data-[state=checked]:bg-emerald-500 data-[state=checked]:border-none text-white focus-visible:ring-offset-0" : "focus-visible:ring-offset-0"}
            />
          </CardHeader>
          <CardContent className={`pt-4 ${checkedMeals.dinner ? 'opacity-60 grayscale-[50%]' : ''}`}>
            <div className="flex justify-between items-start mb-2">
              <span className={`font-medium ${checkedMeals.dinner ? 'line-through text-gray-500 dark:text-gray-400' : 'dark:text-gray-200'}`}>
                {content.dinner?.name}
              </span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold text-sm bg-emerald-50 dark:bg-emerald-950/30 px-2 py-1 rounded">
                {content.dinner?.calories} kcal
              </span>
            </div>
            {content.dinner?.notes && <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{content.dinner.notes}</p>}
          </CardContent>
        </Card>
      </div>

      {content.snacks && content.snacks.length > 0 && (
        <Card className="dark:bg-[#1a2027] border-gray-200 dark:border-[#2a3038] mt-6 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg dark:text-white">Snacks</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {content.snacks.map((snack: any, idx: number) => {
                const isChecked = checkedMeals.snacks[idx];
                return (
                  <li key={idx} className={`flex items-center gap-4 py-3 border-b border-gray-100 dark:border-gray-800 last:border-0 transition-all ${isChecked ? 'opacity-60 grayscale-[50%]' : ''}`}>
                    <Checkbox 
                      checked={isChecked}
                      onCheckedChange={(c) => handleSnackChange(idx, c as boolean)}
                      className={isChecked ? "data-[state=checked]:bg-emerald-500 data-[state=checked]:border-none text-white focus-visible:ring-offset-0" : "focus-visible:ring-offset-0"}
                    />
                    <div className="flex-1 flex justify-between items-center">
                      <span className={`${isChecked ? 'line-through text-gray-500 dark:text-gray-400' : 'dark:text-gray-200'}`}>{snack.name}</span>
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
