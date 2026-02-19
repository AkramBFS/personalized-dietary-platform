"use client";

import { useEffect } from "react";

export default function StepBMI({ formData, setFormData }: any) {
  useEffect(() => {
    const heightInMeters = formData.height / 100;
    const calculatedBmi = parseFloat(
      (formData.weight / (heightInMeters * heightInMeters)).toFixed(1),
    );
    if (formData.bmi !== calculatedBmi) {
      setFormData((prev: any) => ({ ...prev, bmi: calculatedBmi }));
    }
  }, [formData.height, formData.weight, setFormData, formData.bmi]);

  // Helper to get BMI category styling and text
  const getBMIDetails = (bmi: number) => {
    if (bmi < 18.5) return { label: "Underweight", color: "text-amber-500" };
    if (bmi < 25) return { label: "Healthy Weight", color: "text-emerald-500" };
    if (bmi < 30) return { label: "Overweight", color: "text-orange-500" };
    return { label: "Obese", color: "text-red-500" };
  };

  const { label, color } = getBMIDetails(formData.bmi);

  return (
    <div className="flex flex-col items-center w-full space-y-8">
      {/* Header Section */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-800">Your Results</h2>
        <p className="text-sm text-gray-500">
          Based on the height and weight you provided.
        </p>
      </div>

      <div className="w-full max-w-md flex flex-col items-center space-y-6">
        {/* Large BMI Display Card */}
        <div className="relative bg-blue-50 px-12 py-8 rounded-3xl border border-blue-100 shadow-sm text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-2">
            Your BMI
          </p>
          <div className="text-7xl font-black text-blue-600 tabular-nums">
            {formData.bmi}
          </div>
          {/* Subtle decoration triangle */}
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-blue-50 border-r border-b border-blue-100 rotate-45"></div>
        </div>

        {/* Status Indicator */}
        <div className="text-center">
          <span className={`text-lg font-bold ${color}`}>{label}</span>
          <p className="text-xs text-gray-400 mt-2 max-w-[240px]">
            This is an automated calculation and is used as a general health
            indicator.
          </p>
        </div>
      </div>
    </div>
  );
}
