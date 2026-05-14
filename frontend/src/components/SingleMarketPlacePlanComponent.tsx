"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  BadgeCheck,
  Calendar,
  Globe,
  Info,
  Loader2,
  MessageCircle,
  ShoppingCart,
  Star,
  StarHalf,
  Stethoscope,
  UserRound,
} from "lucide-react";
import {
  getMarketplacePlanDetail,
  getNutritionistProfile,
  MarketplaceNutritionistProfile,
  MarketplacePlanDayContent,
  MarketplacePlanDetail,
  parseMarketplacePlanIdFromSlug,
  resolveApiUrl,
} from "@/lib/api";
import { buildPaymentUrl } from "@/lib/payment";

interface PlanProps {
  slug: string;
}

const FALLBACK_PLAN_IMAGE =
  "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1200&q=80";

function renderStars(rating: number) {
  const normalizedRating = Math.max(0, Math.min(5, Math.round(rating * 2) / 2));
  const stars = [];

  for (let i = 1; i <= 5; i += 1) {
    if (i <= normalizedRating) {
      stars.push(<Star key={i} className="w-4 h-4 fill-brand text-brand" />);
    } else if (i - 0.5 === normalizedRating) {
      stars.push(
        <StarHalf key={i} className="w-4 h-4 fill-brand text-brand" />,
      );
    } else {
      stars.push(<Star key={i} className="w-4 h-4 text-muted" />);
    }
  }

  return <div className="flex items-center gap-0.5">{stars}</div>;
}

function formatPrice(price: number) {
  return `$${price.toFixed(2)}`;
}

function formatMealCalories(calories: number) {
  return `${calories} kcal`;
}

function mealEntries(day: MarketplacePlanDayContent) {
  return [
    { key: "breakfast", label: "Breakfast", meal: day.breakfast },
    { key: "lunch", label: "Lunch", meal: day.lunch },
    { key: "dinner", label: "Dinner", meal: day.dinner },
    { key: "snacks", label: "Snacks", meal: day.snacks },
  ];
}

export default function SingleMarketPlacePlanComponent({ slug }: PlanProps) {
  const [plan, setPlan] = useState<MarketplacePlanDetail | null>(null);
  const [nutritionist, setNutritionist] =
    useState<MarketplaceNutritionistProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const detailRequestIdRef = useRef(0);

  const planId = useMemo(() => parseMarketplacePlanIdFromSlug(slug), [slug]);

  useEffect(() => {
    if (!planId) {
      setLoading(false);
      setError("This marketplace plan link is invalid.");
      return;
    }

    const fetchPlan = async () => {
      const requestId = detailRequestIdRef.current + 1;
      detailRequestIdRef.current = requestId;
      setLoading(true);
      setError(null);

      try {
        const planDetail = await getMarketplacePlanDetail(planId);
        if (requestId !== detailRequestIdRef.current) return;

        setPlan(planDetail);

        try {
          const profile = await getNutritionistProfile(
            planDetail.nutritionist_id,
          );
          if (requestId !== detailRequestIdRef.current) return;
          setNutritionist(profile);
        } catch (profileError) {
          if (requestId !== detailRequestIdRef.current) return;
          console.error("Failed to load nutritionist profile", profileError);
          setNutritionist(null);
        }
      } catch (fetchError) {
        if (requestId !== detailRequestIdRef.current) return;
        console.error("Failed to fetch marketplace plan", fetchError);
        setPlan(null);
        setNutritionist(null);
        setError("We couldn't load this plan right now.");
      } finally {
        if (requestId !== detailRequestIdRef.current) return;
        setLoading(false);
      }
    };

    void fetchPlan();
  }, [planId]);

  const previewDay = plan?.content_json[0] ?? null;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 text-brand animate-spin" />
        <p className="text-muted-foreground animate-pulse">
          Loading protocol details...
        </p>
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="bg-background text-foreground min-h-screen flex items-center justify-center px-6">
        <div className="max-w-xl w-full bg-card border border-border rounded-3xl p-10 text-center shadow-sm">
          <h1 className="text-3xl font-semibold text-foreground mb-4">
            Plan unavailable
          </h1>
          <p className="text-muted-foreground mb-8">
            {error || "We couldn't find the requested marketplace plan."}
          </p>
          <Link
            href="/marketplace"
            className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-brand text-brand-foreground font-semibold hover:opacity-90 transition-opacity"
          >
            Back to Marketplace
          </Link>
        </div>
      </div>
    );
  }

  const imageSrc = resolveApiUrl(plan.cover_image_url) ?? FALLBACK_PLAN_IMAGE;
  const providerName =
    nutritionist?.user?.username ||
    nutritionist?.username ||
    plan.nutritionist_username;
  const providerBio =
    nutritionist?.bio || "This nutritionist has not added a public bio yet.";
  const providerCountry =
    plan.country_name || nutritionist?.country_name || "Country not listed";
  const providerSpecialization =
    plan.specialization_name ||
    nutritionist?.specialization_name ||
    "Nutrition Specialist";
  const paymentHref = buildPaymentUrl({
    type: "marketplace-plan",
    planId: plan.id,
  });

  return (
    <div className="bg-background text-foreground font-sans min-h-screen flex flex-col selection:bg-brand selection:text-brand-foreground mt-8">
      <main className="flex-grow w-full max-w-[1280px] mx-auto px-6 md:px-8 py-12 flex flex-col gap-20">
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col gap-6"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-brand/10 border border-brand/20 w-fit">
              <BadgeCheck className="w-4 h-4 text-brand" />
              <span className="text-xs font-bold text-brand uppercase tracking-wider">
                {plan.category === "seasonal"
                  ? "Seasonal Protocol"
                  : "Clinical Grade Protocol"}
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-7xl font-serif font-medium text-foreground leading-tight tracking-tight">
              {plan.title}
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-xl font-light leading-relaxed">
              {plan.description}
            </p>

            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary border border-border">
                <Stethoscope className="w-4 h-4 text-brand" />
                {providerSpecialization}
              </span>
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary border border-border">
                <Globe className="w-4 h-4 text-brand" />
                {providerCountry}
              </span>
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary border border-border">
                <Calendar className="w-4 h-4 text-brand" />
                {plan.duration_days} days
              </span>
            </div>

            <div className="flex items-end gap-4 mt-4 mb-2">
              <div className="flex flex-col">
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">
                  Investment
                </span>
                <span className="text-4xl font-serif text-brand">
                  {formatPrice(plan.price)}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mt-2">
              <Link
                href={paymentHref}
                className="flex items-center justify-center gap-3 bg-brand text-brand-foreground px-8 py-4 rounded-lg font-bold text-sm uppercase tracking-widest hover:opacity-90 transition-all duration-300 shadow-lg shadow-brand/20 cursor-pointer"
              >
                <ShoppingCart className="w-5 h-5" />
                Purchase Plan
              </Link>
              <button
                className="flex items-center justify-center gap-2 border border-border text-foreground px-8 py-4 rounded-lg font-bold text-sm uppercase tracking-widest hover:bg-muted transition-all duration-300 cursor-pointer"
                onClick={() =>
                  document
                    .getElementById("sample-menu-section")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
                type="button"
              >
                View Sample Menu
              </button>
            </div>

            <div className="flex items-center gap-4 mt-4">
              {renderStars(plan.rating_avg)}
              <span className="text-sm font-semibold text-muted-foreground">
                {plan.rating_avg.toFixed(1)}/5 rating
              </span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative rounded-3xl shadow-2xl bg-card border border-border p-4 aspect-[4/3] group"
          >
            <div className="relative w-full h-full rounded-2xl overflow-hidden">
              <img
                src={imageSrc}
                alt={plan.title}
                className="w-full h-full object-cover grayscale-[0.15] transition-transform duration-700 group-hover:scale-105"
              />
            </div>
          </motion.div>
        </section>

        <section>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="lg:col-span-8 bg-card rounded-2xl p-8 md:p-10 border border-border shadow-sm flex flex-col justify-center"
            >
              <h2 className="text-3xl lg:text-4xl font-serif font-medium text-foreground mb-8 tracking-tight">
                Plan Overview
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                <div className="flex flex-col gap-4">
                  <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center border border-border">
                    <Calendar className="w-6 h-6 text-brand" />
                  </div>
                  <h3 className="text-lg font-bold uppercase tracking-widest text-foreground">
                    Plan Duration
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    This protocol is structured across {plan.duration_days} days
                    of guided meals and instructions.
                  </p>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center border border-border">
                    <MessageCircle className="w-6 h-6 text-brand" />
                  </div>
                  <h3 className="text-lg font-bold uppercase tracking-widest text-foreground">
                    Included Support
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Includes {plan.free_consultations_per_week} free
                    consultation
                    {plan.free_consultations_per_week === 1 ? "" : "s"} per week
                    with the plan provider.
                  </p>
                </div>
              </div>
            </motion.div>

            <div className="lg:col-span-4 flex flex-col gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="bg-brand text-brand-foreground rounded-2xl p-8 flex items-center gap-6 shadow-lg shadow-brand/10"
              >
                <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <Calendar className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white/80 uppercase tracking-wider mb-1">
                    Duration
                  </p>
                  <p className="text-3xl font-extrabold text-white">
                    {plan.duration_days} Days
                  </p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="bg-card rounded-2xl p-8 border border-border flex items-center gap-6 shadow-sm group hover:border-brand/30 transition-colors"
              >
                <div className="w-14 h-14 rounded-full bg-secondary border border-border flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <ShoppingCart className="w-7 h-7 text-brand" />
                </div>
                <div>
                  <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-1">
                    Price
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {formatPrice(plan.price)}
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm"
        >
          <div className="grid grid-cols-1 md:grid-cols-5 items-stretch">
            <div className="md:col-span-2 relative min-h-[280px] bg-muted flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-br from-brand/10 to-transparent" />
              <div className="relative z-10 text-center px-8">
                <div className="w-20 h-20 rounded-full bg-brand/10 border border-brand/20 flex items-center justify-center mx-auto mb-4">
                  <UserRound className="w-10 h-10 text-brand" />
                </div>
                <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">
                  Provider
                </p>
                <h3 className="text-2xl font-serif mt-2 text-foreground">
                  {providerName}
                </h3>
              </div>
            </div>

            <div className="md:col-span-3 p-10 md:p-14 flex flex-col justify-center bg-secondary/30 border-l-[6px] border-brand">
              <BadgeCheck className="w-12 h-12 text-brand/20 mb-6" />
              <p className="text-2xl md:text-3xl font-serif italic text-foreground mb-8 leading-snug">
                {providerBio}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-foreground mb-1">
                    Specialization
                  </p>
                  <p className="text-muted-foreground">
                    {providerSpecialization}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-foreground mb-1">
                    Country
                  </p>
                  <p className="text-muted-foreground">{providerCountry}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-foreground mb-1">
                    Experience
                  </p>
                  <p className="text-muted-foreground">
                    {nutritionist?.years_experience !== undefined
                      ? `${nutritionist.years_experience} years`
                      : "Not listed"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        <section
          id="sample-menu-section"
          className="bg-secondary/30 rounded-2xl p-8 md:p-12 border border-border"
        >
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-10">
            <div>
              <h2 className="text-3xl lg:text-4xl font-serif font-medium text-foreground tracking-tight">
                Plan Schedule
              </h2>
              <p className="text-muted-foreground mt-3 max-w-2xl">
                Preview day one of this plan’s menu structure, ingredients,
                calories, and daily instructions.
              </p>
            </div>
          </div>

          {plan.content_json.length === 0 ? (
            <div className="bg-card rounded-2xl border border-border p-10 text-center">
              <p className="text-muted-foreground">
                No day-by-day content is available for this plan yet.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="rounded-2xl border border-border bg-card p-5 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-bold uppercase tracking-widest text-foreground">
                    Sample Menu
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Public preview shows day 1 only. Full plan access starts
                    after purchase.
                  </p>
                </div>
                <span className="inline-flex items-center rounded-full bg-brand/10 border border-brand/20 px-4 py-2 text-sm font-semibold text-brand">
                  Day 1 Preview
                </span>
              </div>

              {previewDay && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {mealEntries(previewDay).map(({ key, label, meal }) => (
                      <div
                        key={key}
                        className="bg-card p-6 rounded-2xl border border-border flex flex-col gap-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h4 className="text-sm font-bold uppercase tracking-widest text-foreground mb-1">
                              {label}
                            </h4>
                            <p className="text-xl font-serif text-foreground">
                              {/* Add optional chaining here */}
                              {meal?.name || `${label} to be announced`}
                            </p>
                          </div>
                          <span className="text-xs font-semibold text-brand bg-brand/10 border border-brand/20 px-3 py-1.5 rounded-full">
                            {/* Safely pass calories or default to 0 */}
                            {meal?.calories
                              ? formatMealCalories(meal.calories)
                              : formatMealCalories(0)}
                          </span>
                        </div>

                        {/* Safely check for notes */}
                        {meal?.notes ? (
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {meal.notes}
                          </p>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            No additional notes for this meal.
                          </p>
                        )}

                        <div>
                          <p className="text-xs font-bold uppercase tracking-widest text-foreground mb-3">
                            Ingredients
                          </p>
                          {/* Safely check if ingredients exist and have length */}
                          {!meal?.ingredients?.length ? (
                            <p className="text-sm text-muted-foreground">
                              No ingredients listed.
                            </p>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              {meal.ingredients.map((ingredient, index) => (
                                <span
                                  key={`${key}-${ingredient.name}-${index}`}
                                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary border border-border text-sm text-foreground"
                                >
                                  {ingredient.name}
                                  <span className="text-muted-foreground">
                                    {ingredient.amount} {ingredient.unit}
                                  </span>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="lg:col-span-4">
                    <div className="bg-card rounded-2xl p-8 border border-border h-full">
                      <h3 className="text-2xl font-serif font-medium text-foreground mb-6">
                        Day {previewDay.day_index + 1} Guidance
                      </h3>

                      <div className="space-y-6">
                        <div className="p-5 bg-secondary/50 rounded-2xl border-l-[4px] border-brand shadow-sm">
                          <div className="flex items-start gap-4">
                            <Info className="w-6 h-6 text-brand mt-0.5 shrink-0" />
                            <div>
                              <h4 className="text-sm font-bold uppercase tracking-widest text-foreground mb-1">
                                Daily Instructions
                              </h4>
                              <p className="text-muted-foreground leading-relaxed">
                                {previewDay.instructions ||
                                  "No specific instructions were provided for this day."}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          {mealEntries(previewDay).map(
                            ({ key, label, meal }) => (
                              <div
                                key={`${key}-summary`}
                                className="rounded-2xl border border-border bg-secondary/30 p-4"
                              >
                                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">
                                  {label}
                                </p>
                                {/* Safely access calories or fallback to 0 */}
                                <p className="text-base font-semibold text-foreground">
                                  {meal?.calories || 0}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Calories
                                </p>
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
