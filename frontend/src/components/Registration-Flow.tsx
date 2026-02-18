"use client";

import { useState, useEffect, useMemo, useRef, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import { submitRegistration } from "@/app/actions/submitRegistration";
import { stepSchemas } from "@/lib/constants";
import ProgressBar from "./ui/ProgressBar";

// Dynamic Imports
const StepCountry = dynamic(() => import("./forms/StepCountrySelect"));
const StepGoal = dynamic(() => import("./forms/StepGoal"));
const StepActivity = dynamic(() => import("./forms/StepActivity"));
const StepDiet = dynamic(() => import("./forms/StepDiet"));
const StepAgeWeight = dynamic(() => import("./forms/StepAgeWeight"));
const StepHeight = dynamic(() => import("./forms/StepHeight"));
const StepBMI = dynamic(() => import("./forms/StepBMI"));
const StepMedical = dynamic(() => import("./forms/StepMedicalHistory"));
const StepLifestyle = dynamic(() => import("./forms/StepLifestyle"));
const StepReview = dynamic(() => import("./forms/StepReview"));

export default function RegistrationFlow() {
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [isPending, startTransition] = useTransition();

  // FIX: Incomplete initialization/SSR safety
  const [formData, setFormData] = useState(() => {
    const defaultData = {
      country: "",
      goal: "",
      activityLevel: "",
      diet: "",
      age: 25,
      weight: 70,
      height: 170,
      bmi: 24.2,
      medicalConditions: [],
      sleepHours: 8,
      agreedToTerms: false,
    };

    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("registrationData");
      return saved ? JSON.parse(saved) : defaultData;
    }
    return defaultData; // Return default data when window is undefined (SSR)
  });

  useEffect(() => {
    localStorage.setItem("registrationData", JSON.stringify(formData));
  }, [formData]);

  // FIX: Typed ref for motion.div
  const stepRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const focusable = stepRef.current?.querySelector(
      "input, select, button",
    ) as HTMLElement;
    focusable?.focus();
  }, [currentStep]);

  const isStepValid = useMemo(() => {
    const schema = stepSchemas[currentStep - 1];
    return schema?.safeParse(formData).success;
  }, [currentStep, formData]);

  const nextStep = () => {
    if (currentStep < 10 && isStepValid) {
      setDirection(1);
      setCurrentStep((s) => s + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setDirection(-1);
      setCurrentStep((s) => s - 1);
    }
  };

  const handleSubmit = () => {
    startTransition(async () => {
      try {
        await submitRegistration(formData);
        alert("Registration Successful!");
        localStorage.removeItem("registrationData");
      } catch (err) {
        alert("Error submitting form");
      }
    });
  };

  const renderStep = () => {
    const props = { formData, setFormData };
    switch (currentStep) {
      case 1:
        return <StepCountry {...props} />;
      case 2:
        return <StepGoal {...props} />;
      case 3:
        return <StepActivity {...props} />;
      case 4:
        return <StepDiet {...props} />;
      case 5:
        return <StepAgeWeight {...props} />;
      case 6:
        return <StepHeight {...props} />;
      case 7:
        return <StepBMI {...props} />;
      case 8:
        return <StepMedical {...props} />;
      case 9:
        return <StepLifestyle {...props} />;
      case 10:
        return <StepReview {...props} />;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded-2xl shadow-sm border mt-10">
      <ProgressBar step={currentStep} total={10} />

      <div className="relative overflow-hidden mt-8 min-h-[350px]">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStep}
            ref={stepRef}
            initial={{ x: direction * 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: direction * -50, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-8 flex justify-between">
        <button
          onClick={prevStep}
          disabled={currentStep === 1}
          className="px-6 py-2 text-gray-500 disabled:opacity-30"
        >
          Back
        </button>

        {currentStep < 10 ? (
          <button
            onClick={nextStep}
            disabled={!isStepValid}
            className="px-8 py-2 bg-blue-600 text-white rounded-lg disabled:bg-blue-300 transition-colors"
          >
            Next
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={isPending || !isStepValid}
            className="px-8 py-2 bg-green-600 text-white rounded-lg disabled:opacity-50 transition-colors"
          >
            {isPending ? "Submitting..." : "Complete Setup"}
          </button>
        )}
      </div>
    </div>
  );
}
