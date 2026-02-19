"use client";

import { motion, AnimatePresence } from "framer-motion";

const GOALS = [
  "Weight Loss",
  "Muscle Gain",
  "Improve Fitness",
  "Endurance",
  "Other",
];

export default function StepGoal({ formData, setFormData }: any) {
  const isOtherSelected = formData.goal === "Other";

  const handleSelect = (g: string) => {
    setFormData({
      ...formData,
      goal: g,
      goalCustom: g === "Other" ? formData.goalCustom : "",
    });
  };

  return (
    <div className="flex flex-col items-center w-full space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-800">
          What is your primary goal?
        </h2>
        <p className="text-sm text-gray-500">
          Select the option that best describes your objective.
        </p>
      </div>

      <div className="w-full max-w-md space-y-4">
        <div className="grid grid-cols-1 gap-3">
          {GOALS.map((g) => {
            const isSelected = formData.goal === g;
            return (
              <button
                key={g}
                type="button"
                onClick={() => handleSelect(g)}
                className={`
                  w-full flex items-center justify-center p-5 
                  border-2 rounded-2xl transition-all duration-200
                  active:scale-[0.98] 
                  ${
                    isSelected
                      ? "border-blue-600 bg-blue-50/50 shadow-sm"
                      : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                  }
                `}
              >
                <span
                  className={`text-lg transition-colors ${isSelected ? "text-blue-700 font-bold" : "text-gray-600 font-semibold"}`}
                >
                  {g}
                </span>
              </button>
            );
          })}
        </div>

        <AnimatePresence>
          {isOtherSelected && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="space-y-2 pt-4">
                <label className="text-sm font-semibold text-gray-600 ml-1">
                  Please specify your goal
                </label>
                <input
                  type="text"
                  autoFocus
                  value={formData.goalCustom || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, goalCustom: e.target.value })
                  }
                  placeholder="e.g. Training for a marathon..."
                  className="
                    w-full p-4 bg-white border border-gray-200 
                    rounded-2xl shadow-sm outline-none 
                    focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                    transition-all text-gray-700
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
