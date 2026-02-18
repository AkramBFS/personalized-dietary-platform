"use client";
import { submitRegistration } from "@/app/actions/register";

import { useState, useEffect, useMemo, useTransition, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Target,
  Globe,
  Languages,
  User,
  Ruler,
  Weight,
  HeartPulse,
  Flame,
  ArrowLeft,
  ArrowRight,
  Check,
} from "lucide-react";

// Types

type FormData = {
  goal: string;
  country: string;
  language: string;
  age: number | null;
  gender: string;
  height: number | null;
  weight: number | null;
  medicalHistory: string;
  metabolism: string;
};

// Constants

const TOTAL_STEPS = 4;
const STORAGE_KEY = "registration-flow-v1";

// Main Component

export default function RegistrationFlow() {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [isPending, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState<FormData>({
    goal: "",
    country: "",
    language: "",
    age: null,
    gender: "",
    height: null,
    weight: null,
    medicalHistory: "",
    metabolism: "",
  });

  // Auto-scroll on step change

  useEffect(() => {
    containerRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, [step]);

  // Load from localStorage

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setFormData(JSON.parse(stored));
    }
  }, []);

  // Save to localStorage

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
  }, [formData]);

  // Update form field

  const updateField = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Validation

  const isStepValid = useMemo(() => {
    switch (step) {
      case 0:
        return (
          formData.goal && formData.country.trim() && formData.language.trim()
        );
      case 1:
        return (
          formData.age &&
          formData.age >= 12 &&
          formData.age <= 100 &&
          formData.gender &&
          formData.height &&
          formData.height >= 120 &&
          formData.height <= 250 &&
          formData.weight &&
          formData.weight >= 30 &&
          formData.weight <= 300
        );
      case 2:
        return formData.medicalHistory.trim().length > 5;
      case 3:
        return formData.metabolism !== "";
      default:
        return false;
    }
  }, [formData, step]);

  // Navigation

  const nextStep = () => {
    if (!isStepValid) return;

    setDirection(1);

    if (step === TOTAL_STEPS - 1) {
      startTransition(async () => {
        await submitRegistration(formData);
      });
    } else {
      setStep((prev) => prev + 1);
    }
  };

  const prevStep = () => {
    setDirection(-1);
    setStep((prev) => Math.max(prev - 1, 0));
  };

  const progressPercent = ((step + 1) / TOTAL_STEPS) * 100;

  // Render

  return (
    <div
      ref={containerRef}
      className="min-h-screen flex flex-col bg-[#f7faf7] dark:bg-zinc-900 transition-colors"
    >
      {/* Progress */}
      <div className="sticky top-0 z-50 backdrop-blur-md bg-white/80 dark:bg-zinc-900/80 border-b">
        <div className="h-2 bg-gray-200 dark:bg-zinc-800">
          <motion.div
            className="h-full bg-[#0e9859]"
            animate={{ width: `${progressPercent}%` }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
          />
        </div>

        {/* Step Dots */}
        <div className="flex justify-center gap-4 py-4">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <motion.button
              key={i}
              onClick={() => setStep(i)}
              className={`w-3 h-3 rounded-full ${
                i <= step ? "bg-[#0e9859]" : "bg-gray-300 dark:bg-zinc-700"
              }`}
              layout
              transition={{ type: "spring", stiffness: 200 }}
              aria-label={`Go to step ${i + 1}`}
            />
          ))}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-2xl relative overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ x: direction > 0 ? 20 : -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: direction > 0 ? -20 : 20, opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              {step === 0 && <StepGoals data={formData} update={updateField} />}
              {step === 1 && (
                <StepPhysical data={formData} update={updateField} />
              )}
              {step === 2 && (
                <StepMedical data={formData} update={updateField} />
              )}
              {step === 3 && (
                <StepMetabolism data={formData} update={updateField} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation */}
      <div className="p-6 border-t bg-white dark:bg-zinc-900">
        <div className="max-w-2xl mx-auto flex justify-between">
          <button
            onClick={prevStep}
            disabled={step === 0}
            className="flex items-center gap-2 px-5 py-2 rounded-xl border disabled:opacity-40"
          >
            <ArrowLeft size={18} />
            Back
          </button>

          <button
            onClick={nextStep}
            disabled={!isStepValid || isPending}
            className="flex items-center gap-2 px-6 py-2 rounded-xl bg-[#0e9859] text-white disabled:opacity-40"
          >
            {step === TOTAL_STEPS - 1 ? "Submit" : "Next"}
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

// Selectable card component

function SelectableCard({
  children,
  selected,
  onClick,
}: {
  children: React.ReactNode;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      role="radio"
      aria-checked={selected}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 200 }}
      onClick={onClick}
      className={`relative p-5 rounded-2xl border text-lg font-medium transition
        ${
          selected
            ? "border-[#0e9859] bg-[#bcf4b3]/30 dark:bg-[#0e9859]/20"
            : "border-gray-200 dark:border-zinc-700 hover:border-[#0e9859]"
        }`}
    >
      {children}

      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="absolute top-3 right-3 text-[#0e9859]"
          >
            <Check size={20} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
// Step 1: Goals

function StepGoals({
  data,
  update,
}: {
  data: FormData;
  update: (field: keyof FormData, value: any) => void;
}) {
  const goals = ["Weight loss", "Better sleep", "Hormone balance", "Energy"];

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold">What do you need?</h2>

      <div className="grid grid-cols-2 gap-4">
        {goals.map((goal) => (
          <SelectableCard
            key={goal}
            selected={data.goal === goal}
            onClick={() => update("goal", goal)}
          >
            {goal}
          </SelectableCard>
        ))}
      </div>

      <div className="grid gap-4">
        <input
          type="text"
          placeholder="Country"
          value={data.country}
          onChange={(e) => update("country", e.target.value)}
          className="w-full border p-3 rounded-xl"
        />
        <input
          type="text"
          placeholder="Language"
          value={data.language}
          onChange={(e) => update("language", e.target.value)}
          className="w-full border p-3 rounded-xl"
        />
      </div>
    </div>
  );
}

// Step 2: Physical profile

function StepPhysical({
  data,
  update,
}: {
  data: FormData;
  update: (field: keyof FormData, value: any) => void;
}) {
  const genders = ["Male", "Female", "Other"];

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold">Your Physical Profile</h2>

      <input
        type="number"
        placeholder="Age"
        value={data.age ?? ""}
        onChange={(e) =>
          update("age", e.target.value ? Number(e.target.value) : null)
        }
        className="w-full border p-3 rounded-xl"
      />

      <div className="grid grid-cols-3 gap-4">
        {genders.map((gender) => (
          <SelectableCard
            key={gender}
            selected={data.gender === gender}
            onClick={() => update("gender", gender)}
          >
            {gender}
          </SelectableCard>
        ))}
      </div>

      <input
        type="number"
        placeholder="Height (cm)"
        value={data.height ?? ""}
        onChange={(e) =>
          update("height", e.target.value ? Number(e.target.value) : null)
        }
        className="w-full border p-3 rounded-xl"
      />

      <input
        type="number"
        placeholder="Weight (kg)"
        value={data.weight ?? ""}
        onChange={(e) =>
          update("weight", e.target.value ? Number(e.target.value) : null)
        }
        className="w-full border p-3 rounded-xl"
      />
    </div>
  );
}

// Step 3: Medical history

function StepMedical({
  data,
  update,
}: {
  data: FormData;
  update: (field: keyof FormData, value: any) => void;
}) {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">Medical Background</h2>

      <textarea
        placeholder="Describe any medical conditions or past treatments..."
        value={data.medicalHistory}
        onChange={(e) => update("medicalHistory", e.target.value)}
        className="w-full p-4 border rounded-xl"
        rows={6}
      />
    </div>
  );
}

// Step 4: Metabolism type

function StepMetabolism({
  data,
  update,
}: {
  data: FormData;
  update: (field: keyof FormData, value: any) => void;
}) {
  const types = ["Slow", "Normal", "Fast"];

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold">Metabolism Type</h2>

      <div className="grid grid-cols-3 gap-4">
        {types.map((type) => (
          <SelectableCard
            key={type}
            selected={data.metabolism === type}
            onClick={() => update("metabolism", type)}
          >
            {type}
          </SelectableCard>
        ))}
      </div>
    </div>
  );
}
