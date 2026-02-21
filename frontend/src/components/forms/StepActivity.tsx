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
}

export default function StepActivity({ formData, setFormData }: Props) {
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
        <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">
          How active are you?
        </h2>
        <p className="text-slate-600 font-medium max-w-xs mx-auto leading-relaxed">
          This helps us calculate your daily calorie requirements.
        </p>
      </div>

      <div className="w-full max-w-md space-y-4">
        {LEVELS.map((level) => {
          const isSelected = formData.activityLevel === level.id;

          return (
            <button
              key={level.id}
              type="button"
              onClick={() =>
                setFormData((prev: any) => ({
                  ...prev,
                  activityLevel: level.id,
                }))
              }
              className={`
                ${cardBaseClasses}
                ${
                  isSelected
                    ? "bg-emerald-400 border-emerald-400 scale-[1.02] shadow-emerald-200/50"
                    : "bg-white/40 border-white/50 hover:bg-white/60"
                }
              `}
            >
              <div
                className={`text-lg font-bold transition-colors duration-300 ${
                  isSelected ? "text-white" : "text-slate-800"
                }`}
              >
                {level.label}
              </div>
              <div
                className={`text-sm font-medium transition-colors duration-300 ${
                  isSelected ? "text-emerald-50/90" : "text-slate-500"
                }`}
              >
                {level.desc}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
