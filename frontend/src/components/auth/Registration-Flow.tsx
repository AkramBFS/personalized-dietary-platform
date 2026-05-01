"use client";

import Link from "next/link";
import { useState, useEffect, useMemo, useRef, useTransition } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import dynamic from "next/dynamic";
import { stepSchemas } from "@/lib/constants";
import ProgressBar from "../ui/ProgressBar";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import { Home } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";

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

  const [countries, setCountries] = useState<{ id: number; name: string }[]>(
    [],
  );
  const [goals, setGoals] = useState<{ id: number; name: string }[]>([]);
  const [languages, setLanguages] = useState<{ id: number; name: string }[]>(
    [],
  );
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
    medicalConditions: [] as string[],
    medicalConditionsCustom: "",
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    agreedToTerms: false,
  });

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const cardVariants: Variants = {
    initial: (step: number) => {
      // Step 10: Simple fade in
      if (step === 10) return { opacity: 0, y: 10 }; 
      
      // Group 1 (Steps 3, 6, 9): Fade in while going from small to big
      if ([3, 6, 9].includes(step)) return { scale: 0.95, opacity: 0, x: 0 };
      
      // Group 2 (Steps 2, 5, 8): Fade in while sliding in from the left
      if ([2, 5, 8].includes(step)) return { x: -40, opacity: 0 };
      
      // Default (Steps 1, 4, 7): Fade in while sliding in from the right
      return { x: 40, opacity: 0 };
    },
    animate: {
      x: 0,
      y: 0,
      scale: 1,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: [0.25, 0.1, 0.25, 1], // Elegant ease-out curve
      },
    },
    exit: (step: number) => {
      if (step === 10) return { opacity: 0 };
      if ([3, 6, 9].includes(step)) return { scale: 1.05, opacity: 0 };
      if ([2, 5, 8].includes(step)) return { x: 40, opacity: 0 };
      return { x: -40, opacity: 0 };
    },
  };

  useEffect(() => {
    const fetchLookupData = async () => {
      try {
        const [countriesRes, goalsRes, languagesRes] = await Promise.all([
          api.get("/lookup/countries/"),
          api.get("/lookup/goals/"),
          api.get("/lookup/languages/"),
        ]);
        const extractData = (res: any) => {
          if (Array.isArray(res.data)) return res.data;
          if (res.data && Array.isArray(res.data.results)) return res.data.results;
          return [];
        };
        setCountries(extractData(countriesRes));
        setGoals(extractData(goalsRes));
        setLanguages(extractData(languagesRes));
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
        setLanguages([
          { id: 1, name: "English" },
          { id: 2, name: "Arabic" },
          { id: 3, name: "French" },
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

        const healthHistory = (formData.medicalConditions as string[])
          .filter((cond) => cond !== "None")
          .concat(
            formData.medicalConditionsCustom
              ? [formData.medicalConditionsCustom]
              : [],
          )
          .join(", ");

        const payload = new FormData();
        payload.append("username", formData.email); // Use email as username
        payload.append("email", formData.email);
        payload.append("password", formData.password);
        payload.append("age", formData.age.toString());
        payload.append("weight", formData.weight.toString());
        payload.append("height", formData.height.toString());
        payload.append("gender", formData.gender);
        payload.append("country_id", countryId.toString());
        payload.append("goal_id", goalId.toString());
        if (healthHistory) {
          payload.append("health_history", healthHistory);
        }

        await api.post("/auth/register/client/", payload, {
          headers: {
            "Content-Type": undefined,
          },
        });
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
        return (
          <StepCountry {...props} countries={countries} languages={languages} />
        );
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
    <main className="relative h-screen w-full flex items-center justify-center p-4 overflow-hidden bg-background">
      <div className="absolute top-6 right-6 z-50 flex items-center gap-4">
        <Link
          href="/"
          className="p-2 rounded-full bg-card/50 backdrop-blur-md border border-border hover:bg-accent transition-colors"
          title="Back to Home"
        >
          <Home className="w-5 h-5 text-foreground" />
        </Link>
        <div className="p-1 rounded-full bg-card/50 backdrop-blur-md border border-border">
          <ThemeToggle />
        </div>
      </div>

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
          className={`relative z-10 w-full max-w-xl h-[calc(100vh-2rem)] max-h-[850px] 
            absolute inset-0 flex flex-col overflow-hidden transition-colors duration-500
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

          <div className="p-6 pt-4 mt-auto">
            <div className="flex justify-between items-center">
              <button
                onClick={prevStep}
                disabled={currentStep === 1 || isAnimating}
                className="px-6 py-2 text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
              >
                Back
              </button>

              {currentStep < 10 ? (
                <button
                  onClick={nextStep}
                  disabled={!isStepValid || isAnimating}
                  className="px-8 py-2 bg-button-primary text-button-primary-foreground font-semibold rounded-lg 
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
                  className="px-8 py-2 bg-button-primary text-button-primary-foreground rounded-lg disabled:opacity-50 
                    transition-all hover:brightness-105 shadow-md"
                >
                  {isPending ? "Submitting..." : "Complete Setup"}
                </button>
              )}
            </div>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              Already onboard?{" "}
              <Link
                href="/login"
                className="text-brand hover:text-brand/80 font-semibold underline underline-offset-4"
              >
                Sign in!
              </Link>
            </div>

            <div className="mt-2 text-center text-sm text-muted-foreground">
              Are you a certified nutritionist?{" "}
              <Link
                href="/register/nutritionist"
                className="text-brand hover:text-brand/80 font-semibold underline underline-offset-4"
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
