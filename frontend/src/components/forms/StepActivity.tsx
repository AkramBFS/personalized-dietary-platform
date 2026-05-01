"use client";

import React from "react";

const LEVELS = [
  { id: "sedentary", label: "Sedentary", desc: "Little to no exercise" },
  { id: "moderate", label: "Moderate", desc: "3-4 days a week" },
  { id: "active", label: "Very Active", desc: "Daily intense training" },
];

interface Props {
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  activityLevels?: any[];
}

export default function StepActivity({ formData, setFormData, activityLevels = [] }: Props) {
  const cardBaseClasses = `
    w-full flex flex-col items-center justify-center p-6 
    rounded-2xl border transition-all duration-300 
    cursor-pointer backdrop-blur-md
    shadow-[0_8px_32px_rgba(0,0,0,0.05)]
  `;

  return (
    <div className="flex flex-col items-center w-full space-y-10">
      {/* Header Section */}
      <div className="text-center space-y-3">
        <h2 className="text-3xl font-extrabold text-foreground tracking-tight">
          How active are you?
        </h2>
        <p className="text-muted-foreground font-medium max-w-xs mx-auto leading-relaxed">
          This helps us calculate your daily calorie requirements.
        </p>
      </div>

      <div className="w-full max-w-md space-y-4">
        {Array.isArray(activityLevels) && activityLevels.map((level) => {
          const isSelected = formData.activityLevel === level.name;

          return (
            <button
              key={level.id}
              type="button"
              onClick={() =>
                setFormData((prev: any) => ({
                  ...prev,
                  activityLevel: level.name,
                }))
              }
              className={`
                ${cardBaseClasses}
                ${
                  isSelected
                    ? "bg-brand/90 border-brand/30 scale-[1.02] shadow-brand/20"
                    : "bg-card/40 border-border hover:bg-accent"
                }
              `}
            >
              <div
                className={`text-lg font-bold transition-colors duration-300 ${
                  isSelected
                    ? "text-primary-foreground"
                    : "text-foreground"
                }`}
              >
                {level.name}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
