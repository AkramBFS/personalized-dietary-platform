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

  return (
    <div className="space-y-6 text-center py-10">
      <h2 className="text-xl font-medium text-gray-500">
        Your Body Mass Index is
      </h2>
      <div className="text-7xl font-black text-blue-600">{formData.bmi}</div>
      <p className="text-gray-400">
        This is calculated automatically from your height and weight.
      </p>
    </div>
  );
}
