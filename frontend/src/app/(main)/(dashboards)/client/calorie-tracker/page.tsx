"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import imageCompression from "browser-image-compression";
import { isAxiosError } from "axios";
import { resolveApiUrl } from "@/lib/api";
import {
  AICalorieLog,
  AIPrediction,
  CalorieLog,
  ClientProfile,
  ClientProgress,
  ClientSubscriptionStatus,
  MEAL_TYPES,
  MealType,
  formatDateParam,
  getAICalorieLog,
  getCalorieLogs,
  getClientProfile,
  getClientProgress,
  getClientSubscriptionStatus,
  getIngredientName,
  postAICalorieLog,
  postManualCalorieLog,
  confirmAICalorieLog,
} from "@/lib/client";
import { toast } from "sonner";
import CalorieDailySummary from "@/components/calorie-tracker/CalorieDailySummary";
import AIMealConfirmationModal, {
  type EditablePrediction,
} from "@/components/calorie-tracker/AIMealConfirmationModal";
import MealLoggingSection from "@/components/calorie-tracker/MealLoggingSection";

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
  if (
    log.ai_raw_prediction &&
    Array.isArray(log.ai_raw_prediction.predictions)
  ) {
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
  return typeof data === "object" && data !== null && "code" in data
    ? String(data.code)
    : undefined;
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
  return logs.filter(
    (log) => log.meal_type === mealType && log.status === "saved",
  );
}

function getTodayTotals(logs: CalorieLog[], progress: ClientProgress | null) {
  if (progress) {
    return {
      calories: progress.total_calories_consumed ?? 0,
      protein: progress.total_protein_consumed ?? 0,
      carbs: progress.total_carbs_consumed ?? 0,
      fats: progress.total_fats_consumed ?? 0,
    };
  }

  return logs.reduce(
    (totals, log) => {
      if (log.status !== "saved") return totals;
      totals.calories += log.total_calories ?? 0;
      totals.protein += log.total_protein ?? 0;
      totals.carbs += log.total_carbs ?? 0;
      totals.fats += log.total_fats ?? 0;
      return totals;
    },
    { calories: 0, protein: 0, carbs: 0, fats: 0 },
  );
}

function getIsSubscriptionActive(
  status: ClientSubscriptionStatus | null,
): boolean {
  const subscription = status?.subscription;
  if (!subscription) return status?.is_premium ?? false;

  const expiryTime = subscription.end_date
    ? new Date(subscription.end_date).getTime()
    : null;
  const hasExpired =
    expiryTime !== null &&
    !Number.isNaN(expiryTime) &&
    expiryTime <= Date.now();

  if (subscription.end_date) {
    return Boolean(
      status?.is_premium && subscription.status === "active" && !hasExpired,
    );
  }

  return Boolean(status?.is_premium && subscription.status === "active");
}

export default function CalorieTrackerPage() {
  const [activeTab, setActiveTab] = useState<"ai" | "manual">("manual");
  const [subscriptionStatus, setSubscriptionStatus] =
    useState<ClientSubscriptionStatus | null>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  const [todayLogs, setTodayLogs] = useState<CalorieLog[]>([]);
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [todayProgress, setTodayProgress] = useState<ClientProgress | null>(
    null,
  );
  const [logsLoading, setLogsLoading] = useState(true);
  const [dailyTarget, setDailyTarget] = useState<number | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);

  const [aiFile, setAiFile] = useState<File | null>(null);
  const [aiPreview, setAiPreview] = useState<string | null>(null);
  const [segmentedImageUrl, setSegmentedImageUrl] = useState<string | null>(
    null,
  );
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
  } | null>(null);

  const [mealType, setMealType] = useState<MealType>("lunch");
  const [ingredientName, setIngredientName] = useState("");
  const [ingredientMass, setIngredientMass] = useState("");
  const [ingredients, setIngredients] = useState<
    { name: string; mass_grams: number }[]
  >([]);
  const [manualSubmitting, setManualSubmitting] = useState(false);

  const loadToday = useCallback(async () => {
    const today = getToday();
    setLogsLoading(true);
    try {
      const [logs, progress, profileData] = await Promise.all([
        getCalorieLogs(today),
        getClientProgress(today, today).catch(() => []),
        getClientProfile().catch(() => null),
      ]);
      setTodayLogs(logs);
      const todayProgress = progress.find((entry) => entry.log_date === today);
      setTodayProgress(todayProgress ?? null);
      setProfile(profileData);
      setDailyTarget(
        todayProgress?.target_calories ?? profileData?.target_calories ?? null,
      );
    } catch (loadError) {
      console.error("Failed to load calorie logs", loadError);
      setPageError("Could not load today's calorie log.");
    } finally {
      setLogsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadSubscription = async () => {
      try {
        const status = await getClientSubscriptionStatus();
        if (isMounted) setSubscriptionStatus(status);
      } catch (subscriptionError) {
        console.error("Failed to fetch subscription status", subscriptionError);
        if (isMounted) setSubscriptionStatus(null);
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
    () =>
      todayLogs.reduce(
        (sum, log) =>
          sum + (log.status === "saved" ? (log.total_calories ?? 0) : 0),
        0,
      ),
    [todayLogs],
  );
  const todayTotals = useMemo(
    () => getTodayTotals(todayLogs, todayProgress),
    [todayLogs, todayProgress],
  );
  const macroTargets = useMemo(
    () => ({
      protein: todayProgress?.target_protein ?? profile?.target_protein ?? null,
      carbs: todayProgress?.target_carbs ?? profile?.target_carbs ?? null,
      fats: todayProgress?.target_fats ?? profile?.target_fats ?? null,
    }),
    [profile, todayProgress],
  );
  const isSubscriptionActive = useMemo(
    () => getIsSubscriptionActive(subscriptionStatus),
    [subscriptionStatus],
  );

  const handleAiUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error("Image must be under 10MB. Please choose a smaller file.");
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

    const grouped = predictions.reduce(
      (acc, pred) => {
        const label = predictionLabel(pred).toLowerCase().trim();
        if (!acc[label]) {
          acc[label] = {
            originalLabel: predictionLabel(pred),
            mass_grams: 0,
            calories: 0,
            count: 0,
            confidenceSum: 0,
            hasCalories: false,
          };
        }
        acc[label].mass_grams += predictionMass(pred);
        if (pred.calories !== undefined) {
          acc[label].calories += pred.calories;
          acc[label].hasCalories = true;
        }
        acc[label].count += 1;
        acc[label].confidenceSum += pred.confidence ?? 0;
        return acc;
      },
      {} as Record<
        string,
        {
          originalLabel: string;
          mass_grams: number;
          calories: number;
          count: number;
          confidenceSum: number;
          hasCalories: boolean;
        }
      >,
    );

    setEditableItems(
      Object.entries(grouped).map(([, data], index) => ({
        id: `${log.log_id}-${index}`,
        label: data.originalLabel,
        mass_grams: String(data.mass_grams.toFixed(1)),
        calories: data.hasCalories ? data.calories : undefined,
        count: data.count,
        confidence:
          data.count > 0
            ? Number((data.confidenceSum / data.count).toFixed(3))
            : undefined,
      })),
    );

    if (log.nutrition_preview) {
      setEstimatedNutrition({
        calories: log.nutrition_preview.total_calories || 0,
        protein: log.nutrition_preview.total_protein || 0,
        carbs: log.nutrition_preview.total_carbs || 0,
        fats: log.nutrition_preview.total_fats || 0,
      });
    } else {
      setEstimatedNutrition(null);
    }
    setIsModalOpen(true);
  };

  const submitAiAnalysis = async () => {
    if (!aiFile) return;

    setAiLoading(true);
    setAiStatusText("AI is analyzing your meal...");

    try {
      let log = await postAICalorieLog({ meal_type: mealType, image: aiFile });

      for (
        let attempt = 0;
        attempt < 30 && log.status === "processing";
        attempt += 1
      ) {
        setAiStatusText("AI is still analyzing your meal...");
        await delay(3000);
        log = await getAICalorieLog(log.log_id);
      }

      if (log.status === "pending_user_review") {
        openReviewModal(log);
      } else if (log.status === "failed") {
        toast.error(
          "AI analysis failed. Please try another image or use manual entry.",
        );
      } else if (log.status === "processing") {
        toast.error(
          "AI analysis is taking longer than expected. Please try again shortly.",
        );
      } else {
        toast.error("AI returned an unexpected result. Please try again.");
      }
    } catch (submitError) {
      console.error("AI analysis failed", submitError);
      if (isAxiosError(submitError) && submitError.response?.status === 403) {
        setSubscriptionStatus((prev) =>
          prev
            ? {
                ...prev,
                is_premium: false,
                subscription: prev.subscription
                  ? { ...prev.subscription, status: "expired" }
                  : null,
              }
            : { is_premium: false, subscription: null },
        );
        toast.error(
          errorCode(submitError) === "NOT_PREMIUM"
            ? "This feature requires a premium subscription."
            : "This feature is only available to premium clients.",
        );
      } else {
        toast.error(
          errorMessage(
            submitError,
            "Failed to analyze image. Please try again.",
          ),
        );
      }
    } finally {
      setAiLoading(false);
      setAiStatusText(null);
    }
  };

  const recalculateTotals = (items: EditablePrediction[]) => {
    const totalCals = items.reduce(
      (sum, item) => sum + (item.calories || 0),
      0,
    );
    setEstimatedNutrition((prev) =>
      prev ? { ...prev, calories: totalCals } : { calories: totalCals },
    );
  };

  const handleItemChange = (
    id: string,
    field: "label" | "mass_grams",
    value: string,
  ) => {
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
        {
          id: `manual-${Date.now()}`,
          label: "New ingredient",
          mass_grams: "100",
          calories: 0,
        },
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
      .filter(
        (item) =>
          item.label && Number.isFinite(item.mass_grams) && item.mass_grams > 0,
      );

    if (userFinalLog.length === 0) {
      toast.error("Please keep at least one valid ingredient before saving.");
      return;
    }

    setConfirmingAi(true);
    try {
      await confirmAICalorieLog(aiLogId, {
        meal_type: mealType,
        user_final_log: userFinalLog,
      });
      setIsModalOpen(false);
      setAiLogId(null);
      setAiFile(null);
      setAiPreview(null);
      setSegmentedImageUrl(null);
      setEditableItems([]);
      toast.success("Meal saved to your tracker.");
      await loadToday();
    } catch (confirmError) {
      console.error("Failed to confirm AI meal", confirmError);
      toast.error(
        errorMessage(
          confirmError,
          "Could not save the AI meal. Please review the ingredients and try again.",
        ),
      );
    } finally {
      setConfirmingAi(false);
    }
  };

  const addManualIngredient = () => {
    const mass = Number(ingredientMass);
    if (!ingredientName.trim() || !Number.isFinite(mass) || mass <= 0) {
      toast.error("Enter an ingredient name and a mass greater than 0g.");
      return;
    }

    setIngredients((items) => [
      ...items,
      { name: ingredientName.trim(), mass_grams: mass },
    ]);
    setIngredientName("");
    setIngredientMass("");
  };

  const removeManualIngredient = (indexToRemove: number) => {
    setIngredients((items) =>
      items.filter((_, index) => index !== indexToRemove),
    );
  };

  const submitManualLog = async (event: React.FormEvent) => {
    event.preventDefault();
    if (ingredients.length === 0) {
      toast.error("Please add at least one ingredient.");
      return;
    }

    setManualSubmitting(true);
    try {
      await postManualCalorieLog({ meal_type: mealType, ingredients });
      setIngredients([]);
      toast.success("Meal logged successfully.");
      await loadToday();
    } catch (submitError) {
      console.error("Failed to log manual meal", submitError);
      toast.error(
        errorMessage(submitError, "Could not log this meal. Please try again."),
      );
    } finally {
      setManualSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <AIMealConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        segmentedImageUrl={segmentedImageUrl}
        estimatedNutrition={estimatedNutrition}
        editableItems={editableItems}
        onItemChange={handleItemChange}
        onRemoveItem={handleRemoveItem}
        onAddItem={handleAddItem}
        onSave={handleSaveMeal}
        confirmingAi={confirmingAi}
      />

      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Calorie Tracker
        </h1>
        <p className="text-muted-foreground">
          Log your meals manually or use premium AI tracking.
        </p>
      </div>

      {pageError && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {pageError}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <CalorieDailySummary
          logsLoading={logsLoading}
          todayLogs={todayLogs}
          todayTotals={todayTotals}
          dailyTarget={dailyTarget}
          totalToday={totalToday}
          macroTargets={{
            protein: macroTargets.protein ?? 0,
            carbs: macroTargets.carbs ?? 0,
            fats: macroTargets.fats ?? 0,
          }}
          mealTypes={MEAL_TYPES}
          mealLabels={MEAL_LABELS}
          mealSummary={mealSummary}
          getIngredientName={getIngredientName}
        />

        <div className="order-1 lg:order-2 lg:col-span-2">
          <MealLoggingSection
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            subscriptionLoading={subscriptionLoading}
            isSubscriptionActive={isSubscriptionActive}
            mealType={mealType}
            setMealType={setMealType}
            mealTypes={MEAL_TYPES}
            mealLabels={MEAL_LABELS}
            aiPreview={aiPreview}
            aiFile={aiFile}
            aiLoading={aiLoading}
            aiStatusText={aiStatusText}
            handleAiUpload={handleAiUpload}
            submitAiAnalysis={submitAiAnalysis}
            manualSubmitting={manualSubmitting}
            ingredientInput={ingredientName}
            setIngredientInput={setIngredientName}
            massInput={ingredientMass}
            setMassInput={setIngredientMass}
            ingredients={ingredients}
            addManualIngredient={addManualIngredient}
            removeManualIngredient={removeManualIngredient}
            submitManualLog={submitManualLog}
          />
        </div>
      </div>
    </div>
  );
}
