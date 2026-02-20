"use client";

import Image from "next/image";
import { useState, useEffect, useMemo, useRef, useTransition } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import dynamic from "next/dynamic";
import { submitRegistration } from "@/app/actions/submitRegistration";
import { stepSchemas } from "@/lib/constants";
import ProgressBar from "./ui/ProgressBar";

const BACKGROUNDS = [
  "/branding/bg-1.jpg",
  "/branding/bg-2.jpg",
  "/branding/bg-3.jpg",
  "/branding/bg-4.jpg",
  "/branding/bg-5.jpg",
  "/branding/bg-6.jpg",
  "/branding/bg-7.jpg",
  "/branding/bg-8.jpg",
  "/branding/bg-9.jpg",
  "/branding/bg-10.jpg",
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
  const [isAnimating, setIsAnimating] = useState(false);
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

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const cardVariants: Variants = {
    initial: (step: number) => {
      if (step === 10) return { opacity: 1, x: 0, scale: 1 };
      if ([3, 6, 9].includes(step)) return { scale: 0.5, opacity: 0, x: 0 };
      if ([2, 5, 8].includes(step))
        return { x: "-100%", opacity: 0, rotate: -5 };
      return { x: "100%", opacity: 0, rotate: 5 };
    },
    animate: (step: number) => ({
      x: 0,
      scale: 1,
      opacity: 1,
      rotate: 0,
      transition: {
        type: "spring" as const,
        stiffness: 220,
        damping: [3, 6, 9].includes(step) ? 26 : 18,
        mass: 1,
      },
    }),
    exit: (step: number) => {
      if (step === 10) return { opacity: 1 };
      if ([3, 6, 9].includes(step)) return { scale: 0.5, opacity: 0 };
      if ([2, 5, 8].includes(step)) return { x: "-100%", opacity: 0 };
      return { x: "100%", opacity: 0 };
    },
  };

  const bgImage = BACKGROUNDS[currentStep - 1] || BACKGROUNDS[0];

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [currentStep]);

  const isStepValid = useMemo(() => {
    const schema = stepSchemas[currentStep - 1];
    return schema?.safeParse(formData).success ?? false;
  }, [currentStep, formData]);

  const nextStep = () => {
    // Immediate lock check + immediate lock set
    if (currentStep < 10 && isStepValid && !isAnimating) {
      setIsAnimating(true);
      setCurrentStep((s) => s + 1);
    }
  };

  const prevStep = () => {
    // Immediate lock check + immediate lock set
    if (currentStep > 1 && !isAnimating) {
      setIsAnimating(true);
      setCurrentStep((s) => s - 1);
    }
  };

  const handleSubmit = () => {
    if (isAnimating || isPending) return;
    setIsAnimating(true);
    startTransition(async () => {
      try {
        await submitRegistration(formData);
        alert("Registration Successful!");
      } catch (err) {
        alert("Error submitting form");
      } finally {
        setIsAnimating(false);
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
    <main className="relative h-screen w-full flex items-center justify-center p-4 overflow-hidden">
      <AnimatePresence>
        <motion.div
          key={bgImage}
          initial={{ opacity: 0 }}
          animate={{
            opacity: 1,
            filter: isHovered
              ? "blur(5px) brightness(0.8)"
              : "blur(0px) brightness(1)",
          }}
          exit={{ opacity: 0 }}
          transition={{ opacity: { duration: 0.6, ease: "easeInOut" } }}
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

      <AnimatePresence mode="popLayout" custom={currentStep}>
        <motion.div
          key={currentStep}
          custom={currentStep}
          variants={cardVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          // We keep this to ensure the lock is active for the full duration of the spring
          onAnimationStart={() => setIsAnimating(true)}
          onAnimationComplete={() => setIsAnimating(false)}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={`relative z-10 w-full max-w-xl h-[calc(100vh-2rem)] max-h-[850px] 
            bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 
            flex flex-col overflow-hidden transition-colors duration-500
            ${isAnimating ? "pointer-events-none" : ""}`}
        >
          <div className="p-6 pb-0">
            <ProgressBar
              step={currentStep}
              total={10}
              color="bg-blue-600"
              trackColor="bg-blue-50"
            />
          </div>

          <div
            ref={scrollContainerRef}
            className="relative mt-4 flex-1 overflow-y-auto overflow-x-hidden px-6 py-2 custom-scrollbar"
          >
            {renderStep()}
          </div>

          <div className="p-6 pt-4 bg-white/50 border-t border-gray-100 mt-auto">
            <div className="flex justify-between items-center">
              <button
                onClick={prevStep}
                disabled={currentStep === 1 || isAnimating}
                className="px-6 py-2 text-gray-500 hover:text-gray-800 disabled:opacity-30 transition-colors"
              >
                Back
              </button>

              {currentStep < 10 ? (
                <button
                  onClick={nextStep}
                  disabled={!isStepValid || isAnimating}
                  className="px-8 py-2 bg-blue-600 text-white rounded-lg disabled:bg-blue-300 
                    transition-all hover:bg-blue-700 shadow-md active:scale-95"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isPending || !isStepValid || isAnimating}
                  className="px-8 py-2 bg-green-600 text-white rounded-lg disabled:opacity-50 
                    transition-all hover:bg-green-700 shadow-md"
                >
                  {isPending ? "Submitting..." : "Complete Setup"}
                </button>
              )}
            </div>

            <div className="mt-6 text-center text-sm text-gray-600">
              Already onboard?{" "}
              <a
                href="/login"
                className="text-blue-600 hover:text-blue-800 font-semibold underline underline-offset-4"
              >
                Sign in!
              </a>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </main>
  );
}
