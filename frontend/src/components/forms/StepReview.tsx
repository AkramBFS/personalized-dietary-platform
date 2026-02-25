"use client";

import React from "react";

interface Props {
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
}

export default function StepReview({ formData, setFormData }: Props) {
  const summary = [
    { label: "Location", value: formData.country },
    { label: "Primary Goal", value: formData.goal },
    { label: "Activity Level", value: formData.activityLevel },
    { label: "Diet Preference", value: formData.diet },
    { label: "Age", value: formData.age ? `${formData.age} years` : null },
    {
      label: "Weight",
      value: formData.weight ? `${formData.weight} kg` : null,
    },
    {
      label: "Height",
      value: formData.height ? `${formData.height} cm` : null,
    },
    {
      label: "BMI",
      value: typeof formData.bmi === "number" ? formData.bmi.toFixed(1) : null,
    },
    {
      label: "Medical",
      value:
        formData.medicalConditions?.length > 0
          ? formData.medicalConditions.join(", ")
          : "None",
    },
    {
      label: "Name",
      value: formData.firstName
        ? `${formData.firstName} ${formData.lastName}`
        : null,
    },
    { label: "Email", value: formData.email },
  ];

  return (
    <div className="flex flex-col items-center w-full space-y-10">
      {/* Header Section */}
      <div className="text-center space-y-3">
        <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">
          Check your details
        </h2>
        <p className="text-slate-600 font-medium max-w-xs mx-auto leading-relaxed">
          Almost there! Please review your information before finalizing your
          plan.
        </p>
      </div>

      <div className="w-full max-w-md space-y-6">
        {/* Review Card */}
        <div className="bg-white/40 backdrop-blur-md border border-white/50 rounded-3xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.05)] space-y-4">
          {summary.map((item) => (
            <div
              key={item.label}
              className="flex justify-between items-center border-b border-slate-200/50 pb-3 last:border-b-0 last:pb-0"
            >
              <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">
                {item.label}
              </span>
              <span className="text-slate-800 font-bold text-right text-sm">
                {item.value || "Not set"}
              </span>
            </div>
          ))}
        </div>

        {/* Custom Themed Checkbox */}
        <label className="group relative flex items-start gap-4 p-5 bg-white/40 backdrop-blur-md border border-white/50 rounded-2xl cursor-pointer hover:bg-white/60 transition-all shadow-sm">
          <div className="flex items-center h-6">
            <input
              type="checkbox"
              checked={formData.agreedToTerms || false}
              onChange={(e) =>
                setFormData((prev: any) => ({
                  ...prev,
                  agreedToTerms: e.target.checked,
                }))
              }
              className="peer hidden"
            />
            {/* Custom Checkbox UI */}
            <div
              className={`
              w-6 h-6 rounded-md border-2 transition-all flex items-center justify-center
              ${
                formData.agreedToTerms
                  ? "bg-primary border-primary shadow-[0_0_15px_oklch(0.72_0.17_153_/_0.3)]"
                  : "bg-white/50 border-slate-300 group-hover:border-slate-400"
              }
            `}
            >
              {formData.agreedToTerms && (
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={4}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </div>
          </div>
          <span className="text-sm font-semibold text-slate-600 leading-snug">
            I confirm that the medical information provided is accurate and I
            agree to the{" "}
            <span className="text-slate-800 underline decoration-primary/40">
              Terms of Service
            </span>
            .
          </span>
        </label>
      </div>
    </div>
  );
}
