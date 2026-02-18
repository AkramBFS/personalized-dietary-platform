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
      // Clear custom text if switching away from "Other"
      goalCustom: g === "Other" ? formData.goalCustom : "",
    });
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-800">
        What is your primary goal?
      </h2>
      <div className="grid grid-cols-1 gap-3">
        {GOALS.map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => handleSelect(g)}
            className={`p-4 text-left border rounded-xl transition-all active:scale-[0.98] ${
              formData.goal === g
                ? "border-blue-600 bg-blue-50 ring-2 ring-blue-100"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <span
              className={
                formData.goal === g
                  ? "text-blue-700 font-medium"
                  : "text-gray-700"
              }
            >
              {g}
            </span>
          </button>
        ))}
      </div>

      <AnimatePresence>
        {isOtherSelected && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <label className="block text-sm font-medium text-gray-500 mb-2 ml-1">
              Please specify
            </label>
            <input
              type="text"
              autoFocus
              value={formData.goalCustom || ""}
              onChange={(e) =>
                setFormData({ ...formData, goalCustom: e.target.value })
              }
              placeholder="e.g. Training for a marathon..."
              className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
