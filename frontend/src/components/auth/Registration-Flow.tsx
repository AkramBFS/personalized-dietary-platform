"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useMemo, useRef, useTransition } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import dynamic from "next/dynamic";
import { stepSchemas } from "@/lib/constants";
import ProgressBar from "../ui/ProgressBar";
import api from "@/lib/api";
import { useRouter } from "next/navigation";

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

const StepCountry = dynamic(() => import("../forms/StepCountrySelect"));
const StepGoal = dynamic(() => import("../forms/StepGoal"));
const StepActivity = dynamic(() => import("../forms/StepActivity"));
const StepDiet = dynamic(() => import("../forms/StepDiet"));
const StepAgeWeight = dynamic(() => import("../forms/StepAgeWeight"));
const StepHeight = dynamic(() => import("../forms/StepHeight"));
const StepBMI = dynamic(() => import("../forms/StepBMI"));
const StepMedical = dynamic(() => import("../forms/StepMedicalHistory"));
const StepSignUp = dynamic(() => import("../forms/StepSignUp"));
const StepReview = dynamic(() => import("../forms/StepReview"));

export default function RegistrationFlow() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isHovered, setIsHovered] = useState(false);

  const [countries, setCountries] = useState<{ id: number; name: string }[]>(
    [],
  );
  const [goals, setGoals] = useState<{ id: number; name: string }[]>([]);
  const [loadingLookup, setLoadingLookup] = useState(true);

  const router = useRouter();

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
    phone: "",
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
    const fetchLookupData = async () => {
      try {
        const [countriesRes, goalsRes] = await Promise.all([
          api.get("/lookup/countries/"),
          api.get("/lookup/goals/"),
        ]);
        setCountries(countriesRes.data);
        setGoals(goalsRes.data);
      } catch (error) {
        console.error("Failed to fetch lookup data", error);
        // Fallback to hardcoded
        setCountries([
          { id: 1, name: "United States" },
          { id: 2, name: "Canada" },
          { id: 3, name: "Algeria" },
        ]);
        setGoals([
          { id: 1, name: "Weight Loss" },
          { id: 2, name: "Muscle Gain" },
          { id: 3, name: "Maintenance" },
        ]);
      } finally {
        setLoadingLookup(false);
      }
    };
    fetchLookupData();
  }, []);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [currentStep]);

  const isStepValid = useMemo(() => {
    const schema = stepSchemas[currentStep - 1];
    return schema?.safeParse(formData).success ?? false;
  }, [currentStep, formData]);

  //lock check + lock set for next and back
  const nextStep = () => {
    if (currentStep < 10 && isStepValid && !isAnimating) {
      setIsAnimating(true);
      setCurrentStep((s) => s + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1 && !isAnimating) {
      setIsAnimating(true);
      setCurrentStep((s) => s - 1);
    }
  };

  const handleSubmit = () => {
    if (isAnimating || isPending || loadingLookup) return;
    setIsAnimating(true);
    startTransition(async () => {
      try {
        // Map form data to API payload
        const countryId = countries.find(
          (c) => c.name === formData.country,
        )?.id;
        const goalId = goals.find((g) => g.name === formData.goal)?.id;

        if (!countryId || !goalId) {
          throw new Error("Invalid country or goal selection");
        }

        const healthHistory = formData.medicalConditions
          .filter((cond) => cond !== "None")
          .concat(
            formData.medicalConditionsCustom
              ? [formData.medicalConditionsCustom]
              : [],
          )
          .join(", ");

        const payload = {
          username: formData.email, // Use email as username
          email: formData.email,
          password: formData.password,
          age: formData.age,
          weight: formData.weight,
          height: formData.height,
          gender: formData.gender,
          country_id: countryId,
          goal_id: goalId,
          health_history: healthHistory || undefined,
        };

        await api.post("/auth/register/client/", payload);
        alert("Registration Successful! Please log in.");
        router.push("/login");
      } catch (err: any) {
        console.error("Registration failed", err);
        if (err.response?.data?.message) {
          alert(err.response.data.message);
        } else {
          alert("Error submitting form");
        }
      } finally {
        setIsAnimating(false);
      }
    });
  };

  const renderStep = () => {
    const props = { formData, setFormData };
    switch (currentStep) {
      case 1:
        return <StepCountry {...props} countries={countries} />;
      case 2:
        return <StepGoal {...props} goals={goals} />;
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
          // ensure the lock is active for the full duration of the spring
          onAnimationStart={() => setIsAnimating(true)}
          onAnimationComplete={() => setIsAnimating(false)}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={`relative z-10 w-full max-w-xl h-[calc(100vh-2rem)] max-h-[850px] 
            bg-gradient-to-br from-white/90 via-white/70 to-white/90 dark:from-emerald-950/90 dark:via-emerald-950/70 dark:to-emerald-950/90 absolute inset-0 backdrop-blur-xl backdrop-saturate-150 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.15)]
            border border-white/30 dark:border-white/10 hover:shadow-[0_25px_80px_rgba(16,185,129,0.25)]
            flex flex-col overflow-hidden transition-colors duration-500
            ${isAnimating ? "pointer-events-none" : ""}`}
        >
          <div className="p-6 pb-0">
            <ProgressBar step={currentStep} total={10} />
          </div>

          <div
            ref={scrollContainerRef}
            className="relative mt-4 flex-1 overflow-y-auto overflow-x-hidden px-6 py-2 custom-scrollbar"
          >
            {renderStep()}
          </div>

          <div className="p-6 pt-4 bg-white/60 dark:bg-black/20 border-t border-gray-100 dark:border-white/10 mt-auto">
            <div className="flex justify-between items-center">
              <button
                onClick={prevStep}
                disabled={currentStep === 1 || isAnimating}
                className="px-6 py-2 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white disabled:opacity-30 transition-colors"
              >
                Back
              </button>

              {currentStep < 10 ? (
                <button
                  onClick={nextStep}
                  disabled={!isStepValid || isAnimating}
                  className="px-8 py-2 bg-gradient-to-r from-emerald-400 to-emerald-300 text-white font-semibold rounded-lg 
    transition-all duration-300 
    hover:brightness-105 hover:shadow-[0_0_20px_rgba(110,231,183,0.6)] 
    hover:-translate-y-0.5
    active:scale-95 
    disabled:opacity-50 disabled:cursor-not-allowed"
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

            <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
              Already onboard?{" "}
              <Link
                href="/login"
                className="bg-emerald-400 bg-clip-text text-transparent hover:text-emerald-600 font-semibold underline underline-offset-4"
              >
                Sign in!
              </Link>
            </div>

            <div className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
              Are you a certified nutritionist?{" "}
              <Link
                href="/register/nutritionist"
                className="bg-emerald-400 bg-clip-text text-transparent hover:text-emerald-600 font-semibold underline underline-offset-4"
              >
                Get on board!
              </Link>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </main>
  );
}
