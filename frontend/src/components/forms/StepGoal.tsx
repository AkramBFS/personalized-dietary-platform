"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useRef } from "react";

const GOALS_FALLBACK = [
  "Weight Loss",
  "Muscle Gain",
  "Improve Fitness",
  "Endurance",
  "Other",
];

interface Props {
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  goals?: { id: number; name: string }[];
}

export default function StepGoal({ formData, setFormData, goals }: Props) {
  const goalsList = goals ? goals.map((g) => g.name) : GOALS_FALLBACK;
  const isOtherSelected = formData.goal === "Other";
  const otherInputRef = useRef<HTMLDivElement | null>(null);

  const handleSelect = (g: string) => {
    setFormData((prev: any) => ({
      ...prev,
      goal: g,
      goalCustom: g === "Other" ? prev.goalCustom : "",
    }));
  };

  const scrollToOther = () => {
    if (otherInputRef.current) {
      otherInputRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  };

  // Consistent with StepCountrySelect's button styling
  const cardClasses = `
    w-full flex items-center justify-center 
    py-4 px-6 rounded-2xl 
    border transition-all duration-300
    cursor-pointer font-medium text-lg
    shadow-[0_8px_32px_rgba(0,0,0,0.05)]
    backdrop-blur-md
  `;

  return (
    <div className="flex flex-col items-center w-full space-y-10">
      {/* Header Section */}
      <div className="text-center space-y-3">
        <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">
          What is your primary goal?
        </h2>
        <p className="text-slate-600 dark:text-slate-400 font-medium max-w-xs mx-auto leading-relaxed">
          Select the option that best describes your objective.
        </p>
      </div>

      <div className="w-full max-w-md space-y-4">
        <div className="grid grid-cols-1 gap-4">
          {goalsList.map((g) => {
            const isSelected = formData.goal === g;
            return (
              <button
                key={g}
                type="button"
                onClick={() => handleSelect(g)}
                className={`
                  ${cardClasses}
                  ${
                    isSelected
                      ? "bg-emerald-400 text-white border-emerald-400 scale-[1.02] shadow-emerald-200/50"
                      : "bg-white/40 dark:bg-emerald-900/20 border-white/50 dark:border-white/10 text-slate-800 dark:text-slate-200 hover:bg-white/60 dark:hover:bg-emerald-900/30"
                  }
                `}
              >
                {g}
              </button>
            );
          })}
        </div>

        <AnimatePresence>
          {isOtherSelected && (
            <motion.div
              ref={otherInputRef}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.3 }}
              onAnimationComplete={scrollToOther}
              className="pt-4"
            >
              <div className="space-y-3">
                <label className="text-sm font-bold text-slate-700 ml-1">
                  Please specify your goal
                </label>
                <input
                  autoFocus
                  value={formData.goalCustom || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, goalCustom: e.target.value })
                  }
                  placeholder="e.g. Training for a marathon..."
                  className="
                    w-full py-4 px-6 rounded-2xl
                    bg-white/60 dark:bg-emerald-900/40 backdrop-blur-md 
                    border border-white/50 dark:border-white/10
                    text-slate-800 dark:text-white font-medium
                    shadow-[0_8px_32px_rgba(0,0,0,0.05)]
                    focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400
                    outline-none transition-all
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
