"use client";

import React, { useEffect } from "react";

interface Props {
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
}

export default function StepBMI({ formData, setFormData }: Props) {
  useEffect(() => {
    // 1. Calculate BMI
    const heightInMeters = formData.height / 100;
    const calculatedBmi = parseFloat(
      (formData.weight / (heightInMeters * heightInMeters)).toFixed(1),
    );

    // 2. Calculate BMR (Revised Harris-Benedict Equation)
    let calculatedBmr = 0;
    if (formData.gender === "male") {
      calculatedBmr =
        88.362 +
        13.397 * formData.weight +
        4.799 * formData.height -
        5.677 * formData.age;
    } else {
      calculatedBmr =
        447.593 +
        9.247 * formData.weight +
        3.098 * formData.height -
        4.33 * formData.age;
    }
    calculatedBmr = Math.round(calculatedBmr);

    if (formData.bmi !== calculatedBmi || formData.bmr !== calculatedBmr) {
      setFormData((prev: any) => ({
        ...prev,
        bmi: calculatedBmi,
        bmr: calculatedBmr,
      }));
    }
  }, [
    formData.height,
    formData.weight,
    formData.age,
    formData.gender,
    setFormData,
    formData.bmi,
    formData.bmr,
  ]);

  const getBMIDetails = (bmi: number) => {
    if (bmi < 18.5) return { label: "Underweight", color: "text-amber-500" };
    if (bmi < 25) return { label: "Healthy Weight", color: "text-emerald-500" };
    if (bmi < 30) return { label: "Overweight", color: "text-orange-500" };
    return { label: "Obese", color: "text-red-500" };
  };

  const { label, color } = getBMIDetails(formData.bmi);

  const cardClasses = `
    w-full bg-white/40 backdrop-blur-md 
    border border-white/50 
    rounded-2xl p-8 
    shadow-[0_8px_32px_rgba(0,0,0,0.05)]
    text-center
  `;

  return (
    <div className="flex flex-col items-center w-full space-y-10">
      {/* Header Section */}
      <div className="text-center space-y-3">
        <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">
          Your Health Metrics
        </h2>
        <p className="text-slate-600 font-medium max-w-xs mx-auto leading-relaxed">
          We've calculated your baseline metrics based on your profile.
        </p>
      </div>

      <div className="w-full max-w-md space-y-6">
        {/* BMI Card */}
        <div className={cardClasses}>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-2">
            Body Mass Index
          </p>
          <div className="text-6xl font-black text-slate-800 tabular-nums mb-2">
            {formData.bmi}
          </div>
          <div
            className={`text-sm font-bold ${color} uppercase tracking-wider`}
          >
            {label}
          </div>
        </div>

        {/* BMR Card */}
        <div className={cardClasses}>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-2">
            Basal Metabolic Rate
          </p>
          <div className="text-4xl font-black text-slate-700 tabular-nums">
            {formData.bmr}
            <span className="text-lg font-bold text-slate-400 ml-2">kcal</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2 font-medium uppercase tracking-wide">
            Daily calories burned at rest
          </p>
        </div>

        {/* Disclaimer */}
        <p className="text-center text-[11px] text-slate-400 italic px-8 leading-relaxed">
          Note: These calculations are estimates based on standard clinical
          formulas (Harris-Benedict).
        </p>
      </div>
    </div>
  );
}
