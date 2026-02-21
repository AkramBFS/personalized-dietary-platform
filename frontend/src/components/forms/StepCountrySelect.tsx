"use client";
import React, { useState, useRef, useEffect } from "react";

interface Props {
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
}

const COUNTRIES = [
  "United States",
  "Canada",
  "United Kingdom",
  "Germany",
  "France",
  "Australia",
  "Qatar",
  "Saudi Arabia",
  "UAE",
  "Algeria",
];
const LANGUAGES = [
  "English",
  "Spanish",
  "French",
  "German",
  "Arabic",
  "Mandarin",
  "Hindi",
];

export default function StepCountrySelect({ formData, setFormData }: Props) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (field: string, value: string) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
    setOpenDropdown(null);
  };

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
      <div className="text-center space-y-3">
        <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">
          Regional Settings
        </h2>
        <p className="text-slate-600 font-medium max-w-xs mx-auto leading-relaxed">
          Please provide your location and language preference.
        </p>
      </div>

      <div className="w-full max-w-md space-y-8">
        {/* Country Selection */}
        <div className="space-y-3 relative">
          <label className="text-sm font-bold text-slate-700 ml-1">
            Current Location
          </label>
          <button
            type="button"
            onClick={() =>
              setOpenDropdown(openDropdown === "country" ? null : "country")
            }
            className={selectClasses}
          >
            <span className={!formData.country ? "text-slate-400" : ""}>
              {formData.country || "Select country"}
            </span>
            <svg
              className={`h-5 w-5 text-slate-400 transition-transform duration-300 ${openDropdown === "country" ? "rotate-180" : ""}`}
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
          {openDropdown === "country" && (
            <ul className={dropdownMenuClasses}>
              {COUNTRIES.map((country) => (
                <li
                  key={country}
                  onClick={() => handleSelect("country", country)}
                  className="px-6 py-3 hover:bg-emerald-400 hover:text-white cursor-pointer transition-colors text-slate-700 text-sm font-medium"
                >
                  {country}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Language Selection */}
        <div className="space-y-3 relative">
          <label className="text-sm font-bold text-slate-700 ml-1">
            Preferred Language
          </label>
          <button
            type="button"
            onClick={() =>
              setOpenDropdown(openDropdown === "language" ? null : "language")
            }
            className={selectClasses}
          >
            <span className={!formData.language ? "text-slate-400" : ""}>
              {formData.language || "Select preferred language"}
            </span>
            <svg
              className={`h-5 w-5 text-slate-400 transition-transform duration-300 ${openDropdown === "language" ? "rotate-180" : ""}`}
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
          {openDropdown === "language" && (
            <ul className={dropdownMenuClasses}>
              {LANGUAGES.map((language) => (
                <li
                  key={language}
                  onClick={() => handleSelect("language", language)}
                  className="px-6 py-3 hover:bg-emerald-400 hover:text-white cursor-pointer transition-colors text-slate-700 text-sm font-medium"
                >
                  {language}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
