"use client";

import { motion } from "framer-motion";

interface Props {
  step: number;
  total: number;
}

export default function ProgressBar({ step, total }: Props) {
  return (
    <div className="w-full">
      {/* Segmented Track */}
      <div className="flex gap-2 h-2.5 w-full">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className="relative flex-1 h-full bg-gray-200 rounded-full overflow-hidden border border-gray-300"
          >
            {i + 1 <= step && (
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                transition={{ type: "spring", stiffness: 100, damping: 15 }}
                className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-yellow-400"
              />
            )}
          </div>
        ))}
      </div>

      {/* Step Label */}
      <div className="text-[11px] font-bold text-slate-500 mt-3 text-center uppercase tracking-widest">
        Step {step} of {total}
      </div>
    </div>
  );
}
