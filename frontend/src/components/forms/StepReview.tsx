"use client";

import React from "react";

interface Props {
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
}

export default function StepReview({ formData, setFormData }: Props) {
  const summary = [
    { label: "Location", value: formData.country },
    { label: "Language", value: formData.language },
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
      label: "BMR",
      value: typeof formData.bmr === "number" ? `${formData.bmr} kcal` : null,
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
    { label: "Phone", value: formData.phone },
  ];

  return (
    <div className="flex flex-col items-center w-full space-y-10">
      {/* Header Section */}
      <div className="text-center space-y-3">
        <h2 className="text-3xl font-extrabold text-foreground tracking-tight">
          Check your details
        </h2>
        <p className="text-muted-foreground font-medium max-w-xs mx-auto leading-relaxed">
          Almost there! Please review your information before finalizing your
          plan.
        </p>
      </div>

      <div className="w-full max-w-md space-y-6">
        {/* Review Card */}
        <div className="bg-card/40 backdrop-blur-md border border-border rounded-3xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.05)] space-y-4">
          {summary.map((item) => (
            <div
              key={item.label}
              className="flex justify-between items-center border-b border-border/50 pb-3 last:border-b-0 last:pb-0"
            >
              <span className="text-muted-foreground text-xs font-bold uppercase tracking-wider">
                {item.label}
              </span>
              <span className="text-foreground font-bold text-right text-sm">
                {item.value || "Not set"}
              </span>
            </div>
          ))}
        </div>

        {/* Custom Themed Checkbox */}
        <label className="group relative flex items-start gap-4 p-5 bg-card/40 backdrop-blur-md border border-border rounded-2xl cursor-pointer hover:bg-accent transition-all shadow-sm">
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
                  ? "bg-brand border-brand shadow-brand/30"
                  : "bg-card/50 border-border group-hover:border-brand/40"
              }
            `}
            >
              {formData.agreedToTerms && (
                <svg
                  className="w-4 h-4 text-primary-foreground"
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
          <span className="text-sm font-semibold text-foreground leading-snug">
            I confirm that the medical information provided is accurate and I
            agree to the{" "}
            <span className="text-foreground underline decoration-brand/40">
              Terms of Service
            </span>
            .
          </span>
        </label>
      </div>
    </div>
  );
}
