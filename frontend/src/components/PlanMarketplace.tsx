"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  Calendar,
  DollarSign,
  Filter,
  Leaf,
  Loader2,
  Search,
  Star,
  Stethoscope,
  UserRound,
} from "lucide-react";
import {
  buildMarketplacePlanHref,
  getMarketplacePlans,
  MarketplacePlanListItem,
  resolveApiUrl,
} from "@/lib/api";
import { bootstrapLookups, getSpecializations, LookupItem } from "@/lib/lookups";
import { Input } from "@/components/ui/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const REGULAR_PAGE_SIZE = 9;
const SEASONAL_PAGE_SIZE = 12;
const SEASONAL_LIMIT = 6;

type SortOption = "newest" | "rating_desc" | "price_asc" | "price_desc";

const SORT_OPTIONS: Array<{ value: SortOption; label: string }> = [
  { value: "newest", label: "Newest" },
  { value: "rating_desc", label: "Top Rated" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
];

const FALLBACK_CARD_IMAGE =
  "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1200&q=80";

function isSeasonalPlan(plan: MarketplacePlanListItem) {
  return plan.category === "seasonal";
}

function formatPrice(price: number) {
  return `$${price.toFixed(2)}`;
}

function formatDuration(days: number) {
  return `${days} Day${days === 1 ? "" : "s"}`;
}

function planMatchesSearch(plan: MarketplacePlanListItem, query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;

  return [plan.title, plan.description, plan.specialization_name, plan.nutritionist_username]
    .filter(Boolean)
    .some((value) => value!.toLowerCase().includes(normalized));
}

function PlanCard({
  plan,
  compact = false,
}: {
  plan: MarketplacePlanListItem;
  compact?: boolean;
}) {
  const imageSrc = resolveApiUrl(plan.cover_image_url) ?? FALLBACK_CARD_IMAGE;
  const href = buildMarketplacePlanHref(plan);
  const badgeText = isSeasonalPlan(plan) ? "Seasonal" : plan.specialization_name || "Clinical Plan";

  return (
    <Link
      href={href}
      className={compact ? "h-full" : ""}
      id={`${compact ? "seasonal" : "plan"}-card-${plan.id}`}
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="bg-card rounded-2xl overflow-hidden shadow-sm border border-border hover:shadow-xl transition-all duration-300 h-full flex flex-col group cursor-pointer"
      >
        <div className={compact ? "relative h-48 overflow-hidden bg-muted" : "relative h-60 overflow-hidden bg-muted"}>
          <img
            alt={plan.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            src={imageSrc}
          />
          <div className="absolute top-4 left-4 bg-card/95 text-foreground backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider flex items-center shadow-sm gap-1.5">
            {isSeasonalPlan(plan) ? <Leaf className="w-4 h-4" /> : <BadgeCheck className="w-4 h-4" />}
            {badgeText}
          </div>
        </div>

        <div className="p-6 flex-grow flex flex-col">
          <div className="flex justify-between items-start mb-3 gap-4">
            <h3 className={compact ? "text-lg font-bold text-foreground line-clamp-2 leading-tight" : "text-xl font-bold text-foreground line-clamp-2 leading-tight"}>
              {plan.title}
            </h3>
            <span className={compact ? "text-base font-bold text-primary shrink-0" : "text-lg font-bold text-primary shrink-0"}>
              {formatPrice(plan.price)}
            </span>
          </div>

          <p className={compact ? "text-sm text-muted-foreground mb-5 line-clamp-3 leading-relaxed" : "text-muted-foreground mb-6 line-clamp-3 leading-relaxed"}>
            {plan.description}
          </p>

          <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground mb-5">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-brand" />
              <span>{formatDuration(plan.duration_days)}</span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-brand" />
              <span>{plan.free_consultations_per_week} free consults/week</span>
            </div>
          </div>

          <div className="mt-auto pt-5 border-t border-border flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-bold text-foreground truncate">
                {plan.nutritionist_username}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {plan.specialization_name || "Nutritionist"}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Star className="w-4 h-4 fill-primary text-primary" />
              <span className="text-sm font-semibold text-muted-foreground">
                {plan.rating_avg.toFixed(1)}
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

export default function PlanMarketplace() {
  const [regularPlans, setRegularPlans] = useState<MarketplacePlanListItem[]>([]);
  const [seasonalPlans, setSeasonalPlans] = useState<MarketplacePlanListItem[]>([]);
  const [specializations, setSpecializations] = useState<LookupItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecialization, setSelectedSpecialization] = useState("all");
  const [minPriceInput, setMinPriceInput] = useState("");
  const [maxPriceInput, setMaxPriceInput] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("newest");
  const [nextRegularPage, setNextRegularPage] = useState(1);
  const [hasMoreRegular, setHasMoreRegular] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isSeasonalLoading, setIsSeasonalLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const regularPlansRef = useRef<MarketplacePlanListItem[]>([]);
  const nextRegularPageRef = useRef(1);
  const regularRequestIdRef = useRef(0);
  const seasonalRequestIdRef = useRef(0);

  const parsedSpecializationId =
    selectedSpecialization !== "all" ? Number(selectedSpecialization) : undefined;
  const parsedMinPrice = minPriceInput ? Number(minPriceInput) : undefined;
  const parsedMaxPrice = maxPriceInput ? Number(maxPriceInput) : undefined;

  useEffect(() => {
    regularPlansRef.current = regularPlans;
  }, [regularPlans]);

  useEffect(() => {
    nextRegularPageRef.current = nextRegularPage;
  }, [nextRegularPage]);

  useEffect(() => {
    const loadSpecializations = async () => {
      await bootstrapLookups();
      setSpecializations(getSpecializations());
    };

    void loadSpecializations();
  }, []);

  const loadRegularPlans = useCallback(
    async (reset: boolean) => {
      const requestId = regularRequestIdRef.current + 1;
      regularRequestIdRef.current = requestId;
      const startingPage = reset ? 1 : nextRegularPageRef.current;
      let pageToFetch = startingPage;
      let lastKnownTotalPages = startingPage;
      let didFindRegularPlans = false;
      const accumulated = reset ? [] : [...regularPlansRef.current];
      const knownIds = new Set(accumulated.map((plan) => plan.id));

      if (reset) {
        setIsInitialLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      setError(null);

      try {
        while (!didFindRegularPlans) {
          const payload = await getMarketplacePlans({
            page: pageToFetch,
            page_size: REGULAR_PAGE_SIZE,
            specialization_id: parsedSpecializationId,
            min_price: parsedMinPrice,
            max_price: parsedMaxPrice,
            sort: sortOption,
          });

          lastKnownTotalPages = Math.max(1, Math.ceil(payload.count / REGULAR_PAGE_SIZE));

          const newRegularPlans = payload.results.filter(
            (plan) => !isSeasonalPlan(plan) && !knownIds.has(plan.id),
          );

          if (newRegularPlans.length > 0) {
            accumulated.push(...newRegularPlans);
            newRegularPlans.forEach((plan) => knownIds.add(plan.id));
            didFindRegularPlans = true;
          }

          if (pageToFetch >= lastKnownTotalPages) {
            break;
          }

          pageToFetch += 1;
        }

        if (requestId !== regularRequestIdRef.current) return;

        setRegularPlans(accumulated);
        setNextRegularPage(pageToFetch + 1);
        setHasMoreRegular(pageToFetch < lastKnownTotalPages);
      } catch (loadError) {
        if (requestId !== regularRequestIdRef.current) return;
        console.error("Failed to load marketplace plans", loadError);
        setError("We couldn't load marketplace plans right now. Please try again shortly.");
        if (reset) {
          setRegularPlans([]);
          setHasMoreRegular(false);
        }
      } finally {
        if (requestId !== regularRequestIdRef.current) return;
        setIsInitialLoading(false);
        setIsLoadingMore(false);
      }
    },
    [parsedMaxPrice, parsedMinPrice, parsedSpecializationId, sortOption],
  );

  useEffect(() => {
    setRegularPlans([]);
    setNextRegularPage(1);
    setHasMoreRegular(false);
    void loadRegularPlans(true);
  }, [loadRegularPlans]);

  useEffect(() => {
    const loadSeasonalPlans = async () => {
      const requestId = seasonalRequestIdRef.current + 1;
      seasonalRequestIdRef.current = requestId;
      setIsSeasonalLoading(true);

      try {
        const collected: MarketplacePlanListItem[] = [];
        const knownIds = new Set<number>();
        let page = 1;
        let totalPages = 1;

        while (collected.length < SEASONAL_LIMIT && page <= totalPages) {
          const payload = await getMarketplacePlans({
            page,
            page_size: SEASONAL_PAGE_SIZE,
            sort: "newest",
          });

          totalPages = Math.max(1, Math.ceil(payload.count / SEASONAL_PAGE_SIZE));

          for (const plan of payload.results) {
            if (!isSeasonalPlan(plan) || knownIds.has(plan.id)) continue;
            collected.push(plan);
            knownIds.add(plan.id);

            if (collected.length >= SEASONAL_LIMIT) break;
          }

          page += 1;
        }

        if (requestId !== seasonalRequestIdRef.current) return;
        setSeasonalPlans(collected);
      } catch (loadError) {
        if (requestId !== seasonalRequestIdRef.current) return;
        console.error("Failed to load seasonal marketplace plans", loadError);
        setSeasonalPlans([]);
      } finally {
        if (requestId !== seasonalRequestIdRef.current) return;
        setIsSeasonalLoading(false);
      }
    };

    void loadSeasonalPlans();
  }, []);

  const visibleRegularPlans = useMemo(
    () => regularPlans.filter((plan) => planMatchesSearch(plan, searchQuery)),
    [regularPlans, searchQuery],
  );

  return (
    <div className="bg-background text-foreground font-sans min-h-screen flex flex-col">
      <main className="flex-grow w-full max-w-[1280px] mx-auto px-6 md:px-8 py-12 flex flex-col gap-20 mt-8">
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative rounded-3xl overflow-hidden min-h-[480px] flex items-center shadow-xl group bg-secondary"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-background/50 to-transparent z-10 pointer-events-none" />

          <img
            alt="Fresh healthy salad spread placeholder"
            className="absolute inset-0 w-full h-full object-cover z-0 opacity-90 transition-transform duration-700 ease-out group-hover:scale-105"
            src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=2070&q=80"
          />

          <div className="relative z-20 text-left max-w-2xl px-8 md:px-16 py-12">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand/20 border border-brand/30 text-brand text-sm font-semibold tracking-wide mb-6 backdrop-blur-md">
                <BadgeCheck className="w-4 h-4" />
                Evidence-Based Protocols
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-foreground leading-tight mb-6 tracking-tight"
            >
              Curated <span className="text-brand">Clinical</span>
              <br />
              Nutrition
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-lg md:text-xl text-muted-foreground mb-10 leading-relaxed max-w-xl font-light"
            >
              Discover evidence-based meal plans designed by registered
              dietitians and medical experts to meet your specific health goals.
            </motion.p>

            <motion.a
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="group inline-flex items-center gap-3 bg-button-primary bg-btn-primary text-button-primary-foreground px-8 py-4 rounded-full font-semibold hover:opacity-90 transition-all duration-300 shadow-brand"
              href="#regular-marketplace-plans"
              id="explore-plans-btn"
            >
              Explore Plans
              <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
            </motion.a>
          </div>
        </motion.section>

        <section id="regular-marketplace-plans">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold text-foreground tracking-tight">
                Featured Clinical Plans
              </h2>
              <p className="text-muted-foreground mt-2 text-lg">
                Browse approved plans from nutritionists across the marketplace.
              </p>
            </motion.div>
          </div>

          <div className="bg-card rounded-3xl border border-border shadow-sm p-6 md:p-8 mb-10">
            <div className="flex items-center gap-3 mb-6">
              <Filter className="w-5 h-5 text-brand" />
              <h3 className="text-xl font-bold text-foreground">Refine Plans</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
              <div className="xl:col-span-2">
                <label className="text-sm font-semibold text-foreground mb-2 block" htmlFor="marketplace-search">
                  Search loaded plans
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    id="marketplace-search"
                    className="pl-10 h-11 bg-background"
                    placeholder="Search by title, description, specialization..."
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block">Specialization</label>
                <Select value={selectedSpecialization} onValueChange={setSelectedSpecialization}>
                  <SelectTrigger className="w-full h-11 bg-background">
                    <SelectValue placeholder="All specializations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All specializations</SelectItem>
                    {specializations.map((specialization) => (
                      <SelectItem key={specialization.id} value={String(specialization.id)}>
                        {specialization.name || specialization.label || specialization.value || `Specialization ${specialization.id}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block" htmlFor="marketplace-min-price">
                  Min Price
                </label>
                <Input
                  id="marketplace-min-price"
                  type="number"
                  min="0"
                  step="0.01"
                  className="h-11 bg-background"
                  placeholder="0.00"
                  value={minPriceInput}
                  onChange={(event) => setMinPriceInput(event.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block" htmlFor="marketplace-max-price">
                  Max Price
                </label>
                <Input
                  id="marketplace-max-price"
                  type="number"
                  min="0"
                  step="0.01"
                  className="h-11 bg-background"
                  placeholder="200.00"
                  value={maxPriceInput}
                  onChange={(event) => setMaxPriceInput(event.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block">Sort</label>
                <Select value={sortOption} onValueChange={(value) => setSortOption(value as SortOption)}>
                  <SelectTrigger className="w-full h-11 bg-background">
                    <SelectValue placeholder="Newest" />
                  </SelectTrigger>
                  <SelectContent>
                    {SORT_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {error ? (
            <div className="bg-card rounded-2xl border border-destructive/20 p-8 text-center">
              <p className="text-destructive font-semibold">{error}</p>
            </div>
          ) : isInitialLoading ? (
            <div className="bg-card rounded-2xl border border-border p-12 flex flex-col items-center justify-center gap-4">
              <Loader2 className="w-10 h-10 text-brand animate-spin" />
              <p className="text-muted-foreground">Loading marketplace plans...</p>
            </div>
          ) : visibleRegularPlans.length === 0 ? (
            <div className="bg-card rounded-2xl border border-border p-12 text-center">
              <p className="text-lg font-semibold text-foreground mb-2">No plans match your current filters.</p>
              <p className="text-muted-foreground">Try adjusting the price range, specialization, or search terms.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {visibleRegularPlans.map((plan) => (
                  <PlanCard key={plan.id} plan={plan} />
                ))}
              </div>

              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="flex justify-center mt-16"
              >
                {hasMoreRegular ? (
                  <button
                    className="group relative inline-flex items-center justify-center gap-2 px-10 py-3.5 text-base font-semibold text-primary transition-all duration-300 bg-card border-2 border-primary rounded-full hover:bg-primary hover:text-primary-foreground hover:shadow-lg hover:shadow-primary/20 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
                    id="load-more-plans-btn"
                    onClick={() => void loadRegularPlans(false)}
                    disabled={isLoadingMore}
                    type="button"
                  >
                    {isLoadingMore ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Loading More</span>
                      </>
                    ) : (
                      <>
                        <span>Load More Plans</span>
                        <Loader2 className="w-5 h-5 transition-transform duration-500 group-hover:rotate-180" />
                      </>
                    )}
                  </button>
                ) : (
                  <p className="text-sm text-muted-foreground">You’ve reached the end of the currently available regular plans.</p>
                )}
              </motion.div>
            </>
          )}
        </section>

        <section>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl font-bold text-foreground tracking-tight">
                Seasonal Offerings
              </h2>
              <p className="text-muted-foreground mt-2 text-lg">
                Limited-time protocols curated around seasonal nutrition needs.
              </p>
            </motion.div>
          </div>

          {isSeasonalLoading ? (
            <div className="bg-card rounded-2xl border border-border p-10 flex items-center justify-center gap-3">
              <Loader2 className="w-6 h-6 text-brand animate-spin" />
              <p className="text-muted-foreground">Loading seasonal plans...</p>
            </div>
          ) : seasonalPlans.length === 0 ? (
            <div className="bg-card rounded-2xl border border-border p-10 text-center">
              <p className="text-muted-foreground">No seasonal plans are available right now.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {seasonalPlans.map((plan) => (
                <PlanCard key={plan.id} plan={plan} compact />
              ))}
            </div>
          )}
        </section>

        <section className="bg-card rounded-3xl border border-border p-8 md:p-10 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-brand/10 border border-brand/20 flex items-center justify-center">
                <Stethoscope className="w-6 h-6 text-brand" />
              </div>
              <div>
                <h3 className="font-bold text-foreground mb-1">Professional Guidance</h3>
                <p className="text-sm text-muted-foreground">
                  Every listed plan comes from an approved nutrition professional.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-brand/10 border border-brand/20 flex items-center justify-center">
                <UserRound className="w-6 h-6 text-brand" />
              </div>
              <div>
                <h3 className="font-bold text-foreground mb-1">Visible Expertise</h3>
                <p className="text-sm text-muted-foreground">
                  Compare specialties, ratings, pricing, and free consultations before choosing.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-brand/10 border border-brand/20 flex items-center justify-center">
                <BadgeCheck className="w-6 h-6 text-brand" />
              </div>
              <div>
                <h3 className="font-bold text-foreground mb-1">Structured Meal Plans</h3>
                <p className="text-sm text-muted-foreground">
                  Review full plan details, day-by-day meals, and included guidance before payment.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
