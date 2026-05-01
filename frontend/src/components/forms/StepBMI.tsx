"use client";

import React, { useEffect } from "react";

interface Props {
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  metrics: { bmi: string; bmr: number } | null;
}

export default function StepBMI({ formData, setFormData, metrics }: Props) {
  const cardClasses = `w-full bg-card/40 backdrop-blur-md border border-border rounded-2xl p-8 shadow-sm text-center`;

  // Auto-sync calculated BMI into formData
  useEffect(() => {
    if (metrics?.bmi) {
      const bmiNumber = parseFloat(metrics.bmi);
      if (!isNaN(bmiNumber)) {
        setFormData((prev: any) => ({
          ...prev,
          bmi: bmiNumber,
        }));
      }
    }
  }, [metrics?.bmi, setFormData]);

  return (
    <div className="flex flex-col items-center w-full space-y-10">
      <div className="text-center space-y-3">
        <h2 className="text-3xl font-extrabold text-foreground tracking-tight">
          Your Health Metrics
        </h2>
        <p className="text-muted-foreground font-medium">
          Preliminary analysis based on your stats.
        </p>
      </div>

      <div className="w-full max-w-md space-y-6">
        <div className={cardClasses}>
          {metrics ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground uppercase font-bold">
                  BMI
                </p>
                <p className="text-4xl font-black text-brand">{metrics.bmi}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground uppercase font-bold">
                  BMR
                </p>
                <p className="text-4xl font-black text-brand">{metrics.bmr}</p>
              </div>
            </div>
          ) : (
            <p className="text-destructive">
              Please ensure age, weight, and height are set.
            </p>
          )}

          <p className="mt-6 text-xs text-muted-foreground leading-relaxed">
            These are estimates. Our clinical engine will finalize these using
            the Mifflin-St Jeor formula upon registration.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-brand/5 border border-brand/10 flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-brand" />
          <p className="text-xs font-semibold text-brand uppercase tracking-wider">
            Metrics Calculated
          </p>
        </div>
      </div>
    </div>
  );
}
