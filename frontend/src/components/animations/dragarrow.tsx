"use client";

import React, { useState } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SlideToConfirm() {
  const router = useRouter();
  const [isCompleted, setIsCompleted] = useState(false);

  // This tracks the horizontal position of the handle
  const x = useMotionValue(0);

  // We map the x position to other styles:
  // 1. Fade out the text as we slide (from 0 to 150px)
  const opacity = useTransform(x, [0, 150], [1, 0]);
  // 2. Change the background color or "fill" progress (optional)
  const bgOpacity = useTransform(x, [0, 240], [0, 1]);

  const handleDragEnd = () => {
    // If the handle is dragged far enough (e.g., 240px), trigger the action
    if (x.get() > 230) {
      setIsCompleted(true);
      // Wait a beat for the animation to finish before redirecting
      setTimeout(() => {
        router.push("/get-started");
      }, 300);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* The Track */}
      <div className="relative h-16 w-80 rounded-full bg-emerald-100 p-2 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex items-center shadow-inner overflow-hidden">
        {/* The Sliding Progress Fill */}
        <motion.div
          style={{ width: x, opacity: bgOpacity }}
          className="absolute left-0 h-full bg-emerald-500 rounded-full"
        />

        {/* Guided Text */}
        <motion.span
          style={{ opacity }}
          className="absolute inset-0 flex items-center justify-center text-sm font-medium text-emerald-700 dark:text-emerald-400 pointer-events-none select-none"
        >
          Slide to Start Your Journey
        </motion.span>

        {/* The Draggable Handle */}
        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: 242 }} // Limits movement within the bar
          dragElastic={0.05} // Adds a tiny bit of "pull" at the end
          dragSnapToOrigin={!isCompleted} // Springs back if you let go early
          onDragEnd={handleDragEnd}
          style={{ x }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95, cursor: "grabbing" }}
          className="relative z-10 flex h-12 w-12 cursor-grab items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg transition-colors hover:bg-emerald-600"
        >
          <ArrowRight className="size-6" />
        </motion.div>
      </div>

      {isCompleted && (
        <p className="text-sm font-semibold text-emerald-600 animate-pulse">
          Redirecting...
        </p>
      )}
    </div>
  );
}
