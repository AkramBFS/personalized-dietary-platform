"use client";
import React, { useState, useRef, useEffect } from "react";

interface Props {
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  countries?: { id: number; name: string }[];
  languages?: { id: number; name: string }[];
}

const COUNTRIES_FALLBACK = ["United States"];

export default function StepCountrySelect({
  formData,
  setFormData,
  countries,
  languages,
}: Props) {
  const countriesList =
    Array.isArray(countries) && countries.length > 0
      ? countries.map((c) => c.name)
      : COUNTRIES_FALLBACK;

  const languagesList =
    Array.isArray(languages) && languages.length > 0
      ? languages.map((l) => l.name)
      : ["English"]; // Fallback
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
    bg-card/40 backdrop-blur-md 
    border border-border
    text-foreground font-medium
    py-4 px-6 rounded-2xl 
    shadow-[0_8px_32px_rgba(0,0,0,0.05)]
    hover:bg-accent transition-all duration-300
    cursor-pointer group
  `;

  const dropdownMenuClasses = `
    absolute z-20 w-full mt-2 
    bg-card/90 backdrop-blur-xl border border-border
    shadow-2xl rounded-2xl overflow-hidden py-2
    animate-in fade-in slide-in-from-top-2 duration-200
  `;

  return (
    <div
      className="flex flex-col items-center w-full space-y-10"
      ref={containerRef}
    >
      <div className="text-center space-y-3">
        <h2 className="text-3xl font-extrabold text-foreground tracking-tight">
          Regional Settings
        </h2>
        <p className="text-muted-foreground font-medium max-w-xs mx-auto leading-relaxed">
          Please provide your location and language preference.
        </p>
      </div>

      <div className="w-full max-w-md space-y-8">
        {/* Country Selection */}
        <div className="space-y-3 relative">
          <label className="text-sm font-bold text-foreground ml-1">
            Current Location
          </label>
          <button
            type="button"
            onClick={() =>
              setOpenDropdown(openDropdown === "country" ? null : "country")
            }
            className={selectClasses}
          >
            <span
              className={
                !formData.country ? "text-muted-foreground" : ""
              }
            >
              {formData.country || "Select country"}
            </span>
            <svg
              className={`h-5 w-5 text-muted-foreground transition-transform duration-300 ${openDropdown === "country" ? "rotate-180" : ""}`}
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
              {countriesList.map((country) => (
                <li
                  key={country}
                  onClick={() => handleSelect("country", country)}
                  className="px-6 py-3 hover:bg-brand hover:text-primary-foreground cursor-pointer transition-colors text-foreground text-sm font-medium"
                >
                  {country}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Language Selection */}
        <div className="space-y-3 relative">
          <label className="text-sm font-bold text-foreground ml-1">
            Preferred Language
          </label>
          <button
            type="button"
            onClick={() =>
              setOpenDropdown(openDropdown === "language" ? null : "language")
            }
            className={selectClasses}
          >
            <span
              className={
                !formData.language ? "text-muted-foreground" : ""
              }
            >
              {formData.language || "Select preferred language"}
            </span>
            <svg
              className={`h-5 w-5 text-muted-foreground transition-transform duration-300 ${openDropdown === "language" ? "rotate-180" : ""}`}
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
              {languagesList.map((language) => (
                <li
                  key={language}
                  onClick={() => handleSelect("language", language)}
                  className="px-6 py-3 hover:bg-brand hover:text-primary-foreground cursor-pointer transition-colors text-foreground text-sm font-medium"
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
