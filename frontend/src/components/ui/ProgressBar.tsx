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
      {/* Step Label - Moved to top for elegance */}
      <div className="flex justify-between items-end mb-2 px-1">
        <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Step {step} of {total}
        </span>
        <div className="text-xs font-semibold text-foreground">
          {Math.round(percentage)}%
        </div>
      </div>

      {/* Container Track */}
      <div className="relative w-full h-1.5 bg-secondary rounded-full overflow-hidden">
        {/* Fill Layer */}
        <motion.div
          className="absolute top-0 left-0 h-full bg-primary rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
        />
      </div>
    </div>
  );
}
