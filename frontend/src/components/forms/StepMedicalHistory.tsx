"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useRef } from "react";

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
    <div className="flex flex-col items-center w-full space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-800">Medical History</h2>
        <p className="text-sm text-gray-500">
          Select all that apply. This helps us tailor your plan safely.
        </p>
      </div>

      <div className="w-full max-w-md space-y-4">
        <div className="grid grid-cols-1 gap-3">
          {CONDITIONS.map((condition) => {
            const isChecked = selected.includes(condition);
            const isNone = condition === "None";

            return (
              <button
                key={condition}
                type="button"
                onClick={() => toggleCondition(condition)}
                className={`
                  w-full flex items-center justify-between p-5 
                  border-2 rounded-2xl transition-all duration-200
                  active:scale-[0.98]
                  ${
                    isChecked
                      ? isNone
                        ? "border-emerald-500 bg-emerald-50/50"
                        : "border-blue-600 bg-blue-50/50"
                      : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                  }
                `}
              >
                <span
                  className={`text-lg font-bold ${
                    isChecked
                      ? isNone
                        ? "text-emerald-700"
                        : "text-blue-700"
                      : "text-gray-700"
                  }`}
                >
                  {condition}
                </span>
              </button>
            );
          })}
        </div>

        <AnimatePresence>
          {isOtherSelected && (
            <motion.div
              ref={otherInputRef}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              onAnimationComplete={scrollToOther}
              className="overflow-hidden"
            >
              <div className="space-y-2 pt-4 p-2">
                <label className="text-sm font-semibold text-gray-600 ml-1">
                  Please specify
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
                    w-full p-4 bg-white border border-gray-200 
                    rounded-2xl shadow-sm outline-none 
                    focus:ring-2 focus:ring-blue-500 focus:border-transparent
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
