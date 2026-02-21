"use client";

import React from "react";

interface Props {
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
}

export default function StepAgeWeight({ formData, setFormData }: Props) {
  const genderOptions = [
    { id: "male", label: "Male" },
    { id: "female", label: "Female" },
  ];

  const inputClasses = `
    w-full p-4 pr-12 bg-white/40 backdrop-blur-md 
    border border-white/50 rounded-2xl 
    shadow-[0_8px_32px_rgba(0,0,0,0.05)]
    text-slate-800 text-lg font-medium outline-none 
    focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400
    transition-all placeholder:text-slate-400
  `;

  return (
    <div className="flex flex-col items-center w-full space-y-10">
      {/* Header Section */}
      <div className="text-center space-y-3">
        <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">
          Tell us about yourself
        </h2>
        <p className="text-slate-600 font-medium max-w-xs mx-auto leading-relaxed">
          We use this to calculate your metabolic rate and metrics.
        </p>
      </div>

      <div className="w-full max-w-md space-y-8">
        {/* Gender Selection */}
        <div className="space-y-3">
          <label className="text-sm font-bold text-slate-700 ml-1">
            Gender
          </label>
          <div className="grid grid-cols-2 gap-4">
            {genderOptions.map((option) => {
              const isSelected = formData.gender === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() =>
                    setFormData({ ...formData, gender: option.id })
                  }
                  className={`
                    py-4 rounded-2xl border font-bold transition-all duration-300 active:scale-[0.98]
                    shadow-[0_8px_32px_rgba(0,0,0,0.05)] backdrop-blur-md
                    ${
                      isSelected
                        ? "bg-emerald-400 border-emerald-400 text-white scale-[1.02] shadow-emerald-200/50"
                        : "bg-white/40 border-white/50 text-slate-700 hover:bg-white/60"
                    }
                  `}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Age Input */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-slate-700 ml-1">Age</label>
            <div className="relative">
              <input
                type="number"
                placeholder="25"
                value={formData.age || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    age: e.target.value === "" ? "" : Number(e.target.value),
                  })
                }
                className={inputClasses}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold pointer-events-none">
                yrs
              </span>
            </div>
          </div>

          {/* Weight Input */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-slate-700 ml-1">
              Weight
            </label>
            <div className="relative">
              <input
                type="number"
                placeholder="70"
                value={formData.weight || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    weight: e.target.value === "" ? "" : Number(e.target.value),
                  })
                }
                className={inputClasses}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold pointer-events-none">
                kg
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
