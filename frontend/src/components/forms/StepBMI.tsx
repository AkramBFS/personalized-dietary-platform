"use client";

import { useEffect } from "react";

export default function StepBMI({ formData, setFormData }: any) {
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

    // Only update if values actually changed to avoid infinite loops
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

  return (
    <div className="flex flex-col items-center w-full space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-800">
          Your Health Metrics
        </h2>
        <p className="text-sm text-gray-500">
          We've calculated your baseline metrics based on your profile.
        </p>
      </div>

      <div className="w-full max-w-md space-y-4">
        {/* BMI Card */}
        <div className="relative bg-blue-50 px-12 py-6 rounded-3xl border border-blue-100 shadow-sm text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-1">
            Body Mass Index
          </p>
          <div className="text-6xl font-black text-blue-600 tabular-nums">
            {formData.bmi}
          </div>
          <span
            className={`text-sm font-bold ${color} uppercase tracking-wide`}
          >
            {label}
          </span>
        </div>

        {/* BMR Card */}
        <div className="bg-gray-50 px-12 py-6 rounded-3xl border border-gray-100 shadow-sm text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">
            Basal Metabolic Rate
          </p>
          <div className="text-4xl font-black text-gray-700 tabular-nums">
            {formData.bmr}{" "}
            <span className="text-lg font-medium text-gray-400">kcal</span>
          </div>
          <p className="text-[10px] text-gray-400 mt-1 uppercase">
            Daily calories burned at rest
          </p>
        </div>

        <p className="text-center text-[11px] text-gray-400 italic px-6">
          Note: These calculations are estimates based on standard clinical
          formulas.
        </p>
      </div>
    </div>
  );
}
