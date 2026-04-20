"use client";

import React, { useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
}

const CONDITIONS = [
  "None",
  "Diabetes",
  "Hypertension",
  "Thyroid Issues",
  "PCOS",
  "High Cholesterol",
  "Other",
];

export default function StepMedicalHistory({ formData, setFormData }: Props) {
  const selected: string[] = formData.medicalConditions || [];
  const isOtherSelected = selected.includes("Other");
  const otherInputRef = useRef<HTMLDivElement | null>(null);

  const scrollToOther = () => {
    if (otherInputRef.current) {
      otherInputRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  };

  const toggleCondition = (condition: string) => {
    if (condition === "None") {
      setFormData((prev: any) => ({
        ...prev,
        medicalConditions: ["None"],
        medicalConditionsCustom: "",
      }));
      return;
    }

    const filtered = selected.filter((c) => c !== "None");

    if (filtered.includes(condition)) {
      setFormData((prev: any) => ({
        ...prev,
        medicalConditions: filtered.filter((c) => c !== condition),
        medicalConditionsCustom:
          condition === "Other" ? "" : prev.medicalConditionsCustom,
      }));
    } else {
      setFormData((prev: any) => ({
        ...prev,
        medicalConditions: [...filtered, condition],
      }));
    }
  };

  return (
    <div className="flex flex-col items-center w-full space-y-10">
      {/* Header Section */}
      <div className="text-center space-y-3">
        <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">
          Medical History
        </h2>
        <p className="text-slate-600 dark:text-slate-400 font-medium max-w-xs mx-auto leading-relaxed">
          Select all that apply. This helps us tailor your plan safely.
        </p>
      </div>

      <div className="w-full max-w-md space-y-4">
        <div className="grid grid-cols-1 gap-4">
          {CONDITIONS.map((condition) => {
            const isChecked = selected.includes(condition);
            const isNone = condition === "None";

            return (
              <button
                key={condition}
                type="button"
                onClick={() => toggleCondition(condition)}
                className={`
                  w-full flex items-center justify-between
                  py-5 px-6 rounded-2xl border-2 transition-all duration-300
                  active:scale-[0.97] cursor-pointer
                  ${
                    isChecked
                      ? isNone
                        ? "bg-emerald-400 border-primary/50 shadow-[0_0_25px_oklch(0.72_0.17_153_/_0.4)]"
                        : "bg-emerald-400 border-emerald/50 shadow-[0_0_25px_oklch(0.25_0.06_160_/_0.3)]"
                      : "bg-white/40 dark:bg-emerald-900/20 backdrop-blur-md border-white/50 dark:border-white/10 hover:bg-white/60 dark:hover:bg-emerald-900/30 shadow-[0_8px_32px_rgba(0,0,0,0.05)]"
                  }
                `}
              >
                <span
                  className={`text-lg font-bold transition-colors ${
                    isChecked ? "text-white" : "text-slate-800 dark:text-white"
                  }`}
                >
                  {condition}
                </span>

                {/* Selection Indicator */}
                <div
                  className={`
                  h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all
                  ${
                    isChecked
                      ? "bg-white dark:bg-emerald-400 border-white dark:border-emerald-400 scale-110"
                      : "border-slate-300 dark:border-white/20 bg-transparent"
                  }
                `}
                >
                  {isChecked && (
                    <svg
                      className={`h-4 w-4 ${isNone ? "text-primary" : "text-secondary dark:text-emerald-950"}`}
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
              </button>
            );
          })}
        </div>

        {/* Custom Input for "Other" - Matches Palette */}
        <AnimatePresence>
          {isOtherSelected && (
            <motion.div
              ref={otherInputRef}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              onAnimationComplete={scrollToOther}
              className="pt-2"
            >
              <div className="space-y-3">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">
                  Please specify conditions
                </label>
                <input
                  autoFocus
                  value={formData.medicalConditionsCustom || ""}
                  onChange={(e) =>
                    setFormData((prev: any) => ({
                      ...prev,
                      medicalConditionsCustom: e.target.value,
                    }))
                  }
                  placeholder="e.g. Asthma, anemia..."
                  className="
                    w-full py-4 px-6
                    bg-white/60 dark:bg-emerald-900/40 backdrop-blur-md 
                    border-2 border-white/50 dark:border-white/10
                    rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.05)]
                    text-slate-800 dark:text-white font-semibold outline-none
                    placeholder:text-slate-400 dark:placeholder:text-slate-500
                    focus:border-primary transition-all
                  "
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
