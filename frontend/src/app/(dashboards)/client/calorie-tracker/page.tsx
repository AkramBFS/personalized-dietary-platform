"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import imageCompression from "browser-image-compression";
import { isAxiosError } from "axios";
import {
  AlertTriangle,
  ArrowUpRight,
  Camera,
  Clock,
  Crown,
  History,
  Image as ImageIcon,
  Loader2,
  Plus,
  Salad,
  Send,
  Sparkles,
  Target,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { resolveApiUrl } from "@/lib/api";
import GenericDropdown from "@/components/ui/GenericDropdown";
import {
  AICalorieLog,
  AIPrediction,
  CalorieLog,
  MEAL_TYPES,
  MealType,
  formatDateParam,
  getAICalorieLog,
  getCalorieLogs,
  getClientProgress,
  getClientSubscriptionStatus,
  getIngredientName,
  postAICalorieLog,
  postManualCalorieLog,
  confirmAICalorieLog,
} from "@/lib/client";

interface EditablePrediction {
  id: string;
  label: string;
  mass_grams: string;
  calories?: number;
}

const MEAL_LABELS: Record<MealType, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function getToday(): string {
  return formatDateParam(new Date());
}

function extractPredictions(log: AICalorieLog): AIPrediction[] {
  if (Array.isArray(log.predictions)) return log.predictions;
  if (Array.isArray(log.ai_raw_prediction)) return log.ai_raw_prediction;
  if (log.ai_raw_prediction && Array.isArray(log.ai_raw_prediction.predictions)) {
    return log.ai_raw_prediction.predictions;
  }
  return [];
}

function predictionLabel(prediction: AIPrediction): string {
  return prediction.label || prediction.name || prediction.class || "Food item";
}

function predictionMass(prediction: AIPrediction): number {
  return prediction.mass_grams ?? prediction.mass ?? 100;
}

function errorCode(error: unknown): string | undefined {
  if (!isAxiosError(error)) return undefined;
  const data = error.response?.data;
  return typeof data === "object" && data !== null && "code" in data ? String(data.code) : undefined;
}

function errorMessage(error: unknown, fallback: string): string {
  if (!isAxiosError(error)) return fallback;
  const data = error.response?.data;
  if (typeof data === "object" && data !== null && "message" in data) {
    return String(data.message);
  }
  return fallback;
}

function mealSummary(logs: CalorieLog[], mealType: MealType): CalorieLog[] {
  return logs.filter((log) => log.meal_type === mealType && log.status === "saved");
}

export default function CalorieTrackerPage() {
  const [activeTab, setActiveTab] = useState<"ai" | "manual">("manual");
  const [isPremium, setIsPremium] = useState(false);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  const [todayLogs, setTodayLogs] = useState<CalorieLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [dailyTarget, setDailyTarget] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [aiFile, setAiFile] = useState<File | null>(null);
  const [aiPreview, setAiPreview] = useState<string | null>(null);
  const [segmentedImageUrl, setSegmentedImageUrl] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiStatusText, setAiStatusText] = useState<string | null>(null);
  const [aiLogId, setAiLogId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editableItems, setEditableItems] = useState<EditablePrediction[]>([]);
  const [confirmingAi, setConfirmingAi] = useState(false);
  const [estimatedNutrition, setEstimatedNutrition] = useState<{
    calories: number;
    protein?: number;
    carbs?: number;
    fats?: number;
  }>({ calories: 0 });

  const [mealType, setMealType] = useState<MealType>("lunch");
  const [ingredientName, setIngredientName] = useState("");
  const [ingredientMass, setIngredientMass] = useState("");
  const [ingredients, setIngredients] = useState<{ name: string; mass_grams: number }[]>([]);
  const [manualSubmitting, setManualSubmitting] = useState(false);

  const loadToday = useCallback(async () => {
    const today = getToday();
    setLogsLoading(true);
    try {
      const [logs, progress] = await Promise.all([
        getCalorieLogs(today),
        getClientProgress(today, today).catch(() => []),
      ]);
      setTodayLogs(logs);
      const todayProgress = progress.find((entry) => entry.log_date === today);
      setDailyTarget(todayProgress?.target_calories ?? null);
    } catch (loadError) {
      console.error("Failed to load calorie logs", loadError);
      setError("Could not load today's calorie log.");
    } finally {
      setLogsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadSubscription = async () => {
      try {
        const status = await getClientSubscriptionStatus();
        if (isMounted) setIsPremium(status.is_premium);
      } catch (subscriptionError) {
        console.error("Failed to fetch subscription status", subscriptionError);
        if (isMounted) setIsPremium(false);
      } finally {
        if (isMounted) setSubscriptionLoading(false);
      }
    };

    void loadSubscription();
    void loadToday();

    return () => {
      isMounted = false;
    };
  }, [loadToday]);

  useEffect(() => {
    return () => {
      if (aiPreview) URL.revokeObjectURL(aiPreview);
    };
  }, [aiPreview]);

  const totalToday = useMemo(
    () => todayLogs.reduce((sum, log) => sum + (log.status === "saved" ? log.total_calories ?? 0 : 0), 0),
    [todayLogs],
  );

  const handleAiUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError("Image must be under 10MB.");
      event.target.value = "";
      return;
    }

    try {
      const compressedFile = await imageCompression(selectedFile, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      });
      if (aiPreview) URL.revokeObjectURL(aiPreview);
      setAiFile(compressedFile);
      setAiPreview(URL.createObjectURL(compressedFile));
      setSegmentedImageUrl(null);
      setError(null);
      setMessage(null);
    } catch (compressionError) {
      console.error("Image compression error", compressionError);
      setAiFile(selectedFile);
      setAiPreview(URL.createObjectURL(selectedFile));
    }
  };

  const openReviewModal = (log: AICalorieLog) => {
    const predictions = extractPredictions(log);
    setAiLogId(log.log_id);
    setSegmentedImageUrl(resolveApiUrl(log.segmented_image_url) ?? null);
    setEditableItems(
      predictions.map((prediction, index) => ({
        id: `${log.log_id}-${index}`,
        label: predictionLabel(prediction),
        mass_grams: String(predictionMass(prediction)),
        calories: prediction.calories,
      })),
    );
    if (log.nutrition_preview) {
      setEstimatedNutrition({
        calories: log.nutrition_preview.total_calories || 0,
        protein: log.nutrition_preview.total_protein,
        carbs: log.nutrition_preview.total_carbs,
        fats: log.nutrition_preview.total_fats,
      });
    }
    setIsModalOpen(true);
  };

  const submitAiAnalysis = async () => {
    if (!aiFile) return;

    setAiLoading(true);
    setAiStatusText("AI is analyzing your meal...");
    setError(null);
    setMessage(null);

    try {
      let log = await postAICalorieLog({ meal_type: mealType, image: aiFile });

      for (let attempt = 0; attempt < 30 && log.status === "processing"; attempt += 1) {
        setAiStatusText("AI is still analyzing your meal...");
        await delay(3000);
        log = await getAICalorieLog(log.log_id);
      }

      if (log.status === "pending_user_review") {
        openReviewModal(log);
      } else if (log.status === "failed") {
        setError("AI analysis failed. Please try another image or use manual entry.");
      } else if (log.status === "processing") {
        setError("AI analysis is taking longer than expected. Please try again shortly.");
      } else {
        setError("AI returned an unexpected status. Please try again.");
      }
    } catch (submitError) {
      console.error("AI analysis failed", submitError);
      if (isAxiosError(submitError) && submitError.response?.status === 403) {
        setIsPremium(false);
        setError(
          errorCode(submitError) === "NOT_PREMIUM"
            ? "This feature requires a premium subscription."
            : "This feature is only available to premium clients.",
        );
      } else {
        setError(errorMessage(submitError, "Failed to analyze image. Please try again."));
      }
    } finally {
      setAiLoading(false);
      setAiStatusText(null);
    }
  };

  const recalculateTotals = (items: EditablePrediction[]) => {
    const totalCals = items.reduce((sum, item) => sum + (item.calories || 0), 0);
    setEstimatedNutrition((prev) => ({ ...prev, calories: totalCals }));
  };

  const handleItemChange = (id: string, field: "label" | "mass_grams", value: string) => {
    setEditableItems((items) => {
      const newItems = items.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          if (field === "mass_grams" && item.calories !== undefined) {
            const oldMass = Number(item.mass_grams) || 1;
            const newMass = Number(value) || 0;
            updated.calories = (item.calories / oldMass) * newMass;
          }
          return updated;
        }
        return item;
      });
      recalculateTotals(newItems);
      return newItems;
    });
  };

  const handleAddItem = () => {
    setEditableItems((items) => {
      const newItems = [
        ...items,
        { id: `manual-${Date.now()}`, label: "New ingredient", mass_grams: "100", calories: 0 },
      ];
      recalculateTotals(newItems);
      return newItems;
    });
  };

  const handleRemoveItem = (id: string) => {
    setEditableItems((items) => {
      const newItems = items.filter((item) => item.id !== id);
      recalculateTotals(newItems);
      return newItems;
    });
  };

  const handleSaveMeal = async () => {
    if (!aiLogId) return;

    const userFinalLog = editableItems
      .map((item) => ({
        label: item.label.trim(),
        mass_grams: Number(item.mass_grams),
      }))
      .filter((item) => item.label && Number.isFinite(item.mass_grams) && item.mass_grams > 0);

    if (userFinalLog.length === 0) {
      setError("Please keep at least one valid ingredient before saving.");
      return;
    }

    setConfirmingAi(true);
    setError(null);
    try {
      await confirmAICalorieLog(aiLogId, { meal_type: mealType, user_final_log: userFinalLog });
      setIsModalOpen(false);
      setAiLogId(null);
      setAiFile(null);
      setAiPreview(null);
      setSegmentedImageUrl(null);
      setEditableItems([]);
      setMessage("Meal saved to your tracker.");
      await loadToday();
    } catch (confirmError) {
      console.error("Failed to confirm AI meal", confirmError);
      setError(errorMessage(confirmError, "Could not save the AI meal. Please review the ingredients and try again."));
    } finally {
      setConfirmingAi(false);
    }
  };

  const addManualIngredient = () => {
    const mass = Number(ingredientMass);
    if (!ingredientName.trim() || !Number.isFinite(mass) || mass <= 0) {
      setError("Enter an ingredient name and a mass greater than 0g.");
      return;
    }

    setIngredients((items) => [...items, { name: ingredientName.trim(), mass_grams: mass }]);
    setIngredientName("");
    setIngredientMass("");
    setError(null);
  };

  const removeManualIngredient = (indexToRemove: number) => {
    setIngredients((items) => items.filter((_, index) => index !== indexToRemove));
  };

  const submitManualLog = async (event: React.FormEvent) => {
    event.preventDefault();
    if (ingredients.length === 0) {
      setError("Please add at least one ingredient.");
      return;
    }

    setManualSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      await postManualCalorieLog({ meal_type: mealType, ingredients });
      setIngredients([]);
      setMessage("Meal logged successfully.");
      await loadToday();
    } catch (submitError) {
      console.error("Failed to log manual meal", submitError);
      setError(errorMessage(submitError, "Could not log this meal. Please try again."));
    } finally {
      setManualSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-card shadow-2xl">
            <div className="flex shrink-0 items-center justify-between border-b border-border p-6">
              <h2 className="flex items-center gap-2 text-xl font-bold text-foreground">
                <Target className="h-5 w-5 text-primary" />
                Confirm Meal Details
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Close review"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto bg-background p-6">
              {segmentedImageUrl && (
                <div className="overflow-hidden rounded-lg border border-border bg-card">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={segmentedImageUrl} alt="AI segmented meal" className="max-h-72 w-full object-contain" />
                </div>
              )}

              <div className="flex items-start gap-3 rounded-xl bg-amber-500/10 p-4 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                <p className="text-sm font-medium leading-relaxed">
                  ⚠️ AI estimates are approximations. Actual nutritional values may vary. Review and adjust items before saving.
                </p>
              </div>

              {estimatedNutrition.calories > 0 && (
                <div className="grid grid-cols-4 gap-2 rounded-xl bg-primary/5 p-4 border border-primary/10">
                  <div className="text-center">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Calories</p>
                    <p className="text-lg font-black text-primary">{estimatedNutrition.calories.toFixed(0)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Protein</p>
                    <p className="text-lg font-black text-foreground">{estimatedNutrition.protein?.toFixed(1) ?? "--"}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Carbs</p>
                    <p className="text-lg font-black text-foreground">{estimatedNutrition.carbs?.toFixed(1) ?? "--"}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Fats</p>
                    <p className="text-lg font-black text-foreground">{estimatedNutrition.fats?.toFixed(1) ?? "--"}</p>
                  </div>
                </div>
              )}

              {editableItems.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                  No AI items were returned. Add ingredients manually before saving.
                </div>
              ) : (
                <div className="space-y-3">
                  {editableItems.map((item) => (
                    <div key={item.id} className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-card p-4">
                      <div className="min-w-[200px] flex-1">
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Food Type
                        </label>
                        <Input value={item.label} onChange={(event) => handleItemChange(item.id, "label", event.target.value)} />
                      </div>
                      <div className="w-32">
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Mass (g)
                        </label>
                        <Input
                          type="number"
                          min="0"
                          value={item.mass_grams}
                          onChange={(event) => handleItemChange(item.id, "mass_grams", event.target.value)}
                        />
                      </div>
                      {item.calories !== undefined && (
                        <div className="pb-2 text-right text-sm font-semibold text-foreground">{item.calories} kcal</div>
                      )}
                      <Button type="button" variant="ghost" onClick={() => handleRemoveItem(item.id)} className="px-3">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <Button type="button" onClick={handleAddItem} variant="outline" className="w-full border-dashed py-6">
                <Plus className="mr-2 h-4 w-4" />
                Add Ingredient
              </Button>
            </div>

            <div className="flex shrink-0 items-center justify-end gap-3 border-t border-border bg-card p-6">
              <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} disabled={confirmingAi}>
                Cancel
              </Button>
              <Button type="button" onClick={handleSaveMeal} disabled={confirmingAi}>
                {confirmingAi ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Save Meal to Tracker
              </Button>
            </div>
          </div>
        </div>
      )}

      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Calorie Tracker</h1>
        <p className="text-muted-foreground">Log your meals manually or use premium AI tracking.</p>
      </div>

      {(message || error) && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            error ? "border-destructive/40 bg-destructive/10 text-destructive" : "border-primary/30 bg-primary/10 text-primary"
          }`}
        >
          {error ?? message}
        </div>
      )}

      <div className="flex w-fit rounded-xl border border-border bg-card p-1">
        <button
          type="button"
          onClick={() => setActiveTab("manual")}
          className={`flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-medium transition-colors ${
            activeTab === "manual" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Salad className="h-4 w-4" /> Manual Entry
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("ai")}
          className={`flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-medium transition-colors ${
            activeTab === "ai" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Camera className="h-4 w-4" /> AI Tracking
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="order-2 space-y-6 lg:order-1">
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b border-border pb-3">
              <CardTitle className="flex items-center gap-2 text-lg text-card-foreground">
                <Clock className="h-5 w-5 text-primary" />
                Today&apos;s Log
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {logsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <div className="space-y-4">
                  {MEAL_TYPES.map((type) => {
                    const logs = mealSummary(todayLogs, type);
                    const calories = logs.reduce((sum, log) => sum + (log.total_calories ?? 0), 0);
                    return (
                      <div key={type} className="border-b border-border pb-3 last:border-0 last:pb-0">
                        <div className="mb-1 flex items-start justify-between gap-3">
                          <div>
                            <h4 className="text-sm font-semibold text-foreground">{MEAL_LABELS[type]}</h4>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {logs.length > 0
                                ? logs
                                    .flatMap((log) => log.user_final_log ?? [])
                                    .map(getIngredientName)
                                    .join(", ")
                                : `No ${MEAL_LABELS[type].toLowerCase()} logged`}
                            </p>
                          </div>
                          {logs.length > 0 && (
                            <span className="rounded bg-accent px-2 py-0.5 text-sm font-bold text-primary">
                              {calories.toFixed(0)} kcal
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <div className="flex items-center justify-between pt-2 text-sm">
                    <span className="font-medium text-muted-foreground">Total Today</span>
                    <span className="font-bold text-foreground">
                      {totalToday.toFixed(0)}
                      {dailyTarget ? (
                        <span className="text-xs font-normal text-muted-foreground"> / {dailyTarget.toFixed(0)} kcal</span>
                      ) : (
                        <span className="text-xs font-normal text-muted-foreground"> kcal</span>
                      )}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Button variant="outline" asChild className="flex w-full items-center justify-center gap-2 py-6 shadow-sm">
            <Link href="/client/calorie-tracker/history">
              <History className="h-5 w-5" /> View Full History
            </Link>
          </Button>
        </div>

        <Card className="order-1 lg:order-2 lg:col-span-2">
          {activeTab === "ai" ? (
            <>
              {subscriptionLoading ? (
                <CardContent className="flex justify-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </CardContent>
              ) : !isPremium ? (
                <>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-card-foreground">
                      <Crown className="h-5 w-5 text-amber-500" /> AI Vision Tracker
                    </CardTitle>
                    <CardDescription>This feature requires a premium subscription.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col items-center justify-center space-y-6 py-12 text-center">
                      <div className="relative">
                        <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-amber-500/10">
                          <Sparkles className="h-10 w-10 text-amber-500" />
                        </div>
                        <div className="absolute -right-1 -top-1 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
                          Premium
                        </div>
                      </div>
                      <div className="max-w-sm space-y-2">
                        <h3 className="text-xl font-bold text-foreground">Unlock AI-Powered Tracking</h3>
                        <p className="text-sm leading-relaxed text-muted-foreground">
                          Snap a photo of your meal, review the detected ingredients, and save the corrected log.
                        </p>
                      </div>
                      <Button asChild className="rounded-xl px-8 py-6 text-base shadow-sm">
                        <Link href="/client/subscription">
                          <ArrowUpRight className="mr-2 h-5 w-5" /> Upgrade to Premium
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </>
              ) : (
                <>
                  <CardHeader>
                    <CardTitle className="text-card-foreground">AI Vision Tracker</CardTitle>
                    <CardDescription>Upload a photo and review AI results before saving to your tracker.</CardDescription>
                    <div className="mt-3 flex items-center gap-2 rounded-lg bg-amber-500/10 px-3 py-2 text-[12px] font-medium text-amber-700 dark:text-amber-400 border border-amber-500/10">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      AI estimates are approximations. Always review the results.
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col gap-4">
                      <div className="space-y-1">
                        <GenericDropdown
                          label="Meal Type"
                          value={mealType}
                          onChange={(val) => setMealType(val as MealType)}
                          options={MEAL_TYPES.map((type) => ({
                            label: MEAL_LABELS[type],
                            value: type,
                          }))}
                        />
                      </div>
                      <label
                        className={`relative flex h-72 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed transition-colors hover:bg-accent ${
                          aiPreview ? "border-primary/50" : "border-border"
                        }`}
                      >
                        {aiPreview ? (
                          <>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={aiPreview} alt="Meal preview" className="h-full w-full object-cover opacity-80" />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity hover:opacity-100">
                              <span className="rounded-lg bg-black/50 px-4 py-2 font-medium text-white">Change Image</span>
                            </div>
                          </>
                        ) : (
                          <div className="space-y-2 p-6 text-center">
                            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                              <ImageIcon className="h-6 w-6" />
                            </div>
                            <p className="font-medium text-foreground">Click to upload a meal photo</p>
                            <p className="text-sm text-muted-foreground">JPG or PNG, max 10MB</p>
                          </div>
                        )}
                        <input type="file" accept="image/*" className="hidden" onChange={handleAiUpload} />
                      </label>
                      <Button onClick={submitAiAnalysis} disabled={!aiFile || aiLoading} className="w-full rounded-xl py-6 text-lg shadow-sm">
                        {aiLoading ? (
                          <>
                            <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                            {aiStatusText ?? "Analyzing meal with AI..."}
                          </>
                        ) : (
                          <>
                            <Camera className="mr-3 h-5 w-5" /> Analyze Image
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </>
              )}
            </>
          ) : (
            <>
              <CardHeader>
                <CardTitle className="text-card-foreground">Manual Entry</CardTitle>
                <CardDescription>Add each ingredient and let the server calculate nutrition.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={submitManualLog} className="space-y-6">
                  <div className="space-y-1">
                    <GenericDropdown
                      label="Meal Type"
                      value={mealType}
                      onChange={(val) => setMealType(val as MealType)}
                      options={MEAL_TYPES.map((type) => ({
                        label: MEAL_LABELS[type],
                        value: type,
                      }))}
                    />
                  </div>

                  <div className="space-y-3 rounded-xl border border-border bg-background p-4">
                    <label className="text-sm font-medium text-foreground">Add Ingredient</label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="e.g. Avocado"
                        value={ingredientName}
                        onChange={(event) => setIngredientName(event.target.value)}
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        min="0"
                        step="0.1"
                        placeholder="Grams"
                        value={ingredientMass}
                        onChange={(event) => setIngredientMass(event.target.value)}
                        className="w-28"
                      />
                      <Button type="button" variant="secondary" onClick={addManualIngredient} aria-label="Add ingredient">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    {ingredients.length > 0 && (
                      <ul className="mt-4 space-y-2">
                        {ingredients.map((ingredient, index) => (
                          <li key={`${ingredient.name}-${index}`} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-3 py-2 text-sm">
                            <span className="font-medium text-foreground">{ingredient.name}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">{ingredient.mass_grams}g</span>
                              <Button type="button" variant="ghost" onClick={() => removeManualIngredient(index)} className="h-8 px-2">
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <Button type="submit" disabled={manualSubmitting || ingredients.length === 0} className="w-full rounded-xl py-6">
                    {manualSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                    Log {MEAL_LABELS[mealType]}
                  </Button>
                </form>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}

