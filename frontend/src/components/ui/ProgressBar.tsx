"use client";

import { motion, useSpring, useTransform } from "framer-motion";
import { useEffect } from "react";

interface Props {
  step: number;
  total: number;
}

export default function ProgressBar({ step, total }: Props) {
  const percentage = (step / total) * 100;

  const spring = useSpring(percentage, {
    stiffness: 120,
    damping: 20,
    mass: 0.8,
  });

  const widthPercentage = useTransform(spring, (value) => `${value}%`);

  useEffect(() => {
    spring.set(percentage);
  }, [percentage, spring]);

  return (
    <div className="w-full">
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(percentage)}
        aria-label="Registration progress"
        className="w-full h-2 bg-gray-200 rounded-full overflow-hidden"
      >
        <motion.div
          style={{ width: widthPercentage }}
          className="h-full bg-blue-600 rounded-full shadow-[0_0_8px_rgba(37,99,235,0.6)]"
        />
      </div>

      <div className="text-xs text-gray-500 mt-2 text-center">
        Step {step} of {total}
      </div>
    </div>
  );
}
