"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Info,
  CheckCircle2,
  Search,
  Video,
  UtensilsCrossed,
  Loader2,
  Star,
  AlertCircle,
} from "lucide-react";
import GenericDropdown from "./ui/GenericDropdown";
import { useDebounce } from "@/hooks/use-debounce";
import {
  getNutritionists,
  NutritionistListItem,
  resolveApiUrl,
  unwrapResponse,
} from "@/lib/api";
import {
  bootstrapLookups,
  getSpecializations,
  getLanguages,
  getCountries,
  LookupItem,
} from "@/lib/lookups";
import NutritionistProfileModal from "./NutritionistProfileModal";

export default function ChooseNutritionist() {
  // ── Search ──────────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  // ── API-aligned filters (IDs, not names) ────────────────────────────────
  const [filters, setFilters] = useState<{
    specialization_id: number | undefined;
    language_id: number | undefined;
    country_id: number | undefined;
    sort: string;
  }>({
    specialization_id: undefined,
    language_id: undefined,
    country_id: undefined,
    sort: "",
  });

  const [profileModalId, setProfileModalId] = useState<number | null>(null);

  // ── Data state ──────────────────────────────────────────────────────────
  const [nutritionists, setNutritionists] = useState<NutritionistListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Lookup state ────────────────────────────────────────────────────────
  const [specializations, setSpecializations] = useState<LookupItem[]>([]);
  const [languages, setLanguages] = useState<LookupItem[]>([]);
  const [countries, setCountries] = useState<LookupItem[]>([]);

  // ── Effect 1: Bootstrap lookups once ────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      await bootstrapLookups();
      setSpecializations(getSpecializations());
      setLanguages(getLanguages());
      setCountries(getCountries());
    };
    init();
  }, []);

  // ── Effect 2: Fetch nutritionists when filters change ───────────────────
  useEffect(() => {
    const fetchDirectory = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Build clean params — omit undefined / empty values
        const params: Record<string, any> = {};
        if (filters.specialization_id) params.specialization_id = filters.specialization_id;
        if (filters.language_id) params.language_id = filters.language_id;
        if (filters.country_id) params.country_id = filters.country_id;
        if (filters.sort) params.sort = filters.sort;

        const raw = await getNutritionists(params);
        const data = unwrapResponse(raw);
        // Handle both flat array and paginated { results: [] } shapes
        const list: NutritionistListItem[] = Array.isArray(data)
          ? data
          : (data as any)?.results ?? [];
        setNutritionists(list);
      } catch (err) {
        console.error("Failed to load nutritionists", err);
        setError("Failed to load the nutritionist directory. Please try again.");
        setNutritionists([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDirectory();
  }, [filters]);

  // ── Client-side search (filters within already-fetched results) ──────────
  const displayedNutritionists = useMemo(() => {
    if (!debouncedSearch) return nutritionists;
    const q = debouncedSearch.toLowerCase();
    return nutritionists.filter(
      (n) =>
        n.username.toLowerCase().includes(q) ||
        n.bio?.toLowerCase().includes(q) ||
        n.specialization_name.toLowerCase().includes(q) ||
        n.country_name?.toLowerCase().includes(q) ||
        n.languages.some((l) => l.toLowerCase().includes(q)),
    );
  }, [debouncedSearch, nutritionists]);

  return (
    <main className="flex-grow pt-32 pb-20 px-6 max-w-7xl mx-auto w-full">
      {/* Hero Section */}
      <section className="mb-20 max-w-3xl">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-primary mb-6">
          Choose Your Nutritionist
        </h1>
        <p className="text-lg text-muted-foreground">
          Select the professional you want to work with. Each nutritionist
          brings a different approach, specialty, and experience.
        </p>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-20">
        {/* How to Choose Sidebar */}
        <div className="lg:col-span-4 bg-muted border border-border/50 rounded-xl p-8 h-fit">
          <h2 className="text-2xl font-semibold text-primary mb-6 flex items-center gap-2">
            <Info className="w-6 h-6" />
            How to Choose
          </h2>
          <ul className="space-y-4 text-base text-muted-foreground">
            <li className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-primary mt-1 shrink-0" />
              <span>Your health conditions or challenges</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-primary mt-1 shrink-0" />
              <span>Your goals (fat loss, balance, recovery)</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-primary mt-1 shrink-0" />
              <span>Preferred language of communication</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-primary mt-1 shrink-0" />
              <span>Your budget per consultation</span>
            </li>
          </ul>
        </div>

        {/* Filters Panel */}
        <div className="lg:col-span-8 bg-card rounded-xl p-8 shadow-sm border border-border">
          <h2 className="text-2xl font-semibold text-primary mb-6">
            Refine Your Search
          </h2>

          {/* Search bar */}
          <div className="mb-8">
            <label className="text-sm font-bold text-foreground ml-1 block mb-2">
              Search Name or Keyword
            </label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-card border border-border rounded-xl focus:ring-1 focus:ring-primary/30 text-foreground"
                placeholder="e.g. 'Weight Management' or 'nutri1'"
                type="text"
              />
            </div>
          </div>

          {/* 4 dropdowns */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Specialty */}
            <GenericDropdown
              label="Specialty"
              value={filters.specialization_id ?? ""}
              options={[
                { label: "All Specialties", value: "" },
                ...specializations.map((s) => ({
                  label: s.name ?? s.label ?? String(s.id),
                  value: s.id,
                })),
              ]}
              onChange={(val) =>
                setFilters((f) => ({
                  ...f,
                  specialization_id: val !== "" ? Number(val) : undefined,
                }))
              }
              placeholder="All Specialties"
            />

            {/* Language */}
            <GenericDropdown
              label="Language"
              value={filters.language_id ?? ""}
              options={[
                { label: "All Languages", value: "" },
                ...languages.map((l) => ({
                  label: l.name ?? l.label ?? String(l.id),
                  value: l.id,
                })),
              ]}
              onChange={(val) =>
                setFilters((f) => ({
                  ...f,
                  language_id: val !== "" ? Number(val) : undefined,
                }))
              }
              placeholder="All Languages"
            />

            {/* Country */}
            <GenericDropdown
              label="Country"
              value={filters.country_id ?? ""}
              options={[
                { label: "All Countries", value: "" },
                ...countries.map((c) => ({
                  label: c.name ?? c.label ?? String(c.id),
                  value: c.id,
                })),
              ]}
              onChange={(val) =>
                setFilters((f) => ({
                  ...f,
                  country_id: val !== "" ? Number(val) : undefined,
                }))
              }
              placeholder="All Countries"
            />

            {/* Sort */}
            <GenericDropdown
              label="Sort By"
              value={filters.sort}
              options={[
                { label: "Default", value: "" },
                { label: "Highest Rated", value: "rating_desc" },
                { label: "Lowest Price", value: "price_asc" },
                { label: "Highest Price", value: "price_desc" },
              ]}
              onChange={(val) =>
                setFilters((f) => ({ ...f, sort: val ?? "" }))
              }
              placeholder="Default"
            />
          </div>
        </div>
      </div>

      {/* Results count */}
      {!isLoading && !error && (
        <p className="text-sm text-muted-foreground mb-6">
          {displayedNutritionists.length === 0
            ? "No nutritionists found"
            : `Showing ${displayedNutritionists.length} nutritionist${displayedNutritionists.length !== 1 ? "s" : ""}`}
        </p>
      )}

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          /* Loading state */
          <div className="col-span-full flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground animate-pulse">
              Loading nutritionists…
            </p>
          </div>
        ) : error ? (
          /* Error state */
          <div className="col-span-full flex flex-col items-center justify-center py-24 gap-3 text-center">
            <AlertCircle className="w-8 h-8 text-destructive" />
            <p className="text-destructive font-medium">{error}</p>
            <button
              onClick={() => setFilters((f) => ({ ...f }))} // re-triggers the effect
              className="text-sm text-primary underline underline-offset-2"
            >
              Retry
            </button>
          </div>
        ) : displayedNutritionists.length === 0 ? (
          /* Empty state */
          <div className="col-span-full text-center py-24">
            <p className="text-muted-foreground text-lg">
              No nutritionists found matching your criteria.
            </p>
            <button
              onClick={() =>
                setFilters({
                  specialization_id: undefined,
                  language_id: undefined,
                  country_id: undefined,
                  sort: "",
                })
              }
              className="mt-4 text-sm text-primary underline underline-offset-2"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          /* Nutritionist cards */
          displayedNutritionists.map((nutri) => {
            // Build dynamic tag list from real data
            const tags = [
              nutri.specialization_name,
              `${nutri.years_experience}+ Yrs Exp`,
              ...nutri.languages,
            ].filter(Boolean);

            const avatarSrc =
              resolveApiUrl(nutri.profile_photo_url) ?? "/placeholder-avatar.png";

            return (
              <div
                key={nutri.nutritionist_id}
                className="bg-card rounded-2xl p-8 shadow-sm border border-border flex flex-col h-full hover:shadow-md transition-all duration-300"
              >
                {/* Header: avatar + name + tags */}
                <div className="flex items-start gap-6 mb-6">
                  <img
                    alt={nutri.username}
                    className="w-20 h-20 rounded-full object-cover border-2 border-border flex-shrink-0"
                    src={avatarSrc}
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src =
                        "/placeholder-avatar.png";
                    }}
                  />
                  <div className="min-w-0">
                    <h3 className="text-xl font-semibold text-primary leading-tight mb-1 truncate">
                      {nutri.username}
                    </h3>
                    <p className="text-xs font-bold text-muted-foreground mb-3">
                      {nutri.specialization_name}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <span
                          key={tag}
                          className="bg-accent text-accent-foreground px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Body */}
                <div className="flex-grow">
                  {nutri.bio ? (
                    <p className="text-sm text-muted-foreground mb-6 leading-relaxed line-clamp-3">
                      {nutri.bio}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground/50 italic mb-6">
                      No bio provided.
                    </p>
                  )}

                  <div className="space-y-3 mb-8">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Video className="w-4 h-4 flex-shrink-0" />
                      <span className="text-xs">1-on-1 online consultation</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <UtensilsCrossed className="w-4 h-4 flex-shrink-0" />
                      <span className="text-xs">Personalized dietary plan</span>
                    </div>
                    {/* Rating */}
                    <div className="flex items-center gap-1 text-amber-500">
                      <Star className="w-4 h-4 fill-amber-500" />
                      <span className="text-xs font-semibold text-foreground">
                        {nutri.rating > 0
                          ? nutri.rating.toFixed(1)
                          : "No reviews yet"}
                      </span>
                    </div>
                    {/* Country */}
                    {nutri.country_name && (
                      <p className="text-xs text-muted-foreground">
                        📍 {nutri.country_name}
                      </p>
                    )}
                  </div>
                </div>

                {/* Footer: price + actions */}
                <div className="mt-auto pt-6 border-t border-border">
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-xs font-semibold text-muted-foreground uppercase">
                      Per session
                    </span>
                    <span className="text-xl font-bold text-primary">
                      ${nutri.consultation_price.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => setProfileModalId(nutri.nutritionist_id)}
                      className="flex-1 py-3 px-4 border border-primary text-primary rounded-xl text-xs font-bold hover:bg-accent transition-colors"
                    >
                      View Profile
                    </button>
                    <Link
                      href={`/consultations/schedule?id=${nutri.nutritionist_id}`}
                      className="flex-1 py-3 px-4 bg-button-primary text-button-primary-foreground rounded-xl text-xs font-bold hover:opacity-90 transition-colors text-center inline-flex items-center justify-center"
                    >
                      Select
                    </Link>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <NutritionistProfileModal
        id={profileModalId}
        isOpen={!!profileModalId}
        onClose={() => setProfileModalId(null)}
      />
    </main>
  );
}
