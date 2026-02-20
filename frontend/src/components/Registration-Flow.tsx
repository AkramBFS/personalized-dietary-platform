"use client";

import Image from "next/image";
import { useState, useEffect, useMemo, useRef, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const bgImage = BACKGROUNDS[currentStep - 1] || BACKGROUNDS[0];

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }

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

      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        /* FIX: We set a fixed height relative to the viewport (h-[calc(100vh-2rem)])
           but cap it with a max-height (max-h-[850px]) so it doesn't get ridiculously 
           tall on 4K monitors. This keeps the card dimensions constant 
           even if the form inside is empty.
        */
        className="relative z-10 w-full max-w-xl h-[calc(100vh-2rem)] max-h-[850px] bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 flex flex-col overflow-hidden"
      >
        <div className="p-6 pb-0">
          <ProgressBar
            step={currentStep}
            total={10}
            color="bg-blue-600"
            trackColor="bg-blue-50"
          />
        </div>

        {/* FIX: flex-1 tells this div to take up ALL remaining space 
            between the progress bar and the footer.
            Because the parent has a fixed height, this will also have 
            a stable, unchanging height.
        */}
        <div
          ref={scrollContainerRef}
          className="relative mt-4 flex-1 overflow-y-auto overflow-x-hidden px-6 py-2 custom-scrollbar"
        >
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentStep}
              ref={stepRef}
              initial={{ x: direction * 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: direction * -50, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="outline-none"
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="p-6 pt-4 bg-white/50 border-t border-gray-100 mt-auto">
          <div className="flex justify-between items-center">
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
      </div>
    </main>
  );
}
