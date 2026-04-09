"use client";

import { motion } from "framer-motion";

interface Props {
  step: number;
  total: number;
}

export default function ProgressBar({ step, total }: Props) {
  const percentage = (step / total) * 100;

  return (
    <div className="w-full">
      {/* Container Track */}
      <div className="relative w-full h-4 bg-emerald-100/30 rounded-full overflow-hidden border border-emerald-200/50 backdrop-blur-sm">
        {/* Liquid Fill Layer */}
        <motion.div
          className="absolute top-0 left-0 h-full bg-emerald-400"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ type: "spring", stiffness: 40, damping: 12 }}
        ></motion.div>

        {/* Glossy Reflection for "Water" feel */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
      </div>

      {/* Step Label */}
      <div className="flex justify-between items-center mt-3 px-1">
        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-tighter">
          Progress
        </span>
        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
          {step} <span className="text-slate-300">/</span> {total}
        </div>
      </div>
    </div>
  );
}
