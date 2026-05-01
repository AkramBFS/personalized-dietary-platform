"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  ArrowLeft,
  Flame,
  Beef,
  Wheat,
  Droplets,
  UtensilsCrossed,
  Coffee,
  Sun,
  Moon,
  Cookie,
} from "lucide-react";

// --- Mock Data ---
interface FoodItem {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  mass_grams: number;
}

interface MealGroup {
  type: "breakfast" | "lunch" | "dinner" | "snack";
  items: FoodItem[];
}

interface DayLog {
  date: string;
  meals: MealGroup[];
  calorieGoal: number;
}

const MOCK_HISTORY: Record<string, DayLog> = {
  "2026-04-13": {
    date: "2026-04-13",
    calorieGoal: 2000,
    meals: [
      { type: "breakfast", items: [
        { name: "Avocado Toast", calories: 280, protein: 8, carbs: 30, fat: 16, mass_grams: 180 },
        { name: "Scrambled Eggs (2)", calories: 182, protein: 13, carbs: 2, fat: 14, mass_grams: 120 },
      ]},
      { type: "lunch", items: [
        { name: "Grilled Chicken Salad", calories: 420, protein: 38, carbs: 12, fat: 24, mass_grams: 320 },
        { name: "Whole Wheat Bread", calories: 100, protein: 4, carbs: 18, fat: 2, mass_grams: 40 },
      ]},
      { type: "dinner", items: [] },
      { type: "snack", items: [
        { name: "Greek Yogurt", calories: 130, protein: 12, carbs: 8, fat: 5, mass_grams: 150 },
      ]},
    ],
  },
  "2026-04-12": {
    date: "2026-04-12",
    calorieGoal: 2000,
    meals: [
      { type: "breakfast", items: [
        { name: "Oatmeal with Berries", calories: 310, protein: 10, carbs: 52, fat: 8, mass_grams: 250 },
        { name: "Black Coffee", calories: 5, protein: 0, carbs: 1, fat: 0, mass_grams: 240 },
      ]},
      { type: "lunch", items: [
        { name: "Salmon Fillet", calories: 350, protein: 34, carbs: 0, fat: 22, mass_grams: 170 },
        { name: "Steamed Broccoli", calories: 55, protein: 4, carbs: 10, fat: 1, mass_grams: 100 },
        { name: "Brown Rice", calories: 215, protein: 5, carbs: 45, fat: 2, mass_grams: 170 },
      ]},
      { type: "dinner", items: [
        { name: "Chicken Stir-Fry", calories: 480, protein: 35, carbs: 28, fat: 22, mass_grams: 350 },
      ]},
      { type: "snack", items: [
        { name: "Almonds (handful)", calories: 160, protein: 6, carbs: 6, fat: 14, mass_grams: 28 },
        { name: "Apple", calories: 95, protein: 0, carbs: 25, fat: 0, mass_grams: 180 },
      ]},
    ],
  },
  "2026-04-11": {
    date: "2026-04-11",
    calorieGoal: 2000,
    meals: [
      { type: "breakfast", items: [
        { name: "Protein Smoothie", calories: 340, protein: 28, carbs: 38, fat: 8, mass_grams: 400 },
      ]},
      { type: "lunch", items: [
        { name: "Turkey Wrap", calories: 390, protein: 28, carbs: 35, fat: 14, mass_grams: 280 },
        { name: "Mixed Green Salad", calories: 80, protein: 3, carbs: 8, fat: 4, mass_grams: 120 },
      ]},
      { type: "dinner", items: [
        { name: "Beef Steak", calories: 520, protein: 44, carbs: 0, fat: 36, mass_grams: 220 },
        { name: "Baked Potato", calories: 160, protein: 4, carbs: 37, fat: 0, mass_grams: 180 },
        { name: "Caesar Salad", calories: 180, protein: 6, carbs: 10, fat: 14, mass_grams: 150 },
      ]},
      { type: "snack", items: [
        { name: "Protein Bar", calories: 210, protein: 20, carbs: 22, fat: 8, mass_grams: 60 },
      ]},
    ],
  },
  "2026-04-10": {
    date: "2026-04-10",
    calorieGoal: 2000,
    meals: [
      { type: "breakfast", items: [
        { name: "Pancakes (3)", calories: 420, protein: 10, carbs: 60, fat: 16, mass_grams: 200 },
        { name: "Maple Syrup", calories: 52, protein: 0, carbs: 13, fat: 0, mass_grams: 20 },
      ]},
      { type: "lunch", items: [
        { name: "Tuna Sandwich", calories: 380, protein: 30, carbs: 34, fat: 12, mass_grams: 260 },
      ]},
      { type: "dinner", items: [
        { name: "Pasta Bolognese", calories: 580, protein: 28, carbs: 68, fat: 20, mass_grams: 380 },
        { name: "Garlic Bread", calories: 190, protein: 4, carbs: 22, fat: 10, mass_grams: 60 },
      ]},
      { type: "snack", items: [
        { name: "Banana", calories: 105, protein: 1, carbs: 27, fat: 0, mass_grams: 120 },
      ]},
    ],
  },
};

// --- Helpers ---
function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}
function getToday(): string { return new Date().toISOString().split("T")[0]; }
function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr + "T00:00:00");
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0];
}
function isToday(dateStr: string): boolean { return dateStr === getToday(); }

// Meal type gradients kept hardcoded — semantic data visualization colors
const MEAL_CONFIG = {
  breakfast: { label: "Breakfast", icon: Coffee, gradient: "from-amber-500 to-orange-500", bg: "bg-amber-50 dark:bg-amber-950/20", text: "text-amber-600 dark:text-amber-400", border: "border-amber-100 dark:border-amber-900/30" },
  lunch: { label: "Lunch", icon: Sun, gradient: "from-emerald-500 to-teal-500", bg: "bg-emerald-50 dark:bg-emerald-950/20", text: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-100 dark:border-emerald-900/30" },
  dinner: { label: "Dinner", icon: Moon, gradient: "from-violet-500 to-purple-500", bg: "bg-violet-50 dark:bg-violet-950/20", text: "text-violet-600 dark:text-violet-400", border: "border-violet-100 dark:border-violet-900/30" },
  snack: { label: "Snacks", icon: Cookie, gradient: "from-rose-500 to-pink-500", bg: "bg-rose-50 dark:bg-rose-950/20", text: "text-rose-600 dark:text-rose-400", border: "border-rose-100 dark:border-rose-900/30" },
};

export default function CalorieHistoryPage() {
  const [selectedDate, setSelectedDate] = useState(getToday());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateInput, setDateInput] = useState(selectedDate);

  const dayLog = MOCK_HISTORY[selectedDate] ?? null;

  const totals = useMemo(() => {
    if (!dayLog) return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    return dayLog.meals.reduce((acc, meal) => {
      meal.items.forEach((item) => { acc.calories += item.calories; acc.protein += item.protein; acc.carbs += item.carbs; acc.fat += item.fat; });
      return acc;
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
  }, [dayLog]);

  const calorieGoal = dayLog?.calorieGoal ?? 2000;
  const caloriePercent = Math.min(Math.round((totals.calories / calorieGoal) * 100), 100);

  const goToPrevDay = () => setSelectedDate((d) => addDays(d, -1));
  const goToNextDay = () => { const next = addDays(selectedDate, 1); if (next <= getToday()) setSelectedDate(next); };
  const handleDateJump = () => { if (dateInput && dateInput <= getToday()) setSelectedDate(dateInput); setShowDatePicker(false); };

  const macroTotal = totals.protein + totals.carbs + totals.fat;
  const proteinPct = macroTotal > 0 ? Math.round((totals.protein / macroTotal) * 100) : 0;
  const carbsPct = macroTotal > 0 ? Math.round((totals.carbs / macroTotal) * 100) : 0;
  const fatPct = macroTotal > 0 ? 100 - proteinPct - carbsPct : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back Link & Title */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" asChild className="p-2">
          <Link href="/client/calorie-tracker"><ArrowLeft className="w-5 h-5" /></Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Meal History</h1>
          <p className="text-muted-foreground">Browse your daily nutrition logs</p>
        </div>
      </div>

      {/* Day Navigation Bar */}
      <Card>
        <CardContent className="py-4 px-5">
          <div className="flex items-center justify-between gap-4">
            <Button variant="ghost" onClick={goToPrevDay} className="flex items-center gap-1 text-sm font-medium px-3 py-2">
              <ChevronLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Previous</span>
            </Button>
            <div className="flex items-center gap-3 text-center">
              <button onClick={() => { setDateInput(selectedDate); setShowDatePicker(!showDatePicker); }} className="p-2 rounded-lg hover:bg-accent transition-colors text-primary" title="Jump to date">
                <CalendarDays className="w-5 h-5" />
              </button>
              <div>
                <p className="text-lg font-bold text-foreground">{isToday(selectedDate) ? "Today" : formatDate(selectedDate)}</p>
                {isToday(selectedDate) && <p className="text-xs text-muted-foreground">{formatDate(selectedDate)}</p>}
              </div>
            </div>
            <Button variant="ghost" onClick={goToNextDay} disabled={addDays(selectedDate, 1) > getToday()} className="flex items-center gap-1 text-sm font-medium px-3 py-2 disabled:opacity-30">
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>

          {/* Date Picker Dropdown */}
          {showDatePicker && (
            <div className="mt-4 pt-4 border-t border-border flex items-center gap-3 justify-center">
              <input type="date" value={dateInput} max={getToday()} onChange={(e) => setDateInput(e.target.value)} className="rounded-lg border border-border bg-background text-foreground px-4 py-2 text-sm focus:ring-2 focus:ring-ring outline-none" />
              <Button onClick={handleDateJump} size="sm" className="px-5">Go</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {!dayLog ? (
        /* Empty State */
        <Card>
          <CardContent className="py-16 flex flex-col items-center justify-center text-center">
            <div className="bg-secondary w-16 h-16 rounded-2xl flex items-center justify-center mb-4">
              <UtensilsCrossed className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">No meals logged</h3>
            <p className="text-muted-foreground max-w-sm">You didn't log any meals on this day. Use the calorie tracker to start logging your meals.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Daily Summary Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Calories */}
            <Card className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-2.5 rounded-xl"><Flame className="w-5 h-5 text-primary" /></div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Calories</p>
                    <p className="text-xl font-bold text-foreground">{totals.calories}<span className="text-xs font-normal text-muted-foreground ml-1">/ {calorieGoal}</span></p>
                  </div>
                </div>
                <div className="mt-3 h-2 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-700 ease-out" style={{ width: `${caloriePercent}%` }} />
                </div>
                <p className="text-xs text-muted-foreground mt-1.5 text-right">{caloriePercent}% of goal</p>
              </CardContent>
            </Card>

            {/* Protein — semantic blue kept */}
            <Card className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-500/10 p-2.5 rounded-xl"><Beef className="w-5 h-5 text-blue-500" /></div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Protein</p>
                    <p className="text-xl font-bold text-foreground">{totals.protein}g</p>
                  </div>
                </div>
                <div className="mt-3 h-2 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-700 ease-out" style={{ width: `${proteinPct}%` }} />
                </div>
                <p className="text-xs text-muted-foreground mt-1.5 text-right">{proteinPct}% of macros</p>
              </CardContent>
            </Card>

            {/* Carbs — semantic amber kept */}
            <Card className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="bg-amber-500/10 p-2.5 rounded-xl"><Wheat className="w-5 h-5 text-amber-500" /></div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Carbs</p>
                    <p className="text-xl font-bold text-foreground">{totals.carbs}g</p>
                  </div>
                </div>
                <div className="mt-3 h-2 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-700 ease-out" style={{ width: `${carbsPct}%` }} />
                </div>
                <p className="text-xs text-muted-foreground mt-1.5 text-right">{carbsPct}% of macros</p>
              </CardContent>
            </Card>

            {/* Fat — semantic rose kept */}
            <Card className="shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="bg-rose-500/10 p-2.5 rounded-xl"><Droplets className="w-5 h-5 text-rose-500" /></div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Fat</p>
                    <p className="text-xl font-bold text-foreground">{totals.fat}g</p>
                  </div>
                </div>
                <div className="mt-3 h-2 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-rose-500 to-pink-400 rounded-full transition-all duration-700 ease-out" style={{ width: `${fatPct}%` }} />
                </div>
                <p className="text-xs text-muted-foreground mt-1.5 text-right">{fatPct}% of macros</p>
              </CardContent>
            </Card>
          </div>

          {/* Meals Grouped */}
          <div className="space-y-4">
            {dayLog.meals.map((meal) => {
              const config = MEAL_CONFIG[meal.type];
              const Icon = config.icon;
              const mealCals = meal.items.reduce((s, i) => s + i.calories, 0);
              const mealProtein = meal.items.reduce((s, i) => s + i.protein, 0);
              const mealCarbs = meal.items.reduce((s, i) => s + i.carbs, 0);
              const mealFat = meal.items.reduce((s, i) => s + i.fat, 0);

              return (
                <Card key={meal.type} className="shadow-sm overflow-hidden">
                  <CardHeader className="pb-3 pt-4 px-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl bg-gradient-to-br ${config.gradient} text-white shadow-sm`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <CardTitle className="text-base text-card-foreground">{config.label}</CardTitle>
                          <p className="text-xs text-muted-foreground">{meal.items.length} item{meal.items.length !== 1 ? "s" : ""}</p>
                        </div>
                      </div>
                      {meal.items.length > 0 && (
                        <span className="text-lg font-bold text-foreground">{mealCals} <span className="text-xs font-normal text-muted-foreground">kcal</span></span>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0 px-5 pb-4">
                    {meal.items.length === 0 ? (
                      <div className={`rounded-xl p-4 ${config.bg} ${config.border} border text-center`}>
                        <p className={`text-sm font-medium ${config.text}`}>No {config.label.toLowerCase()} logged</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="rounded-xl border border-border overflow-hidden">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="bg-background">
                                <th className="text-left py-2.5 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Food</th>
                                <th className="text-right py-2.5 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Amount</th>
                                <th className="text-right py-2.5 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Cal</th>
                                <th className="text-right py-2.5 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden sm:table-cell">P</th>
                                <th className="text-right py-2.5 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden sm:table-cell">C</th>
                                <th className="text-right py-2.5 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden sm:table-cell">F</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                              {meal.items.map((item, idx) => (
                                <tr key={idx} className="hover:bg-accent transition-colors">
                                  <td className="py-2.5 px-4 font-medium text-foreground">{item.name}</td>
                                  <td className="py-2.5 px-3 text-right text-muted-foreground">{item.mass_grams}g</td>
                                  <td className="py-2.5 px-3 text-right font-semibold text-foreground">{item.calories}</td>
                                  <td className="py-2.5 px-3 text-right text-blue-600 dark:text-blue-400 hidden sm:table-cell">{item.protein}g</td>
                                  <td className="py-2.5 px-3 text-right text-amber-600 dark:text-amber-400 hidden sm:table-cell">{item.carbs}g</td>
                                  <td className="py-2.5 px-4 text-right text-rose-600 dark:text-rose-400 hidden sm:table-cell">{item.fat}g</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Meal Macro Summary — semantic data colors kept */}
                        <div className="flex items-center gap-4 pt-2 px-1">
                          <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">P: {mealProtein}g</span>
                          <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">C: {mealCarbs}g</span>
                          <span className="text-xs text-rose-600 dark:text-rose-400 font-medium">F: {mealFat}g</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Grand Total Footer */}
          <Card className="shadow-sm">
            <CardContent className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Daily Total</p>
                  <p className="text-3xl font-extrabold text-primary">{totals.calories} <span className="text-sm font-medium text-primary/70">kcal</span></p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Protein</p>
                    <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{totals.protein}g</p>
                  </div>
                  <div className="w-px h-8 bg-border" />
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Carbs</p>
                    <p className="text-lg font-bold text-amber-600 dark:text-amber-400">{totals.carbs}g</p>
                  </div>
                  <div className="w-px h-8 bg-border" />
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Fat</p>
                    <p className="text-lg font-bold text-rose-600 dark:text-rose-400">{totals.fat}g</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
