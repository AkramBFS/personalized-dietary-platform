"use client";

import React, { useState, useRef, useEffect } from "react";

const DIETS = ["None", "Omnivore", "Vegetarian", "Vegan", "Keto", "Paleo"];

export default function StepDiet({ formData, setFormData }: any) {
  const [openDropdown, setOpenDropdown] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
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
    setFormData((prev: any) => ({
      ...prev,
      diet: value,
    }));
    setOpenDropdown(false);
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
      className="space-y-6 flex flex-col items-center w-full"
      ref={containerRef}
    >
      <h2 className="text-xl font-bold text-gray-800">
        Any dietary preferences?
      </h2>

      <div className="w-full max-w-xs relative space-y-2">
        <label className="text-sm font-semibold text-gray-600 ml-1">
          Diet Preference
        </label>

        <button
          type="button"
          onClick={() => setOpenDropdown((prev) => !prev)}
          className={selectClasses}
        >
          <span className={!formData.diet ? "text-gray-400" : ""}>
            {formData.diet || "Choose a diet..."}
          </span>

          <svg
            className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
              openDropdown ? "rotate-180" : ""
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
          </svg>
        </button>

        {openDropdown && (
          <ul className={dropdownMenuClasses}>
            {DIETS.map((diet) => (
              <li
                key={diet}
                onClick={() => handleSelect(diet)}
                className="px-5 py-3 hover:bg-blue-50 hover:text-blue-600 cursor-pointer transition-colors text-gray-700 text-sm"
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
