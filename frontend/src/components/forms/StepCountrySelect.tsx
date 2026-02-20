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

  // Close dropdowns when clicking outside
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
    setFormData((prev: any) => ({
      ...prev,
      [field]: value,
    }));
    setOpenDropdown(null);
  };

  const selectClasses = `
    w-full 
    flex items-center justify-between
    bg-white 
    border border-gray-200 
    text-gray-700 
    py-3.5 px-5
    rounded-2xl 
    shadow-sm
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
    transition-all
    cursor-pointer
  `;

  const dropdownMenuClasses = `
    absolute z-20 w-full mt-2 
    bg-white border border-gray-100 
    shadow-xl rounded-2xl 
    overflow-hidden 
    py-2 animate-in fade-in zoom-in duration-150
  `;

  return (
    <div
      className="flex flex-col items-center w-full space-y-8"
      ref={containerRef}
    >
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-800">Regional Settings</h2>
        <p className="text-sm text-gray-500 max-w-xs mx-auto">
          Please provide your location and language preference.
        </p>
      </div>

      <div className="w-full max-w-md space-y-6">
        {/* Country Selection */}
        <div className="space-y-2 relative">
          <label className="text-sm font-semibold text-gray-600 ml-1">
            Current Location
          </label>

          <button
            type="button"
            onClick={() =>
              setOpenDropdown(openDropdown === "country" ? null : "country")
            }
            className={selectClasses}
          >
            <span className={!formData.country ? "text-gray-400" : ""}>
              {formData.country || "Select country"}
            </span>
            <svg
              className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${openDropdown === "country" ? "rotate-180" : ""}`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
            </svg>
          </button>

          {openDropdown === "country" && (
            <ul className={dropdownMenuClasses}>
              {COUNTRIES.map((country) => (
                <li
                  key={country}
                  onClick={() => handleSelect("country", country)}
                  className="px-5 py-3 hover:bg-blue-50 hover:text-blue-600 cursor-pointer transition-colors text-gray-700 text-sm"
                >
                  {country}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Language Selection */}
        <div className="space-y-2 relative">
          <label className="text-sm font-semibold text-gray-600 ml-1">
            Preferred Language
          </label>

          <button
            type="button"
            onClick={() =>
              setOpenDropdown(openDropdown === "language" ? null : "language")
            }
            className={selectClasses}
          >
            <span className={!formData.language ? "text-gray-400" : ""}>
              {formData.language || "Select preferred language"}
            </span>
            <svg
              className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${openDropdown === "language" ? "rotate-180" : ""}`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
            </svg>
          </button>

          {openDropdown === "language" && (
            <ul className={dropdownMenuClasses}>
              {LANGUAGES.map((language) => (
                <li
                  key={language}
                  onClick={() => handleSelect("language", language)}
                  className="px-5 py-3 hover:bg-blue-50 hover:text-blue-600 cursor-pointer transition-colors text-gray-700 text-sm"
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
