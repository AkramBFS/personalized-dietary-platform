"use client";
import React, { useState, useRef, useEffect } from "react";

interface Option {
  label: string;
  value: any;
}

interface GenericDropdownProps {
  label?: string;
  value: any;
  options: (string | Option)[];
  onChange: (value: any) => void;
  placeholder?: string;
  className?: string;
  error?: string;
}

export default function GenericDropdown({
  label,
  value,
  options,
  onChange,
  placeholder = "Select an option",
  className = "",
  error,
}: GenericDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectClasses = `
    w-full flex items-center justify-between
    bg-card/40 backdrop-blur-md 
    border border-border
    text-foreground font-medium
    py-4 px-6 rounded-2xl 
    shadow-[0_8px_32px_rgba(0,0,0,0.05)]
    hover:bg-accent transition-all duration-300
    cursor-pointer group
    ${error ? "border-destructive/50 ring-1 ring-destructive/20" : ""}
    ${className}
  `;

  const dropdownMenuClasses = `
    absolute z-20 w-full mt-2 
    bg-card/90 backdrop-blur-xl border border-border
    shadow-2xl rounded-2xl overflow-hidden py-2
    animate-in fade-in slide-in-from-top-2 duration-200
    max-h-60 overflow-y-auto
  `;

  const getLabel = (val: any) => {
    const option = options.find((opt) =>
      typeof opt === "string" ? opt === val : opt.value === val
    );
    if (!option) return val || placeholder;
    return typeof option === "string" ? option : option.label;
  };

  return (
    <div className="space-y-3 relative w-full" ref={containerRef}>
      {label && (
        <label className="text-sm font-bold text-foreground ml-1">
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={selectClasses}
      >
        <span className={!value ? "text-muted-foreground" : ""}>
          {getLabel(value)}
        </span>
        <svg
          className={`h-5 w-5 text-muted-foreground transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
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
      {isOpen && (
        <ul className={dropdownMenuClasses}>
          {options.length > 0 ? (
            options.map((option, idx) => {
              const optLabel = typeof option === "string" ? option : option.label;
              const optValue = typeof option === "string" ? option : option.value;
              return (
                <li
                  key={idx}
                  onClick={() => {
                    onChange(optValue);
                    setIsOpen(false);
                  }}
                  className={`px-6 py-3 hover:bg-brand hover:text-primary-foreground cursor-pointer transition-colors text-foreground text-sm font-medium ${
                    value === optValue ? "bg-brand/10 text-brand" : ""
                  }`}
                >
                  {optLabel}
                </li>
              );
            })
          ) : (
            <li className="px-6 py-3 text-muted-foreground text-sm font-medium">
              No options available
            </li>
          )}
        </ul>
      )}
      {error && (
        <p className="mt-1 text-sm text-destructive ml-1 animate-in fade-in slide-in-from-top-1 duration-200">
          {error}
        </p>
      )}
    </div>
  );
}
