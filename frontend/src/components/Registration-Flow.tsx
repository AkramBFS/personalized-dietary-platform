"use client";

import Image from "next/image";
import { useState, useEffect, useMemo, useRef, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import { submitRegistration } from "@/app/actions/submitRegistration";
import { stepSchemas } from "@/lib/constants";
import ProgressBar from "./ui/ProgressBar";

// 1. Expanded to 10 unique background images
const BACKGROUNDS = [
  "/branding/bg-1.jpg", // Step 1: Country
  "/branding/bg-2.jpg", // Step 2: Goal
  "/branding/bg-3.jpg", // Step 3: Activity
  "/branding/bg-4.jpg", // Step 4: Diet
  "/branding/bg-5.jpg", // Step 5: Age/Weight
  "/branding/bg-6.jpg", // Step 6: Height
  "/branding/bg-7.jpg", // Step 7: BMI
  "/branding/bg-8.jpg", // Step 8: Medical
  "/branding/bg-9.jpg", // Step 9: Sign Up
  "/branding/bg-10.jpg", // Step 10: Review
];

const StepCountry = dynamic(() => import("./forms/StepCountrySelect"));
const StepGoal = dynamic(() => import("./forms/StepGoal"));
const StepActivity = dynamic(() => import("./forms/StepActivity"));
const StepDiet = dynamic(() => import("./forms/StepDiet"));
const StepAgeWeight = dynamic(() => import("./forms/StepAgeWeight"));
const StepHeight = dynamic(() => import("./forms/StepHeight"));
const StepBMI = dynamic(() => import("./forms/StepBMI"));
const StepMedical = dynamic(() => import("./forms/StepMedicalHistory"));
const StepSignUp = dynamic(() => import("./forms/StepSignUp"));
const StepReview = dynamic(() => import("./forms/StepReview"));

export default function RegistrationFlow() {
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [isPending, startTransition] = useTransition();
  const [isHovered, setIsHovered] = useState(false);

  const [formData, setFormData] = useState({
    country: "",
    language: "",
    goal: "",
    goalCustom: "",
    activityLevel: "",
    diet: "",
    age: 25,
    weight: 70,
    height: 170,
    gender: "",
    bmi: 24.2,
    bmr: 1600,
    medicalConditions: [],
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    agreedToTerms: false,
  });

  const stepRef = useRef<HTMLDivElement>(null);

  // 2. Direct 1:1 mapping for the background
  const bgImage = BACKGROUNDS[currentStep - 1] || BACKGROUNDS[0];

  useEffect(() => {
    const focusable = stepRef.current?.querySelector(
      "input, select, button",
    ) as HTMLElement | null;
    focusable?.focus();
  }, [currentStep]);

  const isStepValid = useMemo(() => {
    const schema = stepSchemas[currentStep - 1];
    return schema?.safeParse(formData).success ?? false;
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
        return <StepSignUp {...props} />;
      case 10:
        return <StepReview {...props} />;
      default:
        return null;
    }
  };

  return (
    <main className="relative min-h-screen w-full flex items-center justify-center p-4 overflow-hidden">
      {/* 3. Animated Background Layer */}
      <AnimatePresence>
        <motion.div
          key={bgImage}
          initial={{ opacity: 0 }}
          animate={{
            opacity: 1,
            // Sharp when mouse is out, blurred & dimmed when mouse is over the card
            filter: isHovered
              ? "blur(5px) brightness(0.8)"
              : "blur(0px) brightness(1)",
          }}
          exit={{ opacity: 0 }}
          transition={{
            opacity: { duration: 0.6, ease: "easeInOut" },
            filter: { duration: 0.4 },
          }}
          className="absolute inset-0 -z-10"
        >
          <Image
            src={bgImage}
            alt={`Step ${currentStep} Background`}
            fill
            priority
            className="object-cover"
          />
        </motion.div>
      </AnimatePresence>

      {/* 4. The Form Card */}
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="relative z-10 w-full max-w-xl p-6 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20"
      >
        <ProgressBar
          step={currentStep}
          total={10}
          color="bg-blue-600"
          trackColor="bg-blue-50"
        />

        <div className="relative overflow-hidden mt-8 min-h-[350px]">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentStep}
              ref={stepRef}
              initial={{ x: direction * 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: direction * -50, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="mt-8 flex justify-between items-center">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className="px-6 py-2 text-gray-500 hover:text-gray-800 disabled:opacity-30 transition-colors"
          >
            Back
          </button>

          {currentStep < 10 ? (
            <button
              onClick={nextStep}
              disabled={!isStepValid}
              className="px-8 py-2 bg-blue-600 text-white rounded-lg disabled:bg-blue-300 transition-all hover:bg-blue-700 shadow-md active:scale-95"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isPending || !isStepValid}
              className="px-8 py-2 bg-green-600 text-white rounded-lg disabled:opacity-50 transition-all hover:bg-green-700 shadow-md"
            >
              {isPending ? "Submitting..." : "Complete Setup"}
            </button>
          )}
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100 text-center text-sm text-gray-600">
          Already onboard?{" "}
          <a
            href="/login"
            className="text-blue-600 hover:text-blue-800 font-semibold underline underline-offset-4"
          >
            Sign in!
          </a>
        </div>
      </div>
    </main>
  );
}
