"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Sun,
  Sunset,
  CheckCircle2,
  CalendarX,
  MailCheck,
  Clock,
  User,
  Loader2,
} from "lucide-react";
import { format, addDays, isSameDay, startOfDay } from "date-fns";
import { cn } from "@/lib/utils";
import {
  getNutritionistProfile,
  getNutritionistAvailability,
  bookConsultation,
} from "@/lib/api";

// --- API Mapping Interfaces ---
interface TimeSlot {
  start_time: string; // HH:MM
  end_time: string; // HH:MM
  is_available: boolean;
}

interface NutritionistProfile {
  id: string | number;
  name: string;
  specialization: string;
  tags: string[];
  bio: string;
  consultation_price: number;
  profile_image: string;
}

// Props Interface
interface ScheduleProps {
  nutritionistId: string;
}

export default function ScheduleConsultation({
  nutritionistId,
}: ScheduleProps) {
  // 1. State for API Integration
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [consultationType, setConsultationType] = useState<
    "advice_only" | "plan_included"
  >("advice_only");
  const [isLoading, setIsLoading] = useState(false);

  // Profile and Availability State
  const [nutritionist, setNutritionist] = useState<NutritionistProfile | null>(
    null,
  );
  const [availability, setAvailability] = useState<TimeSlot[]>([]);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isSlotsLoading, setIsSlotsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 2. Fetch Profile on Mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsPageLoading(true);
        const data = await getNutritionistProfile(nutritionistId);
        setNutritionist(data);
        setError(null);
      } catch (err) {
        console.error("Failed to load profile", err);
        setError("Failed to load nutritionist profile");
        // Fallback to mock data for development
        setNutritionist({
          id: nutritionistId,
          name: "Sarah Jenkins, MS, RDN",
          specialization: "Lead Clinical Dietitian",
          tags: ["Hormonal Health", "Weight Loss", "Metabolic Disorders"],
          bio: "Sarah specializes in evidence-based nutritional strategies for complex metabolic conditions...",
          consultation_price: 150.0,
          profile_image: "https://placehold.co/150x150/png",
        });
      } finally {
        setIsPageLoading(false);
      }
    };
    fetchProfile();
  }, [nutritionistId]);

  // 3. Fetch Availability when Date changes
  useEffect(() => {
    const fetchSlots = async () => {
      if (!nutritionist) return;

      setIsSlotsLoading(true);
      try {
        const formattedDate = format(selectedDate, "yyyy-MM-dd");
        const data = await getNutritionistAvailability(
          nutritionistId,
          formattedDate,
        );
        setAvailability(data.available_slots || []);
      } catch (err) {
        console.error("Failed to load slots", err);
        // Fallback to mock data for development
        setAvailability([
          { start_time: "09:00", end_time: "09:45", is_available: true },
          { start_time: "09:30", end_time: "10:15", is_available: true },
          { start_time: "11:00", end_time: "11:45", is_available: false },
          { start_time: "13:00", end_time: "13:45", is_available: true },
          { start_time: "14:30", end_time: "15:15", is_available: true },
        ]);
      } finally {
        setIsSlotsLoading(false);
      }
    };
    fetchSlots();
  }, [nutritionistId, selectedDate, nutritionist]);

  // 4. Generate Week Ribbon (Next 14 days)
  const days = useMemo(() => {
    return Array.from({ length: 14 }).map((_, i) =>
      addDays(startOfDay(new Date()), i),
    );
  }, []);

  // Filter slots by time of day
  const morningSlots = availability.filter(
    (s) => parseInt(s.start_time.split(":")[0]) < 12,
  );
  const afternoonSlots = availability.filter(
    (s) => parseInt(s.start_time.split(":")[0]) >= 12,
  );

  // 5. Handle Loading State
  if (isPageLoading) {
    return (
      <div className="w-full h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">
          Loading practitioner details...
        </p>
      </div>
    );
  }

  // 6. Handle Error/Not Found State
  if (error && !nutritionist) {
    return (
      <div className="text-center py-24">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  // Use fallback data if nutritionist is still loading
  const currentNutritionist = nutritionist || {
    id: nutritionistId,
    name: "Loading...",
    specialization: "",
    tags: [],
    bio: "",
    consultation_price: 150.0,
    profile_image: "https://placehold.co/150x150/png",
  };

  // 7. Booking Handler (Connects to POST /client/consultations/book/)
  const handleBooking = async () => {
    if (!selectedSlot || !nutritionist) return;

    setIsLoading(true);
    const payload = {
      nutritionist_id: String(nutritionistId),
      appointment_date: format(selectedDate, "yyyy-MM-dd"),
      start_time: selectedSlot.start_time,
      end_time: selectedSlot.end_time,
      consultation_type: consultationType,
      is_free_from_plan: false,
    };

    try {
      await bookConsultation(payload);
      console.log("Booking submitted successfully!");
      // Could add success notification or redirect here
    } catch (err) {
      console.error("Failed to book consultation", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex-grow pt-12 pb-24 px-6 max-w-7xl mx-auto w-full animate-in fade-in duration-700">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
        {/* Left Column: Selection */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          <div className="flex flex-col gap-2">
            <h1 className="font-serif text-4xl md:text-5xl font-bold tracking-tight text-foreground">
              Schedule Your Consultation
            </h1>
            <p className="text-lg text-muted-foreground">
              Book a private session for personalized nutritional guidance.
            </p>
          </div>

          {/* Provider Card (API Mapped) */}
          <section className="bg-card rounded-2xl border border-border p-6 flex flex-col sm:flex-row gap-6 items-start shadow-brand">
            <div className="w-24 h-24 rounded-full overflow-hidden flex-shrink-0 border-2 border-primary/20">
              <img
                alt={currentNutritionist.name}
                className="w-full h-full object-cover"
                src={currentNutritionist.profile_image}
              />
            </div>
            <div className="flex flex-col w-full">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-3">
                <div>
                  <h2 className="font-serif text-2xl font-bold text-foreground">
                    {currentNutritionist.name}
                  </h2>
                  <p className="text-accent-foreground font-medium mt-1">
                    {currentNutritionist.specialization}
                  </p>
                </div>
                <button className="text-sm font-semibold text-button-primary bg-accent hover:bg-primary hover:text-primary-foreground rounded-lg px-4 py-2 transition-all w-full sm:w-auto">
                  View Full Profile
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                {currentNutritionist.tags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-secondary text-secondary-foreground text-xs font-bold px-3 py-1.5 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {currentNutritionist.bio}
              </p>
            </div>
          </section>

          {/* Scheduler Section */}
          <section className="flex flex-col gap-4 mt-2">
            <h3 className="font-serif text-2xl font-bold text-foreground flex items-center gap-2">
              <Clock className="w-6 h-6 text-primary" /> Choose a Time Slot
            </h3>

            <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
              {/* Date Selector Ribbon */}
              <div className="border-b border-border p-4 flex items-center justify-between bg-muted/30">
                <button className="p-2 hover:bg-accent rounded-full transition-colors text-muted-foreground">
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <div className="flex gap-4 overflow-x-auto py-2 custom-scrollbar px-4 w-full justify-start sm:justify-center">
                  {days.map((date) => {
                    const isSelected = isSameDay(date, selectedDate);
                    return (
                      <button
                        key={date.toISOString()}
                        onClick={() => {
                          setSelectedDate(date);
                          setSelectedSlot(null);
                        }}
                        className={cn(
                          "flex flex-col items-center justify-center min-w-14 h-14 rounded-full transition-all shrink-0",
                          isSelected
                            ? "bg-primary text-primary-foreground shadow-brand scale-110"
                            : "hover:bg-accent text-foreground",
                        )}
                      >
                        <span
                          className={cn(
                            "text-[10px] font-bold uppercase",
                            isSelected
                              ? "text-primary-foreground/80"
                              : "text-muted-foreground",
                          )}
                        >
                          {format(date, "eee")}
                        </span>
                        <span className="text-lg font-bold">
                          {format(date, "d")}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <button className="p-2 hover:bg-accent rounded-full transition-colors text-muted-foreground">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* Time Slots Grids */}
              <div className="p-6 flex flex-col gap-8 min-h-[300px]">
                {isSlotsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    <span className="ml-2 text-muted-foreground">
                      Loading available slots...
                    </span>
                  </div>
                ) : (
                  <>
                    {/* Morning */}
                    <div>
                      <h4 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                        <Sun className="w-5 h-5 text-amber-500" /> Morning
                        Sessions
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {morningSlots.length > 0 ? (
                          morningSlots.map((slot) => (
                            <button
                              key={slot.start_time}
                              disabled={!slot.is_available}
                              onClick={() => setSelectedSlot(slot)}
                              className={cn(
                                "py-3 px-4 rounded-lg border text-sm font-semibold transition-all text-center",
                                !slot.is_available &&
                                  "opacity-40 cursor-not-allowed bg-muted line-through",
                                selectedSlot?.start_time === slot.start_time
                                  ? "bg-primary text-primary-foreground border-primary shadow-md"
                                  : "border-border text-foreground hover:border-primary hover:text-primary",
                              )}
                            >
                              {slot.start_time} AM
                            </button>
                          ))
                        ) : (
                          <p className="col-span-full text-muted-foreground text-sm text-center py-4">
                            No morning slots available for this date
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Afternoon */}
                    <div>
                      <h4 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                        <Sunset className="w-5 h-5 text-orange-500" /> Afternoon
                        Sessions
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {afternoonSlots.length > 0 ? (
                          afternoonSlots.map((slot) => (
                            <button
                              key={slot.start_time}
                              disabled={!slot.is_available}
                              onClick={() => setSelectedSlot(slot)}
                              className={cn(
                                "py-3 px-4 rounded-lg border text-sm font-semibold transition-all text-center",
                                !slot.is_available &&
                                  "opacity-40 cursor-not-allowed bg-muted line-through",
                                selectedSlot?.start_time === slot.start_time
                                  ? "bg-primary text-primary-foreground border-primary shadow-md"
                                  : "border-border text-foreground hover:border-primary hover:text-primary",
                              )}
                            >
                              {slot.start_time} PM
                            </button>
                          ))
                        ) : (
                          <p className="col-span-full text-muted-foreground text-sm text-center py-4">
                            No afternoon slots available for this date
                          </p>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Summary & API Gating */}
        <div className="lg:col-span-4 flex flex-col gap-8">
          <div className="bg-card rounded-2xl border border-border p-6 shadow-sm sticky top-8 flex flex-col gap-6">
            <h3 className="font-serif text-xl font-bold text-foreground border-b border-border pb-4">
              Booking Summary
            </h3>

            {/* Consultation Type Toggle (Required for POST body) */}
            <div className="flex flex-col gap-3">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Session Type
              </label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-xl">
                <button
                  onClick={() => setConsultationType("advice_only")}
                  className={cn(
                    "text-xs py-2 rounded-lg font-bold transition-all",
                    consultationType === "advice_only"
                      ? "bg-card text-primary shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  Advice Only
                </button>
                <button
                  onClick={() => setConsultationType("plan_included")}
                  className={cn(
                    "text-xs py-2 rounded-lg font-bold transition-all",
                    consultationType === "plan_included"
                      ? "bg-card text-primary shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  With Plan
                </button>
              </div>
            </div>

            <ul className="flex flex-col gap-4">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-foreground text-sm font-medium">
                  {selectedSlot
                    ? `Scheduled for ${format(selectedDate, "MMM do")} at ${selectedSlot.start_time}`
                    : "No time slot selected"}
                </span>
              </li>
              <li className="flex items-start gap-3">
                <User className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span className="text-foreground text-sm font-medium">
                  1-on-1 with {currentNutritionist.name}
                </span>
              </li>
            </ul>

            <div className="bg-accent p-5 rounded-xl border border-primary/10 mt-2">
              <div className="flex justify-between items-end mb-1">
                <span className="text-sm font-bold text-secondary-foreground">
                  Total Due Today
                </span>
                <span className="font-serif text-3xl text-foreground font-bold">
                  $
                  {consultationType === "plan_included"
                    ? currentNutritionist.consultation_price + 50
                    : currentNutritionist.consultation_price}
                </span>
              </div>
              <p className="text-xs text-muted-foreground text-right mt-1">
                Includes platform service fee.
              </p>
            </div>

            <button
              disabled={!selectedSlot || isLoading}
              onClick={handleBooking}
              className="bg-button-primary bg-btn-primary text-button-primary-foreground font-bold text-base py-4 px-6 rounded-xl w-full hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-brand flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                "Confirm & Proceed to Payment"
              )}
            </button>

            <div className="border-t border-border pt-6 mt-2 flex flex-col gap-4">
              <div className="flex gap-3 items-start">
                <CalendarX className="w-5 h-5 text-destructive flex-shrink-0" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Flexible rescheduling up to <strong>24 hours</strong> before
                  the call.
                </p>
              </div>
              <div className="flex gap-3 items-start">
                <MailCheck className="w-5 h-5 text-primary flex-shrink-0" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Booking confirmation sent instantly via email with Zoom link.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
