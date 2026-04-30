"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Info,
  CheckCircle2,
  Search,
  Video,
  UtensilsCrossed,
  ChevronDown,
} from "lucide-react";

export default function ChooseNutritionist() {
  // State for search and dropdown selections
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    specialty: "",
    focus: "",
    language: "English",
    availability: "",
  });

  // State to track which dropdown is currently open
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (field: string, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setOpenDropdown(null);
  };

  // Reusable classes from your custom component
  const selectClasses = `
    w-full flex items-center justify-between
    bg-card/80 backdrop-blur-md 
    border border-border
    text-foreground font-medium
    py-3 px-4 rounded-xl 
    shadow-sm
    hover:bg-accent transition-all duration-300
    cursor-pointer group text-sm
  `;

  const dropdownMenuClasses = `
    absolute z-20 w-full mt-2 
    bg-card backdrop-blur-xl border border-border
    shadow-xl rounded-xl overflow-hidden py-2
    animate-in fade-in slide-in-from-top-2 duration-200
  `;

  return (
    <main
      className="flex-grow pt-32 pb-20 px-6 max-w-7xl mx-auto w-full"
      ref={containerRef}
    >
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
          </ul>
        </div>

        {/* Refined Custom Filters */}
        <div className="lg:col-span-8 bg-card rounded-xl p-8 shadow-sm border border-border">
          <h2 className="text-2xl font-semibold text-primary mb-6">
            Refine Your Search
          </h2>

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
                placeholder="e.g. 'Hormones' or 'Dr. Smith'"
                type="text"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Specialty Dropdown */}
            <div className="space-y-2 relative">
              <label className="text-xs font-bold text-foreground ml-1">
                Specialty
              </label>
              <button
                type="button"
                onClick={() =>
                  setOpenDropdown(
                    openDropdown === "specialty" ? null : "specialty",
                  )
                }
                className={selectClasses}
              >
                <span>{filters.specialty || "All Specialties"}</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${openDropdown === "specialty" ? "rotate-180" : ""}`}
                />
              </button>
              {openDropdown === "specialty" && (
                <ul className={dropdownMenuClasses}>
                  {[
                    "All Specialties",
                    "Hormonal Health",
                    "Weight Loss",
                    "Metabolic Disorders",
                  ].map((opt) => (
                    <li
                      key={opt}
                      onClick={() =>
                        handleSelect(
                          "specialty",
                          opt === "All Specialties" ? "" : opt,
                        )
                      }
                      className="px-4 py-2 hover:bg-accent hover:text-accent-foreground cursor-pointer text-sm"
                    >
                      {opt}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Focus Dropdown */}
            <div className="space-y-2 relative">
              <label className="text-xs font-bold text-foreground ml-1">
                Focus
              </label>
              <button
                type="button"
                onClick={() =>
                  setOpenDropdown(openDropdown === "focus" ? null : "focus")
                }
                className={selectClasses}
              >
                <span>{filters.focus || "All Focus Areas"}</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${openDropdown === "focus" ? "rotate-180" : ""}`}
                />
              </button>
              {openDropdown === "focus" && (
                <ul className={dropdownMenuClasses}>
                  {["All Focus Areas", "Clinical", "Holistic"].map((opt) => (
                    <li
                      key={opt}
                      onClick={() =>
                        handleSelect(
                          "focus",
                          opt === "All Focus Areas" ? "" : opt,
                        )
                      }
                      className="px-4 py-2 hover:bg-accent hover:text-accent-foreground cursor-pointer text-sm"
                    >
                      {opt}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Language Dropdown */}
            <div className="space-y-2 relative">
              <label className="text-xs font-bold text-foreground ml-1">
                Language
              </label>
              <button
                type="button"
                onClick={() =>
                  setOpenDropdown(
                    openDropdown === "language" ? null : "language",
                  )
                }
                className={selectClasses}
              >
                <span>{filters.language}</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${openDropdown === "language" ? "rotate-180" : ""}`}
                />
              </button>
              {openDropdown === "language" && (
                <ul className={dropdownMenuClasses}>
                  {["English", "Spanish", "Mandarin"].map((opt) => (
                    <li
                      key={opt}
                      onClick={() => handleSelect("language", opt)}
                      className="px-4 py-2 hover:bg-accent hover:text-accent-foreground cursor-pointer text-sm"
                    >
                      {opt}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Availability Dropdown */}
            <div className="space-y-2 relative">
              <label className="text-xs font-bold text-foreground ml-1">
                Availability
              </label>
              <button
                type="button"
                onClick={() =>
                  setOpenDropdown(
                    openDropdown === "availability" ? null : "availability",
                  )
                }
                className={selectClasses}
              >
                <span>{filters.availability || "Any Time"}</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${openDropdown === "availability" ? "rotate-180" : ""}`}
                />
              </button>
              {openDropdown === "availability" && (
                <ul className={dropdownMenuClasses}>
                  {["Any Time", "This Week", "Next Week"].map((opt) => (
                    <li
                      key={opt}
                      onClick={() =>
                        handleSelect(
                          "availability",
                          opt === "Any Time" ? "" : opt,
                        )
                      }
                      className="px-4 py-2 hover:bg-accent hover:text-accent-foreground cursor-pointer text-sm"
                    >
                      {opt}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Nutritionist Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          {
            id: "101",
            name: "Dr. Sarah Jenkins",
            certs: "MS, RDN, CDCES",
            tags: ["Hormonal Health", "PCOS"],
            price: "$150/mo",
            desc: "Evidence-based approach focusing on endocrine balance through sustainable dietary adjustments.",
          },
          {
            id: "102",
            name: "Michael Chen",
            certs: "MPH, RDN",
            tags: ["Weight Loss", "Sports Nutrition"],
            price: "$130/mo",
            desc: "Specializes in body composition changes through metabolic optimization and practical meal prep.",
          },
          {
            id: "103",
            name: "Elena Rodriguez",
            certs: "MS, RDN, CNSC",
            tags: ["Gut Health", "Autoimmune"],
            price: "$175/mo",
            desc: "Integrative approach focusing on microbiome health and identifying food sensitivities.",
          },
        ].map((nutri, idx) => (
          <div
            key={idx}
            className="bg-card rounded-2xl p-8 shadow-sm border border-border flex flex-col h-full hover:shadow-md transition-all duration-300"
          >
            <div className="flex items-start gap-6 mb-6">
              <img
                alt={nutri.name}
                className="w-20 h-20 rounded-full object-cover border-2 border-border"
                src="https://placehold.co/150x150/png"
              />
              <div>
                <h3 className="text-xl font-semibold text-primary leading-tight mb-1">
                  {nutri.name}
                </h3>
                <p className="text-xs font-bold text-muted-foreground mb-3">
                  {nutri.certs}
                </p>
                <div className="flex flex-wrap gap-2">
                  {nutri.tags.map((tag) => (
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
            <div className="flex-grow">
              <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                {nutri.desc}
              </p>
              <div className="space-y-3 mb-8">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Video className="w-4 h-4" />
                  <span className="text-xs">1-on-1 online consultation</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <UtensilsCrossed className="w-4 h-4" />
                  <span className="text-xs">Personalized dietary plan</span>
                </div>
              </div>
            </div>
            <div className="mt-auto pt-6 border-t border-border">
              <div className="flex justify-between items-center mb-6">
                <span className="text-xs font-semibold text-muted-foreground uppercase">
                  Starting at
                </span>
                <span className="text-xl font-bold text-primary">
                  {nutri.price}
                </span>
              </div>
              <div className="flex gap-3">
                <button className="flex-1 py-3 px-4 border border-primary text-primary rounded-xl text-xs font-bold hover:bg-accent transition-colors">
                  View Profile
                </button>
                <Link
                  href={`/consultations/schedule?id=${nutri.id}`}
                  className="flex-1 py-3 px-4 bg-button-primary text-button-primary-foreground rounded-xl text-xs font-bold hover:opacity-90 transition-colors text-center inline-flex items-center justify-center"
                >
                  Select
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
