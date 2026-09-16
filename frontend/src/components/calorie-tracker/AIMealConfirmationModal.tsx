"use client";

import React from "react";
import {
  AlertTriangle,
  Loader2,
  Plus,
  Send,
  Sparkles,
  Target,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export interface EditablePrediction {
  id: string;
  label: string;
  mass_grams: string;
  calories?: number;
  count?: number;
  confidence?: number;
}

interface AIMealConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  segmentedImageUrl: string | null;
  estimatedNutrition: {
    calories: number;
    protein?: number;
    carbs?: number;
    fats?: number;
  } | null;
  editableItems: EditablePrediction[];
  onItemChange: (id: string, field: "label" | "mass_grams", value: string) => void;
  onRemoveItem: (id: string) => void;
  onAddItem: () => void;
  onSave: () => void;
  confirmingAi: boolean;
}

export default function AIMealConfirmationModal({
  isOpen,
  onClose,
  segmentedImageUrl,
  estimatedNutrition,
  editableItems,
  onItemChange,
  onRemoveItem,
  onAddItem,
  onSave,
  confirmingAi,
}: AIMealConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-card shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-border p-6">
          <h2 className="flex items-center gap-2 text-xl font-bold text-foreground">
            <Target className="h-5 w-5 text-primary" />
            Confirm Meal Details
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Close review"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div
          className="flex-1 space-y-5 overflow-y-auto bg-background p-6"
          data-lenis-prevent
        >
          {segmentedImageUrl && (
            <div className="overflow-hidden rounded-lg border border-border bg-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={segmentedImageUrl}
                alt="AI segmented meal"
                className="max-h-72 w-full object-contain"
              />
            </div>
          )}

          <div className="flex items-start gap-3 rounded-xl bg-amber-500/10 p-4 text-amber-700 dark:text-amber-400 border border-amber-500/20">
            <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
            <p className="text-sm font-medium leading-relaxed">
              ⚠️ AI estimates are approximations. Actual nutritional values
              may vary. Review and adjust items before saving.
            </p>
          </div>

          {estimatedNutrition && (
            <div className="mb-4 space-y-3">
              <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground">
                <Sparkles className="h-4 w-4 text-primary" />
                Nutrition Preview
              </h3>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="flex flex-col items-center justify-center rounded-xl bg-primary/10 p-4 border border-primary/20">
                  <p className="text-[10px] font-bold text-primary uppercase mb-1">
                    Calories
                  </p>
                  <p className="text-2xl font-black text-primary">
                    {estimatedNutrition.calories.toFixed(0)}
                  </p>
                  <p className="text-[10px] text-primary/70 font-medium">
                    kcal
                  </p>
                </div>
                <div className="flex flex-col items-center justify-center rounded-xl bg-card p-4 border border-border shadow-sm">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">
                    Protein
                  </p>
                  <p className="text-2xl font-black text-foreground">
                    {estimatedNutrition.protein?.toFixed(1) ?? "0.0"}
                  </p>
                  <p className="text-[10px] text-muted-foreground font-medium">
                    grams
                  </p>
                </div>
                <div className="flex flex-col items-center justify-center rounded-xl bg-card p-4 border border-border shadow-sm">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">
                    Carbs
                  </p>
                  <p className="text-2xl font-black text-foreground">
                    {estimatedNutrition.carbs?.toFixed(1) ?? "0.0"}
                  </p>
                  <p className="text-[10px] text-muted-foreground font-medium">
                    grams
                  </p>
                </div>
                <div className="flex flex-col items-center justify-center rounded-xl bg-card p-4 border border-border shadow-sm">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">
                    Fats
                  </p>
                  <p className="text-2xl font-black text-foreground">
                    {estimatedNutrition.fats?.toFixed(1) ?? "0.0"}
                  </p>
                  <p className="text-[10px] text-muted-foreground font-medium">
                    grams
                  </p>
                </div>
              </div>
            </div>
          )}

          {editableItems.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              No AI items were returned. Add ingredients manually before saving.
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Detected Ingredients
              </h3>
              {editableItems.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:border-primary/30"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="flex h-6 min-w-[24px] items-center justify-center rounded-full bg-primary/10 px-1.5 text-xs font-bold text-primary">
                        {item.count ?? 1}x
                      </span>
                      {item.confidence !== undefined && (
                        <span className="rounded-md bg-accent px-2 py-0.5 text-xs font-medium text-muted-foreground">
                          {Math.round(item.confidence * 100)}% Match
                        </span>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveItem(item.id)}
                      className="h-8 w-8 p-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      aria-label="Remove item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap items-end gap-3">
                    <div className="min-w-[140px] flex-1">
                      <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Food Type
                      </label>
                      <Input
                        value={item.label}
                        onChange={(event) =>
                          onItemChange(item.id, "label", event.target.value)
                        }
                        className="bg-background"
                      />
                    </div>
                    <div className="w-24 sm:w-32">
                      <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Mass (g)
                      </label>
                      <Input
                        type="number"
                        min="0"
                        step="0.1"
                        value={item.mass_grams}
                        onChange={(event) =>
                          onItemChange(item.id, "mass_grams", event.target.value)
                        }
                        className="bg-background"
                      />
                    </div>
                    {item.calories !== undefined && (
                      <div className="pb-2 text-right text-sm font-bold text-foreground">
                        {item.calories.toFixed(0)} kcal
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <Button
            type="button"
            onClick={onAddItem}
            variant="outline"
            className="w-full border-dashed py-6"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Ingredient
          </Button>
        </div>

        <div className="flex shrink-0 items-center justify-end gap-3 border-t border-border bg-card p-6">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={confirmingAi}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onSave}
            disabled={confirmingAi}
          >
            {confirmingAi ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Save Meal to Tracker
          </Button>
        </div>
      </div>
    </div>
  );
}
