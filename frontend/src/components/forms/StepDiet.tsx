"use client";

import React, { useState, useRef, useEffect } from "react";

const DIETS = ["None", "Omnivore", "Vegetarian", "Vegan", "Keto", "Paleo"];

interface Props {
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
}

export default function StepDiet({ formData, setFormData }: Props) {
  const [openDropdown, setOpenDropdown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpenDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (value: string) => {
    setFormData((prev: any) => ({ ...prev, diet: value }));
    setOpenDropdown(false);
  };

  // Reusing the exact glass classes from StepCountrySelect
  const selectClasses = `
    w-full flex items-center justify-between
    bg-white/40 backdrop-blur-md 
    border border-white/50 
    text-slate-800 font-medium
    py-4 px-6 rounded-2xl 
    shadow-[0_8px_32px_rgba(0,0,0,0.05)]
    hover:bg-white/60 transition-all duration-300
    cursor-pointer group
  `;

  const dropdownMenuClasses = `
    absolute z-20 w-full mt-2 
    bg-white/90 backdrop-blur-xl border border-white/40 
    shadow-2xl rounded-2xl overflow-hidden py-2
    animate-in fade-in slide-in-from-top-2 duration-200
  `;

  return (
    <div
      className="flex flex-col items-center w-full space-y-10"
      ref={containerRef}
    >
      {/* Header Section */}
      <div className="text-center space-y-3">
        <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">
          Dietary Preferences
        </h2>
        <p className="text-slate-600 font-medium max-w-xs mx-auto leading-relaxed">
          Tell us if you follow a specific eating pattern.
        </p>
      </div>

      <div className="w-full max-w-md space-y-3 relative">
        <label className="text-sm font-bold text-slate-700 ml-1">
          Diet Preference
        </label>

        <button
          type="button"
          onClick={() => setOpenDropdown((prev) => !prev)}
          className={selectClasses}
        >
          <span className={!formData.diet ? "text-slate-400" : ""}>
            {formData.diet || "Choose a diet..."}
          </span>

          <svg
            className={`h-5 w-5 text-slate-400 transition-transform duration-300 ${
              openDropdown ? "rotate-180" : ""
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {openDropdown && (
          <ul className={dropdownMenuClasses}>
            {DIETS.map((diet) => (
              <li
                key={diet}
                onClick={() => handleSelect(diet)}
                className="px-6 py-3 hover:bg-emerald-400 hover:text-white cursor-pointer transition-colors text-slate-700 text-sm font-medium"
              >
                {diet}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
