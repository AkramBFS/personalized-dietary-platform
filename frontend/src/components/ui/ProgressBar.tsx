"use client";

import { motion, useSpring, useTransform } from "framer-motion";
import { useEffect } from "react";

interface Props {
  step: number;
  total: number;
  color?: string; // Added: e.g., "bg-blue-600"
  trackColor?: string; // Added: e.g., "bg-gray-200"
}

export default function ProgressBar({
  step,
  total,
  color = "bg-blue-600",
  trackColor = "bg-gray-200",
}: Props) {
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
        className={`w-full h-2 ${trackColor} rounded-full overflow-hidden`}
      >
        <motion.div
          style={{ width: widthPercentage }}
          className={`h-full ${color} rounded-full transition-colors duration-500`}
        />
      </div>

      <div className="text-xs text-gray-500 mt-2 text-center">
        Step {step} of {total}
      </div>
    </div>
  );
}
