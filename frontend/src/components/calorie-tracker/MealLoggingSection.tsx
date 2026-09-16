"use client";

import React from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpRight,
  Camera,
  Crown,
  Image as ImageIcon,
  Loader2,
  Plus,
  Salad,
  Send,
  Sparkles,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import GenericDropdown from "@/components/ui/GenericDropdown";
import type { MealType } from "@/lib/client";

function PremiumAiPaywall() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          AI Vision Tracker
        </h1>
        <p className="text-muted-foreground">
          Premium access is required to analyze meals from photos.
        </p>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-card-foreground">
            <Crown className="h-5 w-5 text-amber-500" />
            Premium AI access
          </CardTitle>
          <CardDescription>
            This feature requires an active premium subscription.
          </CardDescription>
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
              <h3 className="text-xl font-bold text-foreground">
                Unlock AI-powered tracking
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Snap a photo of your meal, review detected ingredients, and save
                the corrected log.
              </p>
            </div>
            <Button
              asChild
              className="rounded-xl px-8 py-6 text-base shadow-sm"
            >
              <Link href="/client/subscription">
                <ArrowUpRight className="mr-2 h-5 w-5" />
                Upgrade to Premium
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface MealLoggingSectionProps {
  activeTab: "manual" | "ai";
  setActiveTab: (tab: "manual" | "ai") => void;
  subscriptionLoading: boolean;
  isSubscriptionActive: boolean;
  mealType: MealType;
  setMealType: (val: MealType) => void;
  mealTypes: readonly MealType[];
  mealLabels: Record<MealType, string>;
  // AI props
  aiPreview: string | null;
  aiFile: File | null;
  aiLoading: boolean;
  aiStatusText: string | null;
  handleAiUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  submitAiAnalysis: () => void;
  // Manual props
  manualSubmitting: boolean;
  ingredientInput: string;
  setIngredientInput: (val: string) => void;
  massInput: string;
  setMassInput: (val: string) => void;
  ingredients: { name: string; mass_grams: number }[];
  addManualIngredient: () => void;
  removeManualIngredient: (index: number) => void;
  submitManualLog: (e: React.FormEvent) => void;
}

export default function MealLoggingSection({
  activeTab,
  setActiveTab,
  subscriptionLoading,
  isSubscriptionActive,
  mealType,
  setMealType,
  mealTypes,
  mealLabels,
  aiPreview,
  aiFile,
  aiLoading,
  aiStatusText,
  handleAiUpload,
  submitAiAnalysis,
  manualSubmitting,
  ingredientInput,
  setIngredientInput,
  massInput,
  setMassInput,
  ingredients,
  addManualIngredient,
  removeManualIngredient,
  submitManualLog,
}: MealLoggingSectionProps) {
  return (
    <div className="space-y-6">
      <div className="flex w-fit rounded-xl border border-border bg-card p-1">
        <button
          type="button"
          onClick={() => setActiveTab("manual")}
          className={`flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-medium transition-colors ${
            activeTab === "manual"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Salad className="h-4 w-4" /> Manual Entry
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("ai")}
          className={`flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-medium transition-colors ${
            activeTab === "ai"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Camera className="h-4 w-4" /> AI Tracking
        </button>
      </div>

      <Card className="shadow-sm">
        {activeTab === "ai" ? (
          <>
            {subscriptionLoading ? (
              <CardContent className="flex justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </CardContent>
            ) : !isSubscriptionActive ? (
              <PremiumAiPaywall />
            ) : (
              <>
                <CardHeader>
                  <CardTitle className="text-card-foreground">
                    AI Vision Tracker
                  </CardTitle>
                  <CardDescription>
                    Upload a photo and review AI results before saving to your
                    tracker.
                  </CardDescription>
                  <div className="mt-3 flex items-center gap-2 rounded-lg bg-amber-500/10 px-3 py-2 text-[12px] font-medium text-amber-700 border border-amber-500/10 dark:text-amber-400">
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
                        options={mealTypes.map((type) => ({
                          label: mealLabels[type],
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
                          <img
                            src={aiPreview}
                            alt="Meal preview"
                            className="h-full w-full object-cover opacity-80"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity hover:opacity-100">
                            <span className="rounded-lg bg-black/50 px-4 py-2 font-medium text-white">
                              Change Image
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="space-y-2 p-6 text-center">
                          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <ImageIcon className="h-6 w-6" />
                          </div>
                          <p className="font-medium text-foreground">
                            Click to upload a meal photo
                          </p>
                          <p className="text-sm text-muted-foreground">
                            JPG or PNG, max 10MB
                          </p>
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAiUpload}
                      />
                    </label>
                    <Button
                      onClick={submitAiAnalysis}
                      disabled={!aiFile || aiLoading}
                      className="w-full rounded-xl py-6 text-lg shadow-sm"
                    >
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
              <CardTitle className="text-card-foreground">
                Manual Entry
              </CardTitle>
              <CardDescription>
                Add each ingredient and let the server calculate nutrition.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={submitManualLog} className="space-y-6">
                <div className="space-y-1">
                  <GenericDropdown
                    label="Meal Type"
                    value={mealType}
                    onChange={(val) => setMealType(val as MealType)}
                    options={mealTypes.map((type) => ({
                      label: mealLabels[type],
                      value: type,
                    }))}
                  />
                </div>

                <div className="rounded-xl border border-border bg-background p-4">
                  <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Add Ingredients
                  </label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Ingredient name (e.g., Chicken breast)"
                      value={ingredientInput}
                      onChange={(e) => setIngredientInput(e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      placeholder="Mass (g)"
                      value={massInput}
                      onChange={(e) => setMassInput(e.target.value)}
                      className="w-28"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={addManualIngredient}
                      aria-label="Add ingredient"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  {ingredients.length > 0 && (
                    <ul className="mt-4 space-y-2">
                      {ingredients.map((ingredient, index) => (
                        <li
                          key={`${ingredient.name}-${index}`}
                          className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-3 py-2 text-sm"
                        >
                          <span className="font-medium text-foreground">
                            {ingredient.name}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">
                              {ingredient.mass_grams}g
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() => removeManualIngredient(index)}
                              className="h-8 px-2"
                              aria-label="Remove ingredient"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={manualSubmitting || ingredients.length === 0}
                  className="w-full rounded-xl py-6"
                >
                  {manualSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="mr-2 h-4 w-4" />
                  )}
                  Log {mealLabels[mealType]}
                </Button>
              </form>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}
